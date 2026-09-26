import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/db';
import {
  createPractice,
  listPractices,
  listPublicPractices,
  getPractice,
  listResults,
  recordPracticeResult,
  publishPractice,
  unpublishPractice,
  deletePractice,
  getPracticeQuestions,
  gradePracticeAnswers,
  PracticeValidationError,
} from '@/lib/db/practices';
import type { PracticeAnswerInput, GradedPractice } from '@/lib/db/practices';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') ?? 'mine';
    const practiceId = searchParams.get('practice_id');

    if (scope === 'public') {
      // Criterios de la interfaz: texto libre (título/tema/creador/#código) + chip de modo
      const q = (searchParams.get('q') ?? '').slice(0, 100);
      const mode = (searchParams.get('mode') ?? '').slice(0, 40);
      return NextResponse.json({ practicas: await listPublicPractices({ q, mode }) });
    }

    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    if (practiceId) {
      const practice = await getPractice(practiceId);
      if (!practice) return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 });
      const canView = practice.created_by === session.id || practice.is_public;
      if (!canView) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      const questions = await getPracticeQuestions(practiceId);
      return NextResponse.json({ practica: practice, preguntas: questions });
    }

    if (scope === 'results') {
      return NextResponse.json({ resultados: await listResults(session.id) });
    }

    return NextResponse.json({ practicas: await listPractices(session.id) });
  } catch (err) {
    console.error('[practicas GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const action = String(body.action ?? 'create');

    if (action === 'create') {
      const title = String(body.title ?? '').trim();
      const modeCode = String(body.mode ?? body.mode_code ?? '').trim();
      const questions = Array.isArray(body.questions) ? body.questions : [];
      if (!title || title.length > 200 || !modeCode) {
        return NextResponse.json({ error: 'Título (máx. 200) y modo requeridos' }, { status: 400 });
      }
      if (questions.length === 0 || questions.length > 50) {
        return NextResponse.json({ error: 'Se requieren entre 1 y 50 preguntas' }, { status: 400 });
      }
      const normalized: Array<{ question_text: string; options: string[]; correct_index: number; explanation: string | null }> = [];
      for (const q of questions as Array<{ question_text?: string; options?: string[]; correct_index?: number; explanation?: string; question?: string; optionA?: string; optionB?: string; correctAnswer?: string }>) {
        const question_text = String(q.question_text ?? q.question ?? '').trim();
        const options = Array.isArray(q.options) && q.options.length > 0
          ? q.options.map((o) => String(o).trim())
          : [String(q.optionA ?? '').trim(), String(q.optionB ?? '').trim()];
        const correct_index = q.correct_index != null
          ? Number(q.correct_index)
          : q.correctAnswer === 'B' ? 1 : 0;
        if (!question_text || question_text.length > 1000) {
          return NextResponse.json({ error: 'Pregunta inválida' }, { status: 400 });
        }
        if (options.length !== 2 || !options[0] || !options[1] || options[0].length > 500 || options[1].length > 500) {
          return NextResponse.json({ error: 'Cada pregunta necesita exactamente 2 opciones' }, { status: 400 });
        }
        if (correct_index !== 0 && correct_index !== 1) {
          return NextResponse.json({ error: 'Respuesta correcta inválida' }, { status: 400 });
        }
        normalized.push({ question_text, options, correct_index, explanation: q.explanation ?? null });
      }
      let id: string;
      try {
        id = await createPractice({
          createdBy: session.id,
          title,
          description: body.description ?? null,
          topic: body.topic != null ? String(body.topic) : title,
          modeCode,
          isPublic: Boolean(body.is_public),
          questions: normalized,
        });
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Modo no encontrado')) {
          return NextResponse.json({ error: 'Modo de juego no válido' }, { status: 400 });
        }
        throw err;
      }
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (action === 'submit') {
      const practiceId = String(body.practice_id ?? '');
      const practice = await getPractice(practiceId);
      if (!practice) return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 });
      if (practice.created_by !== session.id && !practice.is_public) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const rawAnswers = body.answers;
      if (!Array.isArray(rawAnswers) || rawAnswers.length === 0) {
        return NextResponse.json({ error: 'Se requieren las respuestas de la práctica' }, { status: 400 });
      }
      const answers: PracticeAnswerInput[] = [];
      for (const a of rawAnswers as Array<{ index?: unknown; choice?: unknown }>) {
        const index = Number(a?.index);
        const choice = a?.choice;
        if (!Number.isInteger(index) || index < 0 || (choice !== 'A' && choice !== 'B' && choice !== null)) {
          return NextResponse.json({ error: 'Respuestas inválidas' }, { status: 400 });
        }
        answers.push({ index, choice });
      }
      // El servidor califica contra BD: el front solo envía elecciones.
      const questions = await getPracticeQuestions(practiceId);
      let graded: GradedPractice;
      try {
        graded = gradePracticeAnswers(questions, answers);
      } catch (err) {
        if (err instanceof PracticeValidationError) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        throw err;
      }
      // Guests juegan pero no persisten historial (regla actual)
      if (session.is_guest) {
        return NextResponse.json({
          ok: true,
          score: graded.score,
          correct: graded.correct,
          incorrect: graded.incorrect,
          total: graded.total,
          persisted: false,
        });
      }
      const id = await recordPracticeResult({ userId: session.id, practiceId, graded });
      return NextResponse.json({
        ok: true,
        id,
        score: graded.score,
        correct: graded.correct,
        incorrect: graded.incorrect,
        total: graded.total,
        persisted: true,
      }, { status: 201 });
    }

    if (action === 'publish' || action === 'unpublish' || action === 'delete') {
      const practiceId = String(body.practice_id ?? '');
      const practice = await getPractice(practiceId);
      if (!practice) return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 });
      if (practice.created_by !== session.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (action !== 'delete' && session.is_guest) {
        return NextResponse.json({ error: 'Crea una cuenta para publicar' }, { status: 403 });
      }
      const ok =
        action === 'publish' ? await publishPractice(practiceId, session.id)
        : action === 'unpublish' ? await unpublishPractice(practiceId, session.id)
        : await deletePractice(practiceId, session.id);
      if (!ok) return NextResponse.json({ error: `No se pudo ${action === 'delete' ? 'eliminar' : action === 'publish' ? 'publicar' : 'despublicar'}` }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[practicas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

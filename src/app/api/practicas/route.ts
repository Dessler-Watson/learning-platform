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
} from '@/lib/db/practices';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') ?? 'mine';
    const practiceId = searchParams.get('practice_id');

    if (scope === 'public') {
      return NextResponse.json({ practicas: await listPublicPractices() });
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
      if (!title || !modeCode || questions.length === 0) {
        return NextResponse.json({ error: 'Título, modo y preguntas requeridos' }, { status: 400 });
      }
      const id = await createPractice({
        createdBy: session.id,
        title,
        description: body.description ?? null,
        topic: body.topic != null ? String(body.topic) : title,
        modeCode,
        isPublic: Boolean(body.is_public),
        questions: questions.map((q: { question_text?: string; options?: string[]; correct_index?: number; explanation?: string; question?: string; optionA?: string; optionB?: string; correctAnswer?: string }) => {
          const question_text = String(q.question_text ?? q.question ?? '');
          const options = Array.isArray(q.options) && q.options.length > 0
            ? q.options.map(String)
            : [String(q.optionA ?? ''), String(q.optionB ?? '')];
          const correct_index = q.correct_index != null
            ? Number(q.correct_index)
            : q.correctAnswer === 'B' ? 1 : 0;
          return { question_text, options, correct_index, explanation: q.explanation ?? null };
        }),
      });
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    if (action === 'submit') {
      const practiceId = String(body.practice_id ?? '');
      const practice = await getPractice(practiceId);
      if (!practice) return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 });
      if (practice.created_by !== session.id && !practice.is_public) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      // Guests do not persist practice history
      if (session.is_guest) {
        const correct = Number(body.correct ?? 0);
        const total = Number(body.total ?? practice.question_count);
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        return NextResponse.json({ ok: true, score, persisted: false });
      }
      const correct = Number(body.correct ?? 0);
      const total = Number(body.total ?? practice.question_count);
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      const id = await recordPracticeResult({
        userId: session.id,
        practiceId,
        score,
        correct,
        total,
      });
      return NextResponse.json({ ok: true, id, score, persisted: true }, { status: 201 });
    }

    if (action === 'publish') {
      const practiceId = String(body.practice_id ?? '');
      const ok = await publishPractice(practiceId, session.id);
      if (!ok) return NextResponse.json({ error: 'No se pudo publicar' }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'unpublish') {
      const practiceId = String(body.practice_id ?? '');
      const ok = await unpublishPractice(practiceId, session.id);
      if (!ok) return NextResponse.json({ error: 'No se pudo despublicar' }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete') {
      const practiceId = String(body.practice_id ?? '');
      const ok = await deletePractice(practiceId, session.id);
      if (!ok) return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[practicas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

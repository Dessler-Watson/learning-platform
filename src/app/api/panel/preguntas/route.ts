import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_PER_COURSE = 30;

async function mapQuestion(row: {
  id: string;
  question_text: string;
  options: Array<{ id: string; text: string }>;
  correct_index: number | null;
  course_id: string | null;
  status: string;
  mode_code: string | null;
  teacher_id: string | null;
}) {
  const opts = row.options ?? [];
  const correctIdx = row.correct_index ?? 0;
  return {
    id: row.id,
    teacherId: row.teacher_id ?? '',
    juegoId: row.mode_code ?? 'decisiones',
    cursoId: row.course_id ?? '',
    enunciado: row.question_text,
    opciones: [opts[0]?.text ?? '', opts[1]?.text ?? ''] as [string, string],
    respuestaCorrecta: opts[correctIdx]?.text ?? opts[0]?.text ?? '',
    estado: row.status === 'active' ? ('activa' as const) : ('inactiva' as const),
  };
}

const SELECT_Q = `
  SELECT q.id, q.prompt AS question_text, q.course_id, q.status::text AS status,
         gm.code AS mode_code, c.teacher_id,
         (SELECT coalesce(json_agg(json_build_object('id', o.id, 'text', o.text) ORDER BY o.sort_order), '[]'::json)
          FROM question_options o WHERE o.question_id = q.id) AS options,
         (SELECT o.sort_order FROM question_options o WHERE o.question_id = q.id AND o.is_correct LIMIT 1) AS correct_index
  FROM questions q
  LEFT JOIN courses c ON c.id = q.course_id
  LEFT JOIN game_modes gm ON gm.id = c.game_mode_id
  WHERE q.deleted_at IS NULL AND q.practice_id IS NULL
`;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role === 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const cursoId = searchParams.get('curso_id');

    type QuestionRow = Parameters<typeof mapQuestion>[0];
    let rows: QuestionRow[];
    if (cursoId) {
      rows = await query<QuestionRow>(`${SELECT_Q} AND q.course_id = $1 ORDER BY q.sort_order, q.id`, [cursoId]);
    } else if (session.role === 'admin') {
      rows = await query<QuestionRow>(`${SELECT_Q} ORDER BY q.created_at DESC LIMIT 500`);
    } else {
      rows = await query<QuestionRow>(`${SELECT_Q} AND c.teacher_id = $1 ORDER BY q.created_at DESC LIMIT 500`, [session.id]);
    }
    const preguntas = await Promise.all(rows.map(mapQuestion));
    return NextResponse.json({ preguntas });
  } catch (err) {
    console.error('[panel preguntas GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role === 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await req.json();
    const action = String(body.action ?? 'create');

    if (action === 'create') {
      const cursoId = String(body.cursoId ?? body.curso_id ?? '');
      const course = await queryOne<{ id: string; teacher_id: string }>(
        `SELECT id, teacher_id FROM courses WHERE id = $1 AND deleted_at IS NULL`,
        [cursoId]
      );
      if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      const count = await queryOne<{ n: number }>(
        `SELECT count(*)::int AS n FROM questions WHERE course_id = $1 AND deleted_at IS NULL`,
        [cursoId]
      );
      if ((count?.n ?? 0) >= MAX_PER_COURSE) {
        return NextResponse.json({ error: `Se alcanzo el limite de ${MAX_PER_COURSE} preguntas en este curso.` }, { status: 400 });
      }
      const enunciado = String(body.enunciado ?? '').trim();
      if (!enunciado) return NextResponse.json({ error: 'Enunciado requerido' }, { status: 400 });
      const opciones: string[] = Array.isArray(body.opciones) ? body.opciones.map(String) : [];
      if (opciones.length < 2) return NextResponse.json({ error: 'Se requieren 2 opciones' }, { status: 400 });
      const respuesta = String(body.respuestaCorrecta ?? opciones[0]);

      const question = await queryOne<{ id: string }>(
        `INSERT INTO questions (course_id, author_id, prompt, status, sort_order)
         VALUES ($1, $2, $3, 'active', (SELECT coalesce(max(sort_order), 0) + 1 FROM questions WHERE course_id = $1))
         RETURNING id`,
        [cursoId, session.id, enunciado]
      );
      if (!question) return NextResponse.json({ error: 'No se pudo crear' }, { status: 500 });
      for (let i = 0; i < opciones.length; i++) {
        await query(
          `INSERT INTO question_options (question_id, text, sort_order, is_correct)
           VALUES ($1, $2, $3, $4)`,
          [question.id, opciones[i], i, opciones[i] === respuesta]
        );
      }
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'question', $2, 'created', '{}'::jsonb)`,
        [session.id, question.id]
      );
      const row = await queryOne<Parameters<typeof mapQuestion>[0]>(`${SELECT_Q} AND q.id = $1`, [question.id]);
      return NextResponse.json({ ok: true, pregunta: row ? await mapQuestion(row) : null }, { status: 201 });
    }

    if (action === 'update') {
      const id = String(body.id ?? '');
      const existing = await queryOne<{ id: string; teacher_id: string | null }>(
        `SELECT q.id, c.teacher_id FROM questions q LEFT JOIN courses c ON c.id = q.course_id WHERE q.id = $1 AND q.deleted_at IS NULL`,
        [id]
      );
      if (!existing || (session.role !== 'admin' && existing.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      if (body.enunciado != null) {
        await query(`UPDATE questions SET prompt = $2 WHERE id = $1`, [id, String(body.enunciado)]);
      }
      if (body.estado != null) {
        await query(`UPDATE questions SET status = $2::content_status WHERE id = $1`, [id, body.estado === 'activa' ? 'active' : 'inactive']);
      }
      if (Array.isArray(body.opciones) && body.opciones.length >= 2) {
        const respuesta = String(body.respuestaCorrecta ?? '');
        await query(`DELETE FROM question_options WHERE question_id = $1`, [id]);
        for (let i = 0; i < body.opciones.length; i++) {
          const text = String(body.opciones[i]);
          await query(
            `INSERT INTO question_options (question_id, text, sort_order, is_correct)
             VALUES ($1, $2, $3, $4)`,
            [id, text, i, text === respuesta]
          );
        }
      }
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'question', $2, 'updated', '{}'::jsonb)`,
        [session.id, id]
      );
      const row = await queryOne<Parameters<typeof mapQuestion>[0]>(`${SELECT_Q} AND q.id = $1`, [id]);
      return NextResponse.json({ ok: true, pregunta: row ? await mapQuestion(row) : null });
    }

    if (action === 'delete') {
      const id = String(body.id ?? '');
      const existing = await queryOne<{ id: string; teacher_id: string | null }>(
        `SELECT q.id, c.teacher_id FROM questions q LEFT JOIN courses c ON c.id = q.course_id WHERE q.id = $1 AND q.deleted_at IS NULL`,
        [id]
      );
      if (!existing || (session.role !== 'admin' && existing.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      await query(`UPDATE questions SET deleted_at = now() WHERE id = $1`, [id]);
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'question', $2, 'deleted', '{}'::jsonb)`,
        [session.id, id]
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel preguntas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

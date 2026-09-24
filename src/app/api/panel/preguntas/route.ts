import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getPool, query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_PER_COURSE = 30;
const MAX_PROMPT = 500;
const MAX_OPTION = 200;

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

type QuestionRow = Parameters<typeof mapQuestion>[0];

function validateAB(
  opcionesRaw: unknown,
  respuestaRaw: unknown
): { opciones: [string, string]; respuestaCorrecta: string } | { error: string } {
  const arr = Array.isArray(opcionesRaw) ? opcionesRaw.map((o) => String(o ?? '').trim()) : [];
  if (arr.length !== 2) return { error: 'Se requieren exactamente 2 opciones (A/B)' };
  if (!arr[0] || !arr[1]) return { error: 'Ambas opciones son obligatorias' };
  if (arr[0].length > MAX_OPTION || arr[1].length > MAX_OPTION) {
    return { error: `Cada opción no puede superar ${MAX_OPTION} caracteres` };
  }
  if (arr[0] === arr[1]) return { error: 'Las opciones A y B no pueden ser iguales' };
  const resp = String(respuestaRaw ?? '').trim();
  if (!resp || !arr.includes(resp)) return { error: 'La respuesta correcta debe coincidir con una de las opciones' };
  return { opciones: [arr[0], arr[1]], respuestaCorrecta: resp };
}

function parseEstado(raw: unknown): 'active' | 'inactive' | null {
  if (raw == null) return null;
  const v = String(raw);
  if (v === 'activa' || v === 'active') return 'active';
  if (v === 'inactiva' || v === 'inactive') return 'inactive';
  return null;
}

async function assertCourseAccess(
  cursoId: string,
  session: { id: string; role: string }
): Promise<{ id: string; teacher_id: string } | null> {
  const course = await queryOne<{ id: string; teacher_id: string }>(
    `SELECT id, teacher_id FROM courses WHERE id = $1 AND deleted_at IS NULL`,
    [cursoId]
  );
  if (!course) return null;
  if (session.role !== 'admin' && course.teacher_id !== session.id) return null;
  return course;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role === 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const cursoId = searchParams.get('curso_id');

    let rows: QuestionRow[];
    if (cursoId) {
      const course = await assertCourseAccess(cursoId, session);
      if (!course) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      rows = await query<QuestionRow>(`${SELECT_Q} AND q.course_id = $1 ORDER BY q.sort_order, q.id`, [cursoId]);
    } else if (session.role === 'admin') {
      rows = await query<QuestionRow>(`${SELECT_Q} ORDER BY q.created_at DESC LIMIT 500`);
    } else {
      rows = await query<QuestionRow>(
        `${SELECT_Q} AND c.teacher_id = $1 ORDER BY q.created_at DESC LIMIT 500`,
        [session.id]
      );
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
      if (!cursoId) return NextResponse.json({ error: 'Curso requerido' }, { status: 400 });
      const course = await assertCourseAccess(cursoId, session);
      if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

      const enunciado = String(body.enunciado ?? '').trim();
      if (!enunciado) return NextResponse.json({ error: 'Enunciado requerido' }, { status: 400 });
      if (enunciado.length > MAX_PROMPT) {
        return NextResponse.json({ error: `El enunciado no puede superar ${MAX_PROMPT} caracteres` }, { status: 400 });
      }

      const ab = validateAB(body.opciones, body.respuestaCorrecta);
      if ('error' in ab) return NextResponse.json({ error: ab.error }, { status: 400 });

      const estado = parseEstado(body.estado) ?? 'active';
      if (body.estado != null && parseEstado(body.estado) === null) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }

      const client = await getPool().connect();
      let questionId: string | null = null;
      try {
        await client.query('BEGIN');
        const countRes = await client.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM questions WHERE course_id = $1 AND deleted_at IS NULL`,
          [cursoId]
        );
        if ((countRes.rows[0]?.n ?? 0) >= MAX_PER_COURSE) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: `Se alcanzo el limite de ${MAX_PER_COURSE} preguntas en este curso.` },
            { status: 400 }
          );
        }
        const dup = await client.query(
          `SELECT 1 FROM questions WHERE course_id = $1 AND lower(prompt) = lower($2) AND deleted_at IS NULL LIMIT 1`,
          [cursoId, enunciado]
        );
        if (dup.rowCount) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Ya existe una pregunta con ese enunciado en este curso' }, { status: 409 });
        }

        const qRes = await client.query<{ id: string }>(
          `INSERT INTO questions (course_id, author_id, prompt, status, sort_order)
           VALUES ($1, $2, $3, $4::content_status, (SELECT coalesce(max(sort_order), 0) + 1 FROM questions WHERE course_id = $1))
           RETURNING id`,
          [cursoId, session.id, enunciado, estado]
        );
        questionId = qRes.rows[0]?.id ?? null;
        if (!questionId) throw new Error('No se pudo crear');
        for (let i = 0; i < ab.opciones.length; i++) {
          await client.query(
            `INSERT INTO question_options (question_id, text, sort_order, is_correct)
             VALUES ($1, $2, $3, $4)`,
            [questionId, ab.opciones[i], i, ab.opciones[i] === ab.respuestaCorrecta]
          );
        }
        await client.query(
          `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
           VALUES ($1, 'question', $2, 'created', '{}'::jsonb)`,
          [session.id, questionId]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
      const row = questionId
        ? await queryOne<QuestionRow>(`${SELECT_Q} AND q.id = $1`, [questionId])
        : null;
      return NextResponse.json({ ok: true, pregunta: row ? await mapQuestion(row) : null }, { status: 201 });
    }

    if (action === 'update') {
      const id = String(body.id ?? '');
      const existing = await queryOne<{ id: string; course_id: string | null; teacher_id: string | null }>(
        `SELECT q.id, q.course_id, c.teacher_id
         FROM questions q LEFT JOIN courses c ON c.id = q.course_id
         WHERE q.id = $1 AND q.deleted_at IS NULL AND q.practice_id IS NULL`,
        [id]
      );
      if (!existing || (session.role !== 'admin' && existing.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }

      let enunciado: string | null = null;
      if (body.enunciado != null) {
        enunciado = String(body.enunciado).trim();
        if (!enunciado) return NextResponse.json({ error: 'Enunciado requerido' }, { status: 400 });
        if (enunciado.length > MAX_PROMPT) {
          return NextResponse.json({ error: `El enunciado no puede superar ${MAX_PROMPT} caracteres` }, { status: 400 });
        }
      }

      let ab: { opciones: [string, string]; respuestaCorrecta: string } | null = null;
      if (body.opciones != null || body.respuestaCorrecta != null) {
        const validated = validateAB(
          body.opciones ?? [body.respuestaCorrecta, ''],
          body.respuestaCorrecta ?? (Array.isArray(body.opciones) ? body.opciones[0] : '')
        );
        if ('error' in validated) return NextResponse.json({ error: validated.error }, { status: 400 });
        ab = validated;
      }

      let estado: 'active' | 'inactive' | null = null;
      if (body.estado != null) {
        estado = parseEstado(body.estado);
        if (estado === null) return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }

      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        if (enunciado != null && existing.course_id) {
          const dup = await client.query(
            `SELECT 1 FROM questions
             WHERE course_id = $1 AND lower(prompt) = lower($2) AND id <> $3 AND deleted_at IS NULL LIMIT 1`,
            [existing.course_id, enunciado, id]
          );
          if (dup.rowCount) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Ya existe una pregunta con ese enunciado en este curso' }, { status: 409 });
          }
        }
        await client.query(
          `UPDATE questions SET
             prompt = COALESCE($2, prompt),
             status = COALESCE($3::content_status, status)
           WHERE id = $1 AND deleted_at IS NULL`,
          [id, enunciado, estado]
        );
        if (ab) {
          await client.query(`DELETE FROM question_options WHERE question_id = $1`, [id]);
          for (let i = 0; i < ab.opciones.length; i++) {
            await client.query(
              `INSERT INTO question_options (question_id, text, sort_order, is_correct)
               VALUES ($1, $2, $3, $4)`,
              [id, ab.opciones[i], i, ab.opciones[i] === ab.respuestaCorrecta]
            );
          }
        }
        await client.query(
          `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
           VALUES ($1, 'question', $2, 'updated', '{}'::jsonb)`,
          [session.id, id]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
      const row = await queryOne<QuestionRow>(`${SELECT_Q} AND q.id = $1`, [id]);
      return NextResponse.json({ ok: true, pregunta: row ? await mapQuestion(row) : null });
    }

    if (action === 'delete') {
      const id = String(body.id ?? '');
      const existing = await queryOne<{ id: string; teacher_id: string | null }>(
        `SELECT q.id, c.teacher_id
         FROM questions q LEFT JOIN courses c ON c.id = q.course_id
         WHERE q.id = $1 AND q.deleted_at IS NULL AND q.practice_id IS NULL`,
        [id]
      );
      if (!existing || (session.role !== 'admin' && existing.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        await client.query(`UPDATE questions SET deleted_at = now() WHERE id = $1`, [id]);
        await client.query(
          `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
           VALUES ($1, 'question', $2, 'deleted', '{}'::jsonb)`,
          [session.id, id]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel preguntas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

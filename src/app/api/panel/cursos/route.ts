import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getPool, query, queryOne, getCourse, listCourseQuestions, listCourses } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_NAME = 120;
const MAX_DESC = 500;
const MAX_PREGUNTAS_PASTE = 30;

const MODE_ALIASES: Record<string, string> = {
  'juego-1': 'decisiones',
  'juego-2': 'lava',
  'juego-3': 'tierras',
  'juego-4': 'abismos',
  decisiones: 'decisiones',
  lava: 'lava',
  tierras: 'tierras',
  abismos: 'abismos',
};

function normalizeModeCode(raw: unknown): string | null {
  const key = String(raw ?? '').trim().toLowerCase();
  if (!key) return null;
  return MODE_ALIASES[key] ?? null;
}

async function resolveMode(raw: unknown): Promise<{ id: string; code: string } | null> {
  const code = normalizeModeCode(raw);
  if (!code) return null;
  return queryOne<{ id: string; code: string }>(`SELECT id, code FROM game_modes WHERE code = $1`, [code]);
}

type ModeRow = { id: string };

async function mapCourse(c: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  teacher_id: string;
  mode_code: string;
  created_at: string;
}) {
  const stats = await queryOne<{ total_estudiantes: number; promedio: number; total_preguntas: number }>(
    `SELECT
       (SELECT count(*)::int FROM course_enrollments WHERE course_id = $1) AS total_estudiantes,
       coalesce((SELECT round(avg(progress))::int FROM course_enrollments WHERE course_id = $1), 0) AS promedio,
       (SELECT count(*)::int FROM questions WHERE course_id = $1 AND deleted_at IS NULL AND status = 'active') AS total_preguntas`,
    [c.id]
  );
  return {
    id: c.id,
    teacherId: c.teacher_id,
    nombre: c.name,
    descripcion: c.description ?? '',
    estado: c.status === 'active' ? 'activo' : c.status === 'inactive' ? 'inactivo' : 'borrador',
    fechaCreacion: c.created_at.split('T')[0],
    gameModeId: c.mode_code,
    totalEstudiantes: stats?.total_estudiantes ?? 0,
    promedio: stats?.promedio ?? 0,
    progreso: stats?.promedio ?? 0,
    totalPreguntas: stats?.total_preguntas ?? 0,
  };
}

function parseStatus(raw: unknown): 'active' | 'inactive' | 'draft' | null {
  const v = String(raw ?? '');
  if (v === 'activo' || v === 'active') return 'active';
  if (v === 'inactivo' || v === 'inactive') return 'inactive';
  if (v === 'borrador' || v === 'draft') return 'draft';
  if (raw == null || raw === '') return null;
  return null;
}

type IncomingQuestion = {
  enunciado: string;
  opciones: [string, string];
  respuestaCorrecta: string;
  estado: 'activa' | 'inactiva';
};

function validateAB(opcionesRaw: unknown, respuestaRaw: unknown): { opciones: [string, string]; respuestaCorrecta: string } | { error: string } {
  const arr = Array.isArray(opcionesRaw) ? opcionesRaw.map((o) => String(o ?? '').trim()) : [];
  if (arr.length !== 2) return { error: 'Se requieren exactamente 2 opciones (A/B)' };
  if (!arr[0] || !arr[1]) return { error: 'Ambas opciones son obligatorias' };
  if (arr[0] === arr[1]) return { error: 'Las opciones A y B no pueden ser iguales' };
  const resp = String(respuestaRaw ?? '').trim();
  if (!resp || !arr.includes(resp)) return { error: 'La respuesta correcta debe coincidir con una de las opciones' };
  return { opciones: [arr[0], arr[1]], respuestaCorrecta: resp };
}

function normalizeIncomingQuestion(raw: Record<string, unknown>): IncomingQuestion | { error: string } {
  const enunciado = String(raw.enunciado ?? raw.question_text ?? raw.prompt ?? '').trim();
  if (!enunciado) return { error: 'Enunciado requerido' };

  let opcionesRaw: unknown = raw.opciones;
  let respuesta = raw.respuestaCorrecta;

  if ((!Array.isArray(opcionesRaw) || opcionesRaw.length === 0) && Array.isArray(raw.options)) {
    const opts = raw.options as Array<Record<string, unknown>>;
    const texts = opts.map((o) => (o && typeof o === 'object' ? String((o as { text?: unknown }).text ?? '') : String(o)));
    opcionesRaw = texts;
    if (respuesta == null) {
      const correctIdx = typeof raw.correct_index === 'number' ? (raw.correct_index as number) : opts.findIndex((o) => o?.is_correct === true);
      if (correctIdx >= 0 && texts[correctIdx] != null) respuesta = texts[correctIdx];
    }
  }

  if (Array.isArray(opcionesRaw) && opcionesRaw.length > 0 && typeof opcionesRaw[0] === 'object' && opcionesRaw[0] !== null) {
    const opts = opcionesRaw as Array<{ text?: unknown; is_correct?: unknown }>;
    const texts = opts.map((o) => String(o?.text ?? '').trim());
    if (respuesta == null) {
      const ci = opts.findIndex((o) => o?.is_correct === true);
      respuesta = ci >= 0 ? texts[ci] : texts[0];
    }
    opcionesRaw = texts;
  }

  const ab = validateAB(opcionesRaw, respuesta);
  if ('error' in ab) return ab;

  const estadoRaw = String(raw.estado ?? 'activa');
  return {
    enunciado,
    opciones: ab.opciones,
    respuestaCorrecta: ab.respuestaCorrecta,
    estado: estadoRaw === 'inactiva' || estadoRaw === 'inactive' ? 'inactiva' : 'activa',
  };
}

async function loadQuestionsAsPreguntas(courseId: string, teacherId: string, modeCode: string) {
  const rows = await query<{
    id: string;
    prompt: string;
    status: string;
    course_id: string;
    teacher_id: string;
    options: Array<{ id: string; text: string; is_correct: boolean }>;
  }>(
    `SELECT q.id, q.prompt, q.status::text AS status, q.course_id, c.teacher_id,
            (SELECT coalesce(json_agg(json_build_object('id', o.id, 'text', o.text, 'is_correct', o.is_correct) ORDER BY o.sort_order), '[]'::json)
             FROM question_options o WHERE o.question_id = q.id) AS options
     FROM questions q
     JOIN courses c ON c.id = q.course_id
     WHERE q.course_id = $1 AND q.deleted_at IS NULL AND q.practice_id IS NULL
     ORDER BY q.sort_order, q.id`,
    [courseId]
  );
  return rows.map((r) => {
    const opts = r.options ?? [];
    const correct = opts.find((o) => o.is_correct);
    return {
      id: r.id,
      teacherId: r.teacher_id ?? teacherId,
      juegoId: modeCode,
      cursoId: r.course_id ?? courseId,
      enunciado: r.prompt,
      opciones: [opts[0]?.text ?? '', opts[1]?.text ?? ''] as [string, string],
      respuestaCorrecta: correct?.text ?? opts[0]?.text ?? '',
      estado: r.status === 'active' ? ('activa' as const) : ('inactiva' as const),
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role === 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const course = await getCourse(id);
      if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      const questions = await listCourseQuestions(id);
      return NextResponse.json({ curso: await mapCourse(course), preguntas: questions });
    }

    const rows = await listCourses({ teacherId: session.role === 'admin' ? undefined : session.id });
    const cursos = await Promise.all(rows.map(mapCourse));
    return NextResponse.json({ cursos });
  } catch (err) {
    console.error('[panel cursos GET]', err);
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
      const name = String(body.nombre ?? body.name ?? '').trim();
      if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      if (name.length > MAX_NAME) return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME} caracteres` }, { status: 400 });
      const descripcion = body.descripcion != null ? String(body.descripcion) : body.description != null ? String(body.description) : '';
      if (descripcion.length > MAX_DESC) return NextResponse.json({ error: `La descripción no puede superar ${MAX_DESC} caracteres` }, { status: 400 });
      const mode = await resolveMode(body.gameModeId ?? body.mode_code ?? 'decisiones');
      if (!mode) return NextResponse.json({ error: 'Modo no válido. Usa decisiones, lava, tierras o abismos' }, { status: 400 });
      const status = parseStatus(body.estado) ?? 'draft';
      if (body.estado != null && status === 'draft' && parseStatus(body.estado) === null && String(body.estado) !== '') {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }
      const created = await queryOne<{ id: string }>(
        `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
         VALUES ($1, $2, $3, $4::text, $5::course_status)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [session.id, mode.id, name, descripcion || null, status]
      );
      if (!created) {
        const clash = await queryOne(
          `SELECT 1 FROM courses WHERE teacher_id = $1 AND game_mode_id = $2 AND lower(name) = lower($3) AND deleted_at IS NULL`,
          [session.id, mode.id, name]
        );
        if (clash) return NextResponse.json({ error: 'Ya existe un curso con ese nombre' }, { status: 409 });
        throw new Error('No se pudo crear');
      }
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'course', $2, 'created', jsonb_build_object('name', coalesce($3::text, '')))`,
        [session.id, created.id, name]
      );
      const row = await getCourse(created.id);
      return NextResponse.json({ ok: true, curso: row ? await mapCourse(row) : null }, { status: 201 });
    }

    if (action === 'update') {
      const id = String(body.id ?? '');
      const course = await getCourse(id);
      if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }

      let name: string | null = null;
      if (body.nombre != null) {
        name = String(body.nombre).trim();
        if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
        if (name.length > MAX_NAME) return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME} caracteres` }, { status: 400 });
      }
      let descripcion: string | null = null;
      if (body.descripcion != null) {
        descripcion = String(body.descripcion);
        if (descripcion.length > MAX_DESC) return NextResponse.json({ error: `La descripción no puede superar ${MAX_DESC} caracteres` }, { status: 400 });
      }
      const status = body.estado != null ? parseStatus(body.estado) : null;
      if (body.estado != null && status === null) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }

      let mode: { id: string } | null = null;
      if (body.gameModeId != null) {
        mode = (await resolveMode(body.gameModeId)) as { id: string } | null;
        if (!mode) return NextResponse.json({ error: 'Modo no válido. Usa decisiones, lava, tierras o abismos' }, { status: 400 });
      }

      try {
        const updated = await queryOne<{ id: string }>(
          `UPDATE courses SET
             name = COALESCE($2, name),
             description = COALESCE($3, description),
             status = COALESCE($4::course_status, status),
             game_mode_id = COALESCE($5::uuid, game_mode_id)
           WHERE id = $1 AND deleted_at IS NULL
           RETURNING id`,
          [id, name, descripcion, status, mode?.id ?? null]
        );
        if (!updated) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 400 });
      } catch (err) {
        const e = err as { code?: string };
        if (e?.code === '23505') {
          return NextResponse.json({ error: 'Ya existe un curso con ese nombre' }, { status: 409 });
        }
        throw err;
      }
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'course', $2, 'updated', '{}'::jsonb)`,
        [session.id, id]
      );
      const row = await getCourse(id);
      return NextResponse.json({ ok: true, curso: row ? await mapCourse(row) : null });
    }

    if (action === 'delete') {
      const id = String(body.id ?? '');
      const course = await getCourse(id);
      if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        await client.query(`UPDATE questions SET deleted_at = now() WHERE course_id = $1 AND deleted_at IS NULL`, [id]);
        await client.query(`UPDATE courses SET deleted_at = now() WHERE id = $1`, [id]);
        await client.query(
          `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
           VALUES ($1, 'course', $2, 'deleted', '{}'::jsonb)`,
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

    if (action === 'copy') {
      const sourceId = String(body.id ?? '');
      const source = await getCourse(sourceId);
      if (!source || (session.role !== 'admin' && source.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      const preguntas = await loadQuestionsAsPreguntas(sourceId, source.teacher_id, source.mode_code);
      return NextResponse.json({ curso: await mapCourse(source), preguntas });
    }

    if (action === 'paste') {
      const data = body.curso as { nombre?: string; descripcion?: string; gameModeId?: string; estado?: string } | undefined;
      const rawPreguntas: unknown[] = Array.isArray(body.preguntas) ? body.preguntas : [];
      if (!data?.nombre || !String(data.nombre).trim()) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
      const mode = (await resolveMode(body.gameModeId ?? data.gameModeId ?? 'decisiones')) as { id: string } | null;
      if (!mode) return NextResponse.json({ error: 'Modo no válido. Usa decisiones, lava, tierras o abismos' }, { status: 400 });

      const nombre = String(body.nombrePersonalizado ?? `${data.nombre} (Copia)`).trim();
      if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      if (nombre.length > MAX_NAME) return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME} caracteres` }, { status: 400 });

      const parsed: IncomingQuestion[] = [];
      for (const q of rawPreguntas.slice(0, MAX_PREGUNTAS_PASTE)) {
        const norm = normalizeIncomingQuestion((q ?? {}) as Record<string, unknown>);
        if ('error' in norm) return NextResponse.json({ error: norm.error }, { status: 400 });
        parsed.push(norm);
      }

      const status = parseStatus(data.estado) ?? 'active';
      const client = await getPool().connect();
      let createdId: string | null = null;
      try {
        await client.query('BEGIN');
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
           VALUES ($1, $2, $3, $4::text, $5::course_status)
           RETURNING id`,
          [session.id, mode.id, nombre, data.descripcion ?? null, status]
        );
        createdId = inserted.rows[0]?.id ?? null;
        if (!createdId) throw new Error('No se pudo crear el curso');

        for (let qi = 0; qi < parsed.length; qi++) {
          const q = parsed[qi];
          const qRes = await client.query<{ id: string }>(
            `INSERT INTO questions (course_id, author_id, prompt, status, sort_order)
             VALUES ($1, $2, $3, $4::content_status, $5)
             RETURNING id`,
            [createdId, session.id, q.enunciado, q.estado === 'inactiva' ? 'inactive' : 'active', qi + 1]
          );
          const qid = qRes.rows[0]?.id;
          if (!qid) continue;
          for (let i = 0; i < q.opciones.length; i++) {
            await client.query(
              `INSERT INTO question_options (question_id, text, sort_order, is_correct)
               VALUES ($1, $2, $3, $4)`,
              [qid, q.opciones[i], i, q.opciones[i] === q.respuestaCorrecta]
            );
          }
        }

        await client.query(
          `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
           VALUES ($1, 'course', $2, 'created', jsonb_build_object('name', coalesce($3::text, ''), 'source', 'paste'))`,
          [session.id, createdId, nombre]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        const e = err as { code?: string };
        if (e?.code === '23505') {
          return NextResponse.json({ error: 'Ya existe un curso con ese nombre' }, { status: 409 });
        }
        throw err;
      } finally {
        client.release();
      }
      const row = createdId ? await getCourse(createdId) : null;
      return NextResponse.json({ ok: true, curso: row ? await mapCourse(row) : null }, { status: 201 });
    }

    if (action === 'exists') {
      const name = String(body.nombre ?? '').trim();
      if (!name) return NextResponse.json({ existe: false });
      const mode = await resolveMode(body.gameModeId ?? '');
      if (!mode) return NextResponse.json({ existe: false });
      const clash = await query(
        `SELECT 1 FROM courses
         WHERE teacher_id = $1 AND lower(name) = lower($2) AND deleted_at IS NULL
           AND game_mode_id = $3`,
        [session.id, name, mode.id]
      );
      return NextResponse.json({ existe: clash.length > 0 });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel cursos POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

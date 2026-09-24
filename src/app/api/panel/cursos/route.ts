import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne, getCourse, listCourseQuestions, listCourses } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
      const modeCode = String(body.gameModeId ?? body.mode_code ?? 'decisiones');
      const mode = await queryOne<{ id: string }>(`SELECT id FROM game_modes WHERE code = $1`, [modeCode]);
      if (!mode) return NextResponse.json({ error: 'Modo no encontrado' }, { status: 400 });
      const status = body.estado === 'activo' ? 'active' : body.estado === 'inactivo' ? 'inactive' : 'draft';
      const created = await queryOne<{ id: string }>(
        `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
         VALUES ($1, $2, $3, $4, $5::course_status)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [session.id, mode.id, name, body.descripcion ?? body.description ?? null, status]
      );
      if (!created) {
        const clash = await queryOne(`SELECT 1 FROM courses WHERE teacher_id = $1 AND game_mode_id = $2 AND lower(name) = lower($3) AND deleted_at IS NULL`, [session.id, mode.id, name]);
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
      const status = body.estado === 'activo' ? 'active' : body.estado === 'inactivo' ? 'inactive' : body.estado === 'borrador' ? 'draft' : null;
      const updated = await queryOne<{ id: string }>(
        `UPDATE courses SET
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           status = COALESCE($4::course_status, status)
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [id, body.nombre != null ? String(body.nombre) : null, body.descripcion != null ? String(body.descripcion) : null, status]
      );
      if (!updated) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 400 });
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
      await query(`UPDATE courses SET deleted_at = now() WHERE id = $1`, [id]);
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'course', $2, 'deleted', '{}'::jsonb)`,
        [session.id, id]
      );
      return NextResponse.json({ ok: true });
    }

    if (action === 'copy') {
      const sourceId = String(body.id ?? '');
      const source = await getCourse(sourceId);
      if (!source) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      const preguntas = await listCourseQuestions(sourceId);
      return NextResponse.json({ curso: await mapCourse(source), preguntas });
    }

    if (action === 'paste') {
      const data = body.curso as { nombre: string; descripcion?: string; gameModeId?: string };
      const preguntas = Array.isArray(body.preguntas) ? body.preguntas : [];
      if (!data?.nombre) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      const modeCode = String(body.gameModeId ?? data.gameModeId ?? 'decisiones');
      const mode = await queryOne<{ id: string }>(`SELECT id FROM game_modes WHERE code = $1 OR code = $2`, [modeCode, modeCode.replace('juego-', '')]);
      const modeId = mode?.id ?? (await queryOne<{ id: string }>(`SELECT id FROM game_modes ORDER BY sort_order LIMIT 1`))?.id;
      if (!modeId) return NextResponse.json({ error: 'Modo no encontrado' }, { status: 400 });
      const nombre = String(body.nombrePersonalizado ?? `${data.nombre} (Copia)`);
      const created = await queryOne<{ id: string }>(
        `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
         VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
        [session.id, modeId, nombre, data.descripcion ?? null]
      );
      if (!created) return NextResponse.json({ error: 'No se pudo pegar' }, { status: 500 });
      const limit = 30;
      for (const q of preguntas.slice(0, limit)) {
        const question = await queryOne<{ id: string }>(
          `INSERT INTO questions (course_id, author_id, prompt, sort_order)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [created.id, session.id, String(q.enunciado ?? q.question_text ?? ''), 0]
        );
        if (!question) continue;
        const opciones: string[] = Array.isArray(q.opciones) ? q.opciones : [q.optionA ?? '', q.optionB ?? ''];
        const correcta = String(q.respuestaCorrecta ?? '');
        for (let i = 0; i < opciones.length; i++) {
          await query(
            `INSERT INTO question_options (question_id, text, sort_order, is_correct)
             VALUES ($1, $2, $3, $4)`,
            [question.id, opciones[i], i, opciones[i] === correcta]
          );
        }
        await query(
          `UPDATE questions SET sort_order = (SELECT coalesce(max(sort_order), 0) + 1 FROM questions WHERE course_id = $1) WHERE id = $2`,
          [created.id, question.id]
        );
      }
      const row = await getCourse(created.id);
      return NextResponse.json({ ok: true, curso: row ? await mapCourse(row) : null }, { status: 201 });
    }

    if (action === 'exists') {
      const name = String(body.nombre ?? '').trim();
      const modeCode = String(body.gameModeId ?? '');
      const clash = await query(
        `SELECT 1 FROM courses
         WHERE teacher_id = $1 AND lower(name) = lower($2) AND deleted_at IS NULL
           AND game_mode_id = (SELECT id FROM game_modes WHERE code = $3 OR code = $4 LIMIT 1)`,
        [session.id, name, modeCode, modeCode]
      );
      return NextResponse.json({ existe: clash.length > 0 });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel cursos POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

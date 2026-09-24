import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role === 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const teacherFilter = session.role === 'admin' ? null : session.id;

    const stats = await queryOne<{
      total_cursos: number;
      total_estudiantes: number;
      total_preguntas: number;
      juegos_activos: number;
    }>(
      `SELECT
         (SELECT count(*)::int FROM courses WHERE deleted_at IS NULL AND ($1::uuid IS NULL OR teacher_id = $1)) AS total_cursos,
         (SELECT count(DISTINCT ce.student_id)::int
            FROM course_enrollments ce
            JOIN courses c ON c.id = ce.course_id AND c.deleted_at IS NULL
           WHERE ($1::uuid IS NULL OR c.teacher_id = $1)) AS total_estudiantes,
         (SELECT count(*)::int FROM questions q
            JOIN courses c ON c.id = q.course_id AND c.deleted_at IS NULL
           WHERE q.deleted_at IS NULL AND q.status = 'active' AND ($1::uuid IS NULL OR c.teacher_id = $1)) AS total_preguntas,
         (SELECT count(*)::int FROM game_modes) AS juegos_activos`,
      [teacherFilter]
    );

    const activity = await query<{
      id: string;
      entity_type: string;
      action: string;
      metadata: Record<string, unknown>;
      created_at: string;
      entity_name: string | null;
      actor_name: string | null;
    }>(
      `SELECT ae.id, ae.entity_type, ae.action, ae.metadata, ae.created_at::text AS created_at,
              coalesce(c.name, r.name, q.prompt, u.nombre) AS entity_name,
              coalesce(au.nombre, 'Sistema') AS actor_name
       FROM audit_events ae
       LEFT JOIN courses c ON c.id = ae.entity_id AND ae.entity_type = 'course'
       LEFT JOIN rooms r ON r.id = ae.entity_id AND ae.entity_type = 'room'
       LEFT JOIN questions q ON q.id = ae.entity_id AND ae.entity_type = 'question'
       LEFT JOIN users u ON u.id = ae.entity_id AND ae.entity_type = 'user'
       LEFT JOIN users au ON au.id = ae.actor_id
       WHERE ($1::uuid IS NULL OR ae.actor_id = $1)
       ORDER BY ae.created_at DESC
       LIMIT 30`,
      [teacherFilter]
    );

    const tipoMap: Record<string, string> = {
      'room:created': 'sala_creada',
      'room:finished': 'sala_finalizada',
      'course:created': 'curso_creado',
      'course:updated': 'curso_actualizado',
      'question:created': 'pregunta_creada',
      'question:updated': 'pregunta_modificada',
      'user:created': 'registro',
      'user:login': 'acceso',
    };

    const actividades = activity.map((a) => ({
      id: a.id,
      teacherId: session.id,
      tipo: (tipoMap[`${a.entity_type}:${a.action}`] ?? 'acceso') as
        | 'partida'
        | 'completado'
        | 'puntaje'
        | 'registro'
        | 'acceso'
        | 'curso_creado'
        | 'curso_actualizado'
        | 'curso_copiado'
        | 'pregunta_creada'
        | 'pregunta_modificada'
        | 'sala_finalizada'
        | 'sala_creada',
      descripcion:
        a.entity_type === 'course'
          ? `Curso "${a.entity_name ?? ''}" ${a.action === 'created' ? 'creado' : a.action === 'deleted' ? 'eliminado' : 'actualizado'}`
          : a.entity_type === 'question'
            ? 'Pregunta modificada'
            : a.entity_type === 'room'
              ? `Sala "${a.entity_name ?? ''}" ${a.action === 'created' ? 'creada' : a.action}`
              : `Actividad de ${a.actor_name ?? 'usuario'}`,
      fecha: a.created_at,
      salaNombre: a.entity_type === 'room' ? a.entity_name ?? undefined : undefined,
      juegoNombre: undefined,
      cursoNombre: a.entity_type === 'course' ? a.entity_name ?? undefined : undefined,
    }));

    return NextResponse.json({
      estadisticas: {
        totalCursos: stats?.total_cursos ?? 0,
        totalEstudiantes: stats?.total_estudiantes ?? 0,
        juegosActivos: stats?.juegos_activos ?? 0,
        totalPreguntas: stats?.total_preguntas ?? 0,
      },
      actividades,
    });
  } catch (err) {
    console.error('[panel inicio GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

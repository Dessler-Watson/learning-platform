import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne } from '@/lib/db';
import { getRoomById, listParticipants, startRoom, finishRoom, createRoom } from '@/lib/db/rooms';

export const dynamic = 'force-dynamic';

function mapEstado(status: string): 'esperando' | 'en_curso' | 'finalizada' | 'archivada' {
  if (status === 'waiting') return 'esperando';
  if (status === 'in_progress') return 'en_curso';
  if (status === 'archived') return 'archivada';
  return 'finalizada';
}

async function mapRoom(room: {
  id: string;
  code: string;
  name: string | null;
  mode_code: string;
  teacher_id: string;
  course_id: string;
  max_players: number | null;
  status: string;
  created_at: string;
}) {
  const parts = await listParticipants(room.id);
  const matchStats = await queryOne<{
    total_preguntas: number;
    status: string | null;
  }>(
    `SELECT coalesce(m.question_count, 0)::int AS total_preguntas, m.status::text AS status
     FROM matches m WHERE m.room_id = $1 ORDER BY m.created_at DESC LIMIT 1`,
    [room.id]
  );

  const live = await query<{
    user_id: string;
    display_name: string;
    avatar_sort: number | null;
    score: number;
    correctas: number;
    incorrectas: number;
    progreso: number;
    status: string;
    eliminated_on_question: number | null;
    stars: number;
  }>(
    `SELECT mp.user_id, mp.display_name, a.sort_order AS avatar_sort, mp.score,
            coalesce(pa.correctas, 0)::int AS correctas,
            coalesce(pa.incorrectas, 0)::int AS incorrectas,
            coalesce(pa.progreso, 0)::int AS progreso,
            mp.status::text AS status,
            mp.eliminated_on_question,
            coalesce(lp.stars, 0)::int AS stars
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id
     LEFT JOIN avatars a ON a.id = (SELECT avatar_id FROM room_participants rp WHERE rp.room_id = m.room_id AND rp.user_id = mp.user_id LIMIT 1)
     LEFT JOIN player_league_progress lp ON lp.user_id = mp.user_id
     LEFT JOIN LATERAL (
       SELECT
         count(*) FILTER (WHERE is_correct IS TRUE)::int AS correctas,
         count(*) FILTER (WHERE is_correct IS FALSE)::int AS incorrectas,
         coalesce(max(question_position), -1) + 1 AS progreso
       FROM participant_answers WHERE participant_id = mp.id
     ) pa ON TRUE
     WHERE m.room_id = $1
     ORDER BY mp.score DESC`,
    [room.id]
  );

  const participantes =
    live.length > 0
      ? live.map((p) => ({
          estudianteId: p.user_id,
          nombre: p.display_name,
          avatar_id: p.avatar_sort ?? 1,
          estrellas: p.stars,
          progreso: p.progreso,
          correctas: p.correctas,
          incorrectas: p.incorrectas,
          estado:
            p.status === 'eliminated'
              ? ('eliminado' as const)
              : p.status === 'finished'
                ? ('finalizado' as const)
                : p.progreso > 0
                  ? ('jugando' as const)
                  : ('esperando' as const),
          puntosNetos: p.score,
          distanciaLava: 3,
          eliminadoEn: p.eliminated_on_question ?? undefined,
        }))
      : await Promise.all(
          parts.map(async (p) => {
            const stars = await queryOne<{ stars: number }>(
              `SELECT coalesce(stars, 0)::int AS stars FROM player_league_progress WHERE user_id = $1`,
              [p.user_id]
            );
            return {
              estudianteId: p.user_id,
              nombre: p.display_name,
              avatar_id: p.avatar_sort ?? 1,
              estrellas: stars?.stars ?? 0,
              progreso: 0,
              correctas: 0,
              incorrectas: 0,
              estado: 'esperando' as const,
              puntosNetos: 0,
              distanciaLava: 3,
            };
          })
        );

  return {
    id: room.id,
    teacherId: room.teacher_id,
    juegoId: room.mode_code,
    cursoId: room.course_id,
    nombre: room.name ?? 'Sala',
    codigo: room.code,
    estado: mapEstado(room.status),
    totalPreguntas: matchStats?.total_preguntas || 10,
    createdAt: room.created_at,
    startedAt: null,
    finishedAt: null,
    participantes,
    maxPlayers: room.max_players,
    matchStatus: matchStats?.status ?? null,
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
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      return NextResponse.json({ sala: await mapRoom(room) });
    }

    type RoomRow = Parameters<typeof mapRoom>[0];
    const rows = await query<RoomRow>(
      `SELECT r.id, r.code, r.name, gm.code AS mode_code, r.teacher_id, r.course_id,
              r.max_players, r.status::text AS status, r.created_at::text AS created_at
       FROM rooms r
       JOIN game_modes gm ON gm.id = r.game_mode_id
       WHERE r.deleted_at IS NULL
         AND ($1 OR r.teacher_id = $2)
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [session.role === 'admin', session.id]
    );
    const salas = await Promise.all(rows.map(mapRoom));
    return NextResponse.json({ salas });
  } catch (err) {
    console.error('[panel salas GET]', err);
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
      const cursoId = String(body.cursoId ?? body.course_id ?? '');
      const course = await queryOne<{ id: string; teacher_id: string }>(
        `SELECT id, teacher_id FROM courses WHERE id = $1 AND deleted_at IS NULL`,
        [cursoId]
      );
      if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      const room = await createRoom({
        hostId: session.id,
        name: String(body.nombre ?? body.name ?? 'Sala'),
        modeCode: String(body.juegoId ?? body.mode_code ?? 'decisiones'),
        maxPlayers: Number(body.maxPlayers) || 8,
        courseId: cursoId,
      });
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'room', $2, 'created', jsonb_build_object('name', coalesce($3::text, '')))`,
        [session.id, room.id, String(room.name ?? '')]
      );
      return NextResponse.json({ ok: true, sala: await mapRoom(room) }, { status: 201 });
    }

    if (action === 'start') {
      const id = String(body.id ?? body.room_id ?? '');
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      const ok = await startRoom(id, session.id);
      if (!ok) return NextResponse.json({ error: 'No se pudo iniciar' }, { status: 400 });
      const questionCount = await queryOne<{ n: number }>(
        `SELECT count(*)::int AS n FROM questions WHERE course_id = $1 AND deleted_at IS NULL AND status = 'active'`,
        [room.course_id]
      );
      await query(
        `INSERT INTO matches (room_id, game_mode_id, course_id, started_by, status, question_count)
         VALUES ($1, (SELECT game_mode_id FROM rooms WHERE id = $1), $2, $3, 'in_progress', $4)`,
        [id, room.course_id, session.id, Math.max(1, questionCount?.n ?? 10)]
      );
      const fresh = await getRoomById(id);
      return NextResponse.json({ ok: true, sala: fresh ? await mapRoom(fresh) : null });
    }

    if (action === 'finish') {
      const id = String(body.id ?? body.room_id ?? '');
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      const result = await finishRoom(id, session.id);
      if (!result.ok) return NextResponse.json({ error: 'No se pudo finalizar' }, { status: 400 });
      await query(
        `UPDATE matches SET status = 'finished', finished_at = now()
         WHERE room_id = $1 AND status = 'in_progress'`,
        [id]
      );
      const fresh = await getRoomById(id);
      return NextResponse.json({ ok: true, sala: fresh ? await mapRoom(fresh) : null });
    }

    if (action === 'delete') {
      const id = String(body.id ?? body.room_id ?? '');
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      await query(`UPDATE rooms SET deleted_at = now() WHERE id = $1`, [id]);
      return NextResponse.json({ ok: true });
    }

    if (action === 'poll') {
      const id = String(body.id ?? body.room_id ?? '');
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      return NextResponse.json({ sala: await mapRoom(room) });
    }

    if (action === 'hard_questions') {
      const id = String(body.id ?? body.room_id ?? '');
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      const rows = await query<{
        question_id: string;
        prompt: string;
        correctas: number;
        incorrectas: number;
        total: number;
        opt0: number;
        opt1: number;
        text0: string | null;
        text1: string | null;
      }>(
        `SELECT pa.question_id, q.prompt,
                count(*) FILTER (WHERE pa.is_correct IS TRUE)::int AS correctas,
                count(*) FILTER (WHERE pa.is_correct IS FALSE)::int AS incorrectas,
                count(*)::int AS total,
                count(*) FILTER (WHERE o.sort_order = 0)::int AS opt0,
                count(*) FILTER (WHERE o.sort_order = 1)::int AS opt1,
                max(CASE WHEN o.sort_order = 0 THEN o.text END) AS text0,
                max(CASE WHEN o.sort_order = 1 THEN o.text END) AS text1
         FROM participant_answers pa
         JOIN matches m ON m.id = pa.match_id
         JOIN questions q ON q.id = pa.question_id
         LEFT JOIN question_options o ON o.id = pa.option_id
         WHERE m.room_id = $1
         GROUP BY pa.question_id, q.prompt
         ORDER BY (count(*) FILTER (WHERE pa.is_correct IS TRUE)::float / nullif(count(*), 0)) ASC
         LIMIT 20`,
        [id]
      );
      const preguntasDificiles = rows.map((r, i) => ({
        preguntaId: r.question_id,
        posicion: i + 1,
        enunciado: r.prompt,
        porcentajeCorrectas: r.total > 0 ? Math.round((r.correctas / r.total) * 100) : 0,
        correctas: r.correctas,
        incorrectas: r.incorrectas,
        totalRespuestas: r.total,
        opciones: [
          { texto: r.text0 ?? 'Opción A', cantidad: r.opt0, porcentaje: r.total > 0 ? Math.round((r.opt0 / r.total) * 100) : 0 },
          { texto: r.text1 ?? 'Opción B', cantidad: r.opt1, porcentaje: r.total > 0 ? Math.round((r.opt1 / r.total) * 100) : 0 },
        ],
      }));
      return NextResponse.json({ preguntasDificiles });
    }

    if (action === 'student_detail') {
      const id = String(body.id ?? body.room_id ?? '');
      const estudianteId = String(body.estudianteId ?? '');
      const room = await getRoomById(id);
      if (!room || (session.role !== 'admin' && room.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
      }
      const answers = await query<{
        question_id: string;
        prompt: string;
        is_correct: boolean | null;
        timed_out: boolean;
        points_delta: number;
        response_time_ms: number | null;
        option_text: string | null;
        correct_text: string | null;
        position: number;
      }>(
        `SELECT pa.question_id, q.prompt, pa.is_correct, pa.timed_out, pa.points_delta,
                pa.response_time_ms, pa.question_position AS position,
                (SELECT text FROM question_options WHERE id = pa.option_id) AS option_text,
                (SELECT text FROM question_options o WHERE o.question_id = pa.question_id AND o.is_correct LIMIT 1) AS correct_text
         FROM participant_answers pa
         JOIN match_participants mp ON mp.id = pa.participant_id
         JOIN matches m ON m.id = mp.match_id
         JOIN questions q ON q.id = pa.question_id
         WHERE m.room_id = $1 AND mp.user_id = $2
         ORDER BY pa.question_position`,
        [id, estudianteId]
      );
      const mp = await queryOne<{ display_name: string; score: number; status: string; eliminated_on_question: number | null }>(
        `SELECT mp.display_name, mp.score, mp.status::text AS status, mp.eliminated_on_question
         FROM match_participants mp
         JOIN matches m ON m.id = mp.match_id
         WHERE m.room_id = $1 AND mp.user_id = $2
         ORDER BY m.created_at DESC LIMIT 1`,
        [id, estudianteId]
      );
      const detailAnswers = answers.map((a) => ({
        questionId: a.question_id,
        questionText: a.prompt,
        selectedAnswer: a.option_text,
        correctAnswer: a.correct_text ?? '',
        status: a.timed_out ? ('timeout' as const) : a.is_correct ? ('correct' as const) : ('incorrect' as const),
        responseTime: a.response_time_ms ?? 0,
        puntosGanados: a.points_delta > 0 ? a.points_delta : 0,
        puntosPerdidos: 0,
        puntosNetos: a.points_delta,
      }));
      const correctAnswers = detailAnswers.filter((a) => a.status === 'correct').length;
      const incorrectAnswers = detailAnswers.filter((a) => a.status === 'incorrect').length;
      const timedOut = detailAnswers.filter((a) => a.status === 'timeout').length;
      const total = detailAnswers.length;
      return NextResponse.json({
        detalle: {
          estudianteId,
          nombre: mp?.display_name ?? 'Estudiante',
          modoJuego: room.mode_code === 'lava' || room.mode_code === 'tierras' || room.mode_code === 'abismos' ? room.mode_code : 'decisiones',
          estadoFinal: mp?.status === 'eliminated' ? 'eliminado' : 'completado',
          totalQuestions: total,
          preguntasRespondidas: total,
          correctAnswers,
          incorrectAnswers,
          timedOutAnswers: timedOut,
          precision: total > 0 ? Math.round((correctAnswers / total) * 100) : 0,
          averageResponseTime: total > 0 ? Math.round(detailAnswers.reduce((a, x) => a + x.responseTime, 0) / total) : 0,
          puntosGanados: detailAnswers.reduce((a, x) => a + x.puntosGanados, 0),
          puntosPerdidos: 0,
          puntosNetos: mp?.score ?? 0,
          preguntaEliminacion: mp?.eliminated_on_question ?? undefined,
          answers: detailAnswers,
        },
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel salas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

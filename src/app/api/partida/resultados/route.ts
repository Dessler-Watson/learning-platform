import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getRoomById, query, queryOne } from '@/lib/db';
import { getActiveMatch, getLatestMatch, getMatchParticipant, type MatchInfo } from '@/lib/db/matches';

export const dynamic = 'force-dynamic';

/**
 * Resultado real de partida del estudiante (Paso 5).
 * Fuente: PostgreSQL (vistas v_match_participant_stats / v_match_ranking +
 * participant_answers). Un estudiante solo puede consultar SU propio resultado;
 * con user_id distinto al de la sesión → 403.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('room_id');
    if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });

    const requestedUserId = searchParams.get('user_id');
    if (requestedUserId && requestedUserId !== session.id) {
      return NextResponse.json({ error: 'Solo puedes consultar tu propio resultado' }, { status: 403 });
    }

    const room = await getRoomById(roomId);
    if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });

    const match: MatchInfo | null = (await getActiveMatch(room.id)) ?? (await getLatestMatch(room.id));
    if (!match) {
      return NextResponse.json({ error: 'La sala no tiene partidas registradas' }, { status: 409 });
    }

    const participant = await getMatchParticipant(match.id, session.id);
    if (!participant) {
      return NextResponse.json({ error: 'No eres participante de esta partida' }, { status: 403 });
    }

    const stats = await queryOne<{
      display_name: string;
      status: string;
      score: number;
      answered: number;
      correct: number;
      incorrect: number;
      timeouts: number;
      avg_response_ms: number | null;
    }>(
      `SELECT s.display_name, s.status, s.score,
              s.answered::int AS answered, s.correct::int AS correct,
              s.incorrect::int AS incorrect, s.timeouts::int AS timeouts,
              s.avg_response_ms::int AS avg_response_ms
       FROM v_match_participant_stats s
       WHERE s.participant_id = $1`,
      [participant.id]
    );

    const ranking = await query<{
      user_id: string;
      display_name: string;
      score: number;
      status: string;
      position: number;
      avatar_id: number | null;
    }>(
      `SELECT r.user_id, r.display_name, r.score, r.status, r.position::int AS position, u.avatar_id
       FROM v_match_ranking r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.match_id = $1
       ORDER BY r.position ASC, r.score DESC, r.display_name ASC`,
      [match.id]
    );

    const answers = await query<{
      question_position: number;
      prompt: string;
      elegida: string | null;
      correcta: string | null;
      is_correct: boolean | null;
      timed_out: boolean;
      points_delta: number;
      response_time_ms: number | null;
    }>(
      `SELECT pa.question_position::int AS question_position, q.prompt,
              sel.text AS elegida, corr.text AS correcta,
              pa.is_correct, pa.timed_out, pa.points_delta, pa.response_time_ms
       FROM participant_answers pa
       JOIN questions q ON q.id = pa.question_id
       LEFT JOIN question_options sel ON sel.id = pa.option_id
       LEFT JOIN question_options corr ON corr.question_id = q.id AND corr.is_correct
       WHERE pa.participant_id = $1
       ORDER BY pa.question_position ASC`,
      [participant.id]
    );

    const meta = await queryOne<{
      status: string;
      started_at: string | null;
      finished_at: string | null;
      duracion_ms: string;
    }>(
      `SELECT m.status::text AS status,
              m.started_at::text AS started_at, m.finished_at::text AS finished_at,
              (EXTRACT(EPOCH FROM (coalesce(m.finished_at, now()) - m.started_at)) * 1000)::text AS duracion_ms
       FROM matches m WHERE m.id = $1`,
      [match.id]
    );

    const totalPreguntas = match.question_count;
    const answered = stats?.answered ?? 0;
    const correct = stats?.correct ?? 0;
    const selfRow = ranking.find((r) => r.user_id === session.id);

    return NextResponse.json({
      ok: true,
      sala: {
        id: room.id,
        codigo: room.code,
        nombre: room.name ?? 'Sala',
        modo: room.mode_code,
      },
      partida: {
        id: match.id,
        status: meta?.status ?? match.status,
        total_preguntas: totalPreguntas,
        started_at: meta?.started_at ?? null,
        finished_at: meta?.finished_at ?? null,
        duracion_ms: Number(meta?.duracion_ms ?? 0),
      },
      yo: {
        user_id: session.id,
        nombre: stats?.display_name ?? participant.id,
        score: stats?.score ?? participant.score,
        xp: participant.xp,
        estado: stats?.status ?? participant.status,
        eliminado_en: participant.eliminated_on_question,
        correctas: correct,
        incorrectas: stats?.incorrect ?? 0,
        timeouts: stats?.timeouts ?? 0,
        sin_responder: Math.max(0, totalPreguntas - answered),
        porcentaje: totalPreguntas > 0 ? Math.round((correct / totalPreguntas) * 100) : 0,
        posicion: selfRow?.position ?? 0,
        total_jugadores: ranking.length,
        promedio_respuesta_ms: stats?.avg_response_ms ?? null,
      },
      respuestas: answers.map((a) => ({
        posicion: a.question_position,
        pregunta: a.prompt,
        elegida: a.elegida,
        correcta: a.correcta,
        is_correct: a.is_correct,
        timed_out: a.timed_out,
        puntos: a.points_delta,
        tiempo_ms: a.response_time_ms,
      })),
      ranking: ranking.map((r) => ({
        posicion: r.position,
        user_id: r.user_id,
        nombre: r.display_name,
        avatar_id: r.avatar_id,
        score: r.score,
        estado: r.status,
      })),
    });
  } catch (err) {
    console.error('[partida resultados GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

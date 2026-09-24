import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, ensureLeagueProgress, applyStarsDelta, query, queryOne } from '@/lib/db';
import {
  createRoom,
  getRoomByCode,
  getRoomById,
  listParticipants,
  joinRoom,
  leaveRoom,
  startRoom,
  finishRoom,
} from '@/lib/db/rooms';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');

    const room = code ? await getRoomByCode(code) : id ? await getRoomById(id) : null;
    if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    const participantes = await listParticipants(room.id);
    const soyParticipante = participantes.some((p) => p.user_id === session.id);

    // Entrada por código (sala de espera): auto-join si aún no está y la sala acepta.
    if (code && !soyParticipante) {
      if (room.status !== 'waiting') {
        return NextResponse.json({ error: 'La sala no está disponible' }, { status: 400 });
      }
      const join = await joinRoom(room.id, session.id);
      if (!join.joined) {
        return NextResponse.json({ error: join.reason ?? 'No se pudo unir' }, { status: 400 });
      }
      const lista = await listParticipants(room.id);
      return NextResponse.json({
        sala: room,
        participantes: lista,
        usuario_id: session.id,
        es_host: room.teacher_id === session.id,
      });
    }

    if (!code && !soyParticipante && room.status !== 'waiting') {
      return NextResponse.json({ error: 'La sala no está disponible' }, { status: 400 });
    }

    return NextResponse.json({
      sala: room,
      participantes,
      usuario_id: session.id,
      es_host: room.teacher_id === session.id,
    });
  } catch (err) {
    console.error('[salas GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    await ensureLeagueProgress(session.id);

    const body = await req.json();
    const action = String(body.action ?? 'create');

    if (action === 'create') {
      const name = String(body.name ?? '').trim() || `Sala de ${session.nombre}`;
      const modeCode = String(body.mode ?? body.mode_code ?? 'decisiones').trim();
      const room = await createRoom({
        hostId: session.id,
        name,
        modeCode,
        maxPlayers: Number(body.max_players) || 8,
        courseId: body.course_id ? String(body.course_id) : undefined,
      });
      return NextResponse.json({ sala: room }, { status: 201 });
    }

    if (action === 'join') {
      const code = String(body.code ?? '').trim();
      if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
      const room = await getRoomByCode(code);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
      const result = await joinRoom(room.id, session.id);
      if (!result.joined) {
        return NextResponse.json({ error: result.reason ?? 'No se pudo unir' }, { status: 400 });
      }
      const participantes = await listParticipants(room.id);
      return NextResponse.json({ sala: room, participantes });
    }

    if (action === 'leave') {
      const roomId = String(body.room_id ?? '');
      if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });
      const ok = await leaveRoom(roomId, session.id);
      return NextResponse.json({ ok });
    }

    if (action === 'start') {
      const roomId = String(body.room_id ?? '');
      const ok = await startRoom(roomId, session.id);
      if (!ok) return NextResponse.json({ error: 'Solo el host puede iniciar' }, { status: 403 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'answer') {
      const roomId = String(body.room_id ?? '');
      const questionId = String(body.question_id ?? '');
      const selectedIndex = Number(body.selected_index ?? -1);
      const isCorrect = selectedIndex === Number(body.correct_index ?? -2);
      const points = isCorrect ? Number(body.points ?? 10) : 0;

      const room = await getRoomById(roomId);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });

      // Ensure a live match exists for this room
      let match = await queryOne<{ id: string }>(
        `SELECT id FROM matches WHERE room_id = $1 AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1`,
        [roomId]
      );
      if (!match) {
        match = await queryOne<{ id: string }>(
          `INSERT INTO matches (room_id, game_mode_id, course_id, started_by, status, question_count)
           VALUES ($1, (SELECT game_mode_id FROM rooms WHERE id = $1), (SELECT course_id FROM rooms WHERE id = $1), $2, 'in_progress', 10)
           RETURNING id`,
          [roomId, session.id]
        );
      }
      if (!match) return NextResponse.json({ error: 'No hay partida activa' }, { status: 400 });

      let participant = await queryOne<{ id: string }>(
        `SELECT id FROM match_participants WHERE match_id = $1 AND user_id = $2`,
        [match.id, session.id]
      );
      if (!participant) {
        participant = await queryOne<{ id: string }>(
          `INSERT INTO match_participants (match_id, user_id, display_name, score)
           VALUES ($1, $2, $3, 0) RETURNING id`,
          [match.id, session.id, session.nombre]
        );
      }
      if (!participant) return NextResponse.json({ error: 'No se pudo registrar participante' }, { status: 500 });

      if (isCorrect && points > 0) {
        await query(
          `UPDATE match_participants SET score = score + $2 WHERE id = $1`,
          [participant.id, points]
        );
      }

      const posRow = await queryOne<{ n: number }>(
        `SELECT coalesce(max(question_position), -1) + 1 AS n FROM participant_answers WHERE participant_id = $1`,
        [participant.id]
      );
      await query(
        `INSERT INTO participant_answers (match_id, participant_id, question_id, question_position, is_correct, points_delta)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (participant_id, question_position) DO NOTHING`,
        [match.id, participant.id, questionId, posRow?.n ?? 0, isCorrect, points]
      );

      return NextResponse.json({ ok: true, correct: isCorrect, score_delta: points });
    }

    if (action === 'finish') {
      const roomId = String(body.room_id ?? '');
      const result = await finishRoom(roomId, session.id);
      if (!result.ok) return NextResponse.json({ error: 'No se pudo finalizar' }, { status: 403 });

      await query(
        `UPDATE matches SET status = 'finished', finished_at = now()
         WHERE room_id = $1 AND status = 'in_progress'`,
        [roomId]
      );

      // Competitive stars: host and top participants only for room_match source.
      // Ranking by match_participants.score
      const ranking = await query<{ user_id: string; score: number }>(
        `SELECT mp.user_id, mp.score
         FROM match_participants mp
         JOIN matches m ON m.id = mp.match_id
         WHERE m.room_id = $1
         ORDER BY mp.score DESC`,
        [roomId]
      );

      let myStars = 0;
      const matchRow = await queryOne<{ id: string }>(
        `SELECT id FROM matches WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [roomId]
      );
      for (let i = 0; i < ranking.length; i++) {
        const stars = i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 1 : 0;
        if (stars > 0) {
          await applyStarsDelta(ranking[i].user_id, stars, 'room_match', {
            matchId: matchRow?.id ?? null,
            reason: `Puesto ${i + 1} en sala`,
          });
        }
        if (ranking[i].user_id === session.id) myStars = stars;
      }

      return NextResponse.json({ ok: true, estrellas: myStars });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[salas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

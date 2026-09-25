import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getRoomById } from '@/lib/db';
import {
  ensureActiveMatch,
  getLatestMatch,
  getMatchParticipant,
  listMatchQuestions,
  listQuestionOptions,
  listMyAnswers,
  recordMatchAnswer,
  type MatchInfo,
} from '@/lib/db/matches';

export const dynamic = 'force-dynamic';

async function resolveMatch(roomId: string, userId: string, roomStatus: string): Promise<MatchInfo | null> {
  if (roomStatus === 'in_progress') {
    const active = await ensureActiveMatch(roomId, userId);
    if (active) return active;
  }
  return getLatestMatch(roomId);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('room_id');
    if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });

    const room = await getRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }
    if (room.status === 'waiting') {
      return NextResponse.json({ error: 'La partida no ha comenzado' }, { status: 409 });
    }

    const match = await resolveMatch(room.id, session.id, room.status);
    if (!match) return NextResponse.json({ error: 'No hay partida activa' }, { status: 409 });

    const participant = await getMatchParticipant(match.id, session.id);
    if (!participant) {
      return NextResponse.json({ error: 'No eres participante de esta partida' }, { status: 403 });
    }

    const questionRows = await listMatchQuestions(match);
    const options = await listQuestionOptions(questionRows.map((q) => q.id));
    const answers = await listMyAnswers(participant.id);

    return NextResponse.json({
      partida: {
        id: match.id,
        room_id: match.room_id,
        status: match.status,
        question_count: match.question_count,
        modo: match.mode_code,
      },
      yo: {
        score: participant.score,
        xp: participant.xp,
        estado: participant.status,
        respondidas: answers.map((a) => ({
          question_id: a.question_id,
          position: a.question_position,
          is_correct: a.is_correct,
          timed_out: a.timed_out,
          points_delta: a.points_delta,
        })),
      },
      preguntas: questionRows.map((q, i) => ({
        position: i,
        id: q.id,
        prompt: q.prompt,
        explanation: q.explanation ?? '',
        difficulty: q.difficulty,
        options: options
          .filter((o) => o.question_id === q.id)
          .map((o) => ({ id: o.id, text: o.text })),
      })),
    });
  } catch (err) {
    console.error('[partida GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const action = String(body.action ?? '');

    if (action !== 'answer') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const roomId = String(body.room_id ?? '');
    const questionId = String(body.question_id ?? '');
    if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });
    if (!questionId) return NextResponse.json({ error: 'question_id requerido' }, { status: 400 });

    const timedOut = body.timed_out === true;
    const optionId = body.option_id != null && body.option_id !== '' ? String(body.option_id) : null;
    if (!timedOut && !optionId) {
      return NextResponse.json({ error: 'option_id requerido' }, { status: 400 });
    }

    const rawTime = Number(body.response_time_ms ?? 0);
    const responseTimeMs = Number.isFinite(rawTime) && rawTime >= 0 ? Math.min(Math.floor(rawTime), 3_600_000) : 0;

    const result = await recordMatchAnswer({
      roomId,
      userId: session.id,
      questionId,
      optionId,
      timedOut,
      responseTimeMs,
    });

    if (!result.ok) {
      if (result.code === 'duplicate') {
        return NextResponse.json(
          {
            error: result.error,
            code: 'duplicate',
            correct: result.correct ?? false,
            correct_option_id: result.correct_option_id ?? null,
            points_delta: result.points_delta ?? 0,
            score: result.score ?? 0,
            xp: result.xp ?? 0,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[partida POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getRoomById, queryOne } from '@/lib/db';
import {
  ensureActiveMatch,
  getLatestMatch,
  getMatchParticipant,
  listMatchQuestions,
  listQuestionOptions,
  listMyAnswers,
  orderMatchOptions,
  recordMatchAnswer,
  markParticipantEliminated,
  markMatchClockBoot,
  markQuestionStarted,
  questionWindowMs,
  sharedClockRemainingMs,
  surpriseEffectFor,
  type MatchInfo,
} from '@/lib/db/matches';
import { SORPRESA_MODIFIER } from '@/lib/chaos/sorpresa';
import {
  hasModifier,
  trailingStreakFlags,
  trailingErrorsFlags,
  MAX_LIVES,
  VIDA_LIMITADA_MODIFIER,
  RACHA_OBLIGATORIA_MODIFIER,
  ERROR_ACUMULATIVO_MODIFIER,
  ULTIMA_OPORTUNIDAD_MODIFIER,
} from '@/lib/chaos/survival';

export const dynamic = 'force-dynamic';

async function resolveMatch(roomId: string, userId: string, roomStatus: string): Promise<MatchInfo | null> {
  if (roomStatus === 'in_progress') {
    const active = await ensureActiveMatch(roomId, userId);
    if (active) return active;
  }
  return getLatestMatch(roomId);
}

/**
 * Cadena de autorización compartida de POST (sala → miembro activo → match →
 * participante), idéntica a la de GET. Devuelve las respuestas de error ya
 * construidas para no duplicar la lógica entre 'eliminate' y 'question_started'.
 */
async function authorizeParticipant(roomId: string, userId: string) {
  const fail = (error: string, status: number) =>
    ({ ok: false as const, res: NextResponse.json({ error }, { status }) });
  if (!roomId) return fail('room_id requerido', 400);
  const room = await getRoomById(roomId);
  if (!room) return fail('Sala no encontrada', 404);
  if (room.status === 'waiting') return fail('La partida no ha comenzado', 409);
  const member = await queryOne<{ one: number }>(
    `SELECT 1 AS one FROM room_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [room.id, userId]
  );
  if (!member) return fail('No eres participante de esta partida', 403);
  const match = await resolveMatch(room.id, userId, room.status);
  if (!match) return fail('No hay partida activa', 409);
  const participant = await getMatchParticipant(match.id, userId);
  if (!participant) return fail('No eres participante de esta partida', 403);
  return { ok: true as const, room, match, participant };
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

    // Autorización ANTES de resolveMatch: solo un miembro activo de la sala
    // puede disparar la creación/lectura de la partida (evita que cualquier
    // usuario autenticado cree partidas ajenas como 'started_by').
    const member = await queryOne<{ one: number }>(
      `SELECT 1 AS one FROM room_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [room.id, session.id]
    );
    if (!member) {
      return NextResponse.json({ error: 'No eres participante de esta partida' }, { status: 403 });
    }

    const match = await resolveMatch(room.id, session.id, room.status);
    if (!match) return NextResponse.json({ error: 'No hay partida activa' }, { status: 409 });

    const participant = await getMatchParticipant(match.id, session.id);
    if (!participant) {
      return NextResponse.json({ error: 'No eres participante de esta partida' }, { status: 403 });
    }

    // Reloj de pregunta ('contrarreloj'): ancla de arranque del servidor
    // (posición -1). Solo con reloj activo; idempotente.
    if (questionWindowMs(match.modifiers) != null) {
      await markMatchClockBoot(participant.id);
    }

    const questionRows = await listMatchQuestions(match);
    // 'pregunta_sorpresa': efecto adicional determinista por pregunta
    // (sha256 matchId:questionId → pool o 'normal'/null). Solo lectura: no
    // toca matches.modifiers; se sirve como campo de cada pregunta y lo
    // aplica el cliente reutilizando las infraestructuras existentes.
    const surpriseActive = Array.isArray(match.modifiers) && match.modifiers.includes(SORPRESA_MODIFIER);
    const surpriseByQuestion = surpriseActive
      ? new Map(questionRows.map((q) => [q.id, surpriseEffectFor(match.id, q.id)]))
      : undefined;
    // Orden visual de las OPCIONES por pregunta: con 'respuestas_mezcladas'
    // (modificador o efecto sorpresa de esa pregunta) el servidor aplica una
    // permutación determinista (match+question+option); sin él, el orden
    // normal de sort_order. La validación sigue por option_id.
    const options = orderMatchOptions(
      match,
      await listQuestionOptions(questionRows.map((q) => q.id)),
      surpriseByQuestion
    );
    const answers = await listMyAnswers(participant.id);
    // Opción correcta por pregunta: permite al cliente calcular el resultado
    // de forma optimista y sincronizar con el servidor en segundo plano
    // (el servidor sigue validando y puntuando en POST /api/partida).
    const correctByQuestion = new Map(
      options.filter((o) => o.is_correct).map((o) => [o.question_id, o.id])
    );
    // 'tiempo_compartido': ms restantes del presupuesto global (now() de la
    // BD). Solo con el mod activo; sin él se omite el campo.
    const restarMs = await sharedClockRemainingMs(room.id);

    // Grupo 3 (supervivencia): estado derivado del historial de respuestas
    // (mismo orden que respondidas[]). Cada campo se sirve SOLO con su
    // modificador activo; sin Grupo 3 la respuesta es idéntica a la anterior.
    const flags = answers.map((a) => a.is_correct === true);
    const totalErrores = flags.reduce((n, ok) => (ok ? n : n + 1), 0);
    const mods = Array.isArray(match.modifiers) ? match.modifiers : [];
    const survivalYo = {
      ...(hasModifier(mods, VIDA_LIMITADA_MODIFIER) ? { vidas: Math.max(0, MAX_LIVES - totalErrores) } : {}),
      ...(hasModifier(mods, RACHA_OBLIGATORIA_MODIFIER) ? { racha: trailingStreakFlags(flags) } : {}),
      ...(hasModifier(mods, ERROR_ACUMULATIVO_MODIFIER) ? { errores: trailingErrorsFlags(flags) } : {}),
      ...(hasModifier(mods, ULTIMA_OPORTUNIDAD_MODIFIER) ? { critico: totalErrores >= 1 } : {}),
    };

    return NextResponse.json({
      partida: {
        id: match.id,
        room_id: match.room_id,
        status: match.status,
        question_count: match.question_count,
        modo: match.mode_code,
        // Modificadores de la partida (Caos). Mismo array para todos los
        // jugadores. 'barajado' ya se aplica en listMatchQuestions (el orden
        // de preguntas[]); doble_puntos/ritmo_expres siguen inertes.
        modificadores: Array.isArray(match.modifiers) ? match.modifiers : [],
        ...(restarMs != null ? { tiempo: { restar_ms: restarMs } } : {}),
      },
      yo: {
        score: participant.score,
        xp: participant.xp,
        estado: participant.status,
        ...survivalYo,
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
        correct_option_id: correctByQuestion.get(q.id) ?? null,
        // Efecto sorpresa de ESTA pregunta (null = 'normal'). Solo presente
        // con el modificador activo; el cliente nunca lo envía al servidor.
        ...(surpriseByQuestion ? { sorpresa: surpriseByQuestion.get(q.id) ?? null } : {}),
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

    if (action !== 'answer' && action !== 'eliminate' && action !== 'question_started') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const roomId = String(body.room_id ?? '');

    // 'contrarreloj': el cliente avisa cuando se MUESTRA una pregunta nueva;
    // el servidor estampa su propio now() (sin aceptar horas del cliente) y
    // devuelve { claimed }. Misma cadena de autorización que el resto.
    if (action === 'question_started') {
      const questionId = String(body.question_id ?? '');
      if (!questionId) return NextResponse.json({ error: 'question_id requerido' }, { status: 400 });
      const auth = await authorizeParticipant(roomId, session.id);
      if (!auth.ok) return auth.res;
      const res = await markQuestionStarted({
        roomId: auth.room.id,
        userId: session.id,
        questionId,
      });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 500 });
      return NextResponse.json({ ok: true, claimed: res.claimed === true });
    }

    // Muerte sin respuesta (p.ej. caída al agua en tierras-hundidas): marca al
    // participante como eliminado en el panel docente.
    if (action === 'eliminate') {
      const auth = await authorizeParticipant(roomId, session.id);
      if (!auth.ok) return auth.res;
      const { room, match, participant } = auth;

      // Entre-abismos: caer al vacío hace perder todas las estrellas de liga
      // ganadas en la partida (forfeit_stars, solo válido en ese modo).
      const forfeitStars = body.forfeit_stars === true && room.mode_code === 'abismos';
      const changed = await markParticipantEliminated({
        roomId: room.id,
        matchId: match.id,
        participantId: participant.id,
        forfeitStars,
      });
      return NextResponse.json({
        ok: true,
        eliminado: changed || participant.status === 'eliminated',
        estado: changed ? 'eliminated' : participant.status,
      });
    }
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

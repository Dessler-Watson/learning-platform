import type { PoolClient } from 'pg';
import { getPool, query, queryOne } from './client';
import { applyStarsDeltaInTx } from './leagues';

export interface ModeRules {
  correctPoints: number;
  incorrectPoints: number;
  floorAtZero: boolean;
  xpPerCorrect: number;
  resource?: { key: 'ticks' | 'platforms'; start: number; max: number };
  eliminateOnIncorrect: boolean;
}

export const MODE_RULES: Record<string, ModeRules> = {
  decisiones: { correctPoints: 10, incorrectPoints: -5, floorAtZero: false, xpPerCorrect: 15, eliminateOnIncorrect: false },
  lava: {
    correctPoints: 15,
    incorrectPoints: -5,
    floorAtZero: true,
    xpPerCorrect: 15,
    resource: { key: 'ticks', start: 2, max: 3 },
    eliminateOnIncorrect: false,
  },
  tierras: { correctPoints: 20, incorrectPoints: 0, floorAtZero: false, xpPerCorrect: 20, eliminateOnIncorrect: true },
  abismos: {
    correctPoints: 20,
    incorrectPoints: 0,
    floorAtZero: false,
    xpPerCorrect: 20,
    resource: { key: 'platforms', start: 0, max: 5 },
    eliminateOnIncorrect: false,
  },
};

export function rulesForMode(modeCode: string | null | undefined): ModeRules {
  return (modeCode && MODE_RULES[modeCode]) || MODE_RULES.decisiones;
}

export interface MatchInfo {
  id: string;
  room_id: string;
  status: string;
  question_count: number;
  course_id: string | null;
  mode_code: string | null;
}

export interface MatchQuestionRow {
  id: string;
  prompt: string;
  explanation: string | null;
  difficulty: string;
}

export interface MatchOptionRow {
  id: string;
  question_id: string;
  text: string;
  sort_order: number;
}

const MATCH_SELECT = `
  m.id, m.room_id, m.status, m.question_count, m.course_id,
  gm.code AS mode_code
  FROM matches m
  LEFT JOIN game_modes gm ON gm.id = m.game_mode_id
`;

export async function getLatestMatch(roomId: string): Promise<MatchInfo | null> {
  return queryOne<MatchInfo>(
    `SELECT ${MATCH_SELECT} WHERE m.room_id = $1 ORDER BY m.created_at DESC LIMIT 1`,
    [roomId]
  );
}

export async function getActiveMatch(roomId: string): Promise<MatchInfo | null> {
  return queryOne<MatchInfo>(
    `SELECT ${MATCH_SELECT} WHERE m.room_id = $1 AND m.status = 'in_progress' ORDER BY m.created_at DESC LIMIT 1`,
    [roomId]
  );
}

export async function getCourseQuestionIds(courseId: string, limit: number): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM questions
     WHERE course_id = $1 AND status = 'active' AND deleted_at IS NULL
     ORDER BY sort_order ASC, created_at ASC, id ASC
     LIMIT $2`,
    [courseId, Math.max(1, limit)]
  );
  return rows.map((r) => r.id);
}

async function countCourseQuestions(client: PoolClient | null, courseId: string | null): Promise<number> {
  const sql = `SELECT count(*)::int AS n FROM questions
               WHERE course_id = $1 AND status = 'active' AND deleted_at IS NULL`;
  if (client) {
    const res = await client.query<{ n: number }>(sql, [courseId]);
    return res.rows[0]?.n ?? 0;
  }
  const row = await queryOne<{ n: number }>(sql, [courseId]);
  return row?.n ?? 0;
}

async function insertMatchWithParticipants(
  client: PoolClient,
  room: { id: string; course_id: string | null; game_mode_id: string | null; status: string },
  startedBy: string
): Promise<MatchInfo | null> {
  const n = Math.max(1, await countCourseQuestions(client, room.course_id));
  const inserted = await client.query<{ id: string; question_count: number }>(
    `INSERT INTO matches (room_id, game_mode_id, course_id, started_by, status, question_count)
     VALUES ($1, $2, $3, $4, 'in_progress', $5)
     RETURNING id, question_count`,
    [room.id, room.game_mode_id, room.course_id, startedBy, n]
  );
  const matchId = inserted.rows[0]?.id;
  if (!matchId) return null;

  await client.query(
    `INSERT INTO match_participants (match_id, user_id, display_name)
     SELECT $1, rp.user_id, coalesce(rp.display_name, 'Jugador')
     FROM room_participants rp
     WHERE rp.room_id = $2 AND rp.left_at IS NULL
     ON CONFLICT (match_id, user_id) DO NOTHING`,
    [matchId, room.id]
  );

  const info = await client.query<MatchInfo>(
    `SELECT ${MATCH_SELECT} WHERE m.id = $1`,
    [matchId]
  );
  return info.rows[0] ?? null;
}

/**
 * Garantiza que la sala tenga una partida activa con sus participantes.
 * Idempotente y seguro ante concurrencia (bloquea la fila de la sala).
 */
export async function ensureActiveMatch(roomId: string, startedBy: string): Promise<MatchInfo | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const roomRes = await client.query<{
      id: string;
      course_id: string | null;
      game_mode_id: string | null;
      status: string;
      deleted_at: Date | null;
    }>(
      `SELECT id, course_id, game_mode_id, status, deleted_at FROM rooms WHERE id = $1 FOR UPDATE`,
      [roomId]
    );
    const room = roomRes.rows[0];
    if (!room || room.deleted_at) {
      await client.query('ROLLBACK');
      return null;
    }

    const existing = await client.query<MatchInfo>(
      `SELECT ${MATCH_SELECT} WHERE m.room_id = $1 AND m.status = 'in_progress' ORDER BY m.created_at DESC LIMIT 1`,
      [roomId]
    );
    if (existing.rowCount) {
      await client.query('COMMIT');
      return existing.rows[0];
    }

    if (room.status !== 'in_progress') {
      await client.query('ROLLBACK');
      return null;
    }

    const created = await insertMatchWithParticipants(client, room, startedBy);
    await client.query('COMMIT');
    return created;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

export async function listMatchQuestions(match: MatchInfo): Promise<MatchQuestionRow[]> {
  if (!match.course_id) return [];
  const ids = await getCourseQuestionIds(match.course_id, match.question_count);
  if (!ids.length) return [];
  return query<MatchQuestionRow>(
    `SELECT q.id, q.prompt, q.explanation, q.difficulty
     FROM questions q
     WHERE q.id = ANY($1::uuid[]) AND q.deleted_at IS NULL AND q.status = 'active'
     ORDER BY q.sort_order ASC, q.created_at ASC, q.id ASC`,
    [ids]
  );
}

export async function listQuestionOptions(questionIds: string[]): Promise<MatchOptionRow[]> {
  if (!questionIds.length) return [];
  return query<MatchOptionRow>(
    `SELECT id, question_id, text, sort_order
     FROM question_options
     WHERE question_id = ANY($1::uuid[])
     ORDER BY question_id, sort_order ASC, id ASC`,
    [questionIds]
  );
}

export async function getMatchParticipant(matchId: string, userId: string) {
  return queryOne<{
    id: string;
    status: string;
    score: number;
    xp: number;
    eliminated_on_question: number | null;
  }>(
    `SELECT id, status, score, xp, eliminated_on_question
     FROM match_participants WHERE match_id = $1 AND user_id = $2`,
    [matchId, userId]
  );
}

export async function listMyAnswers(participantId: string) {
  return query<{
    question_id: string;
    question_position: number;
    is_correct: boolean | null;
    timed_out: boolean;
    points_delta: number;
  }>(
    `SELECT question_id, question_position, is_correct, timed_out, points_delta
     FROM participant_answers WHERE participant_id = $1 ORDER BY question_position ASC`,
    [participantId]
  );
}

export type AnswerOutcome =
  | {
      ok: true;
      correct: boolean;
      correct_option_id: string | null;
      points_delta: number;
      stars_delta: number;
      score: number;
      xp: number;
      question_position: number;
      eliminated: boolean;
      timed_out: boolean;
      status: string;
      state: { ticks?: number; platforms?: number } | null;
      resync?: boolean;
    }
  | { ok: false; status: number; error: string; code?: string; correct?: boolean; correct_option_id?: string | null; points_delta?: number; score?: number; xp?: number };

export function replayResource(rules: ModeRules, flags: boolean[]): number | undefined {
  if (!rules.resource) return undefined;
  let value = rules.resource.start;
  for (const ok of flags) {
    if (ok) value = Math.min(rules.resource.max, value + 1);
    else value = Math.max(0, value - 1);
  }
  return value;
}

export interface RecordAnswerInput {
  roomId: string;
  userId: string;
  questionId: string;
  optionId: string | null;
  timedOut: boolean;
  responseTimeMs: number;
}

export async function recordMatchAnswer(input: RecordAnswerInput): Promise<AnswerOutcome> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roomRes = await client.query<{
      id: string;
      status: string;
      course_id: string | null;
      deleted_at: Date | null;
      mode_code: string | null;
    }>(
      `SELECT r.id, r.status, r.course_id, r.deleted_at, gm.code AS mode_code
       FROM rooms r LEFT JOIN game_modes gm ON gm.id = r.game_mode_id
       WHERE r.id = $1 FOR UPDATE OF r`,
      [input.roomId]
    );
    const room = roomRes.rows[0];
    if (!room || room.deleted_at) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, error: 'Sala no encontrada' };
    }
    if (room.status !== 'in_progress') {
      await client.query('ROLLBACK');
      const error =
        room.status === 'finished' || room.status === 'archived'
          ? 'La partida ha finalizado'
          : 'La partida no ha comenzado';
      return { ok: false, status: 409, error };
    }

    const matchRes = await client.query<{ id: string; question_count: number; status: string; stars_per_correct: number }>(
      `SELECT m.id, m.question_count, m.status, gm.stars_per_correct
       FROM matches m
       JOIN game_modes gm ON gm.id = m.game_mode_id
       WHERE m.room_id = $1 AND m.status = 'in_progress'
       ORDER BY m.created_at DESC LIMIT 1`,
      [input.roomId]
    );
    const match = matchRes.rows[0];
    if (!match) {
      await client.query('ROLLBACK');
      return { ok: false, status: 409, error: 'No hay partida activa' };
    }

    const partRes = await client.query<{ id: string; status: string; score: number; xp: number }>(
      `SELECT id, status, score, xp FROM match_participants
       WHERE match_id = $1 AND user_id = $2 FOR UPDATE`,
      [match.id, input.userId]
    );
    const participant = partRes.rows[0];
    if (!participant) {
      await client.query('ROLLBACK');
      return { ok: false, status: 403, error: 'No eres participante de esta partida' };
    }
    if (participant.status !== 'playing') {
      await client.query('ROLLBACK');
      const error =
        participant.status === 'eliminated'
          ? 'Has sido eliminado de la partida'
          : 'No puedes responder en este estado';
      return { ok: false, status: 409, error };
    }

    // Orden consistente de preguntas de la partida (derivado del curso, determinista).
    const orderRes = await client.query<{ id: string }>(
      `SELECT id FROM questions
       WHERE course_id = $1 AND status = 'active' AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at ASC, id ASC
       LIMIT $2`,
      [room.course_id, Math.max(1, match.question_count)]
    );
    const order = orderRes.rows.map((r) => r.id);
    const position = order.indexOf(input.questionId);
    if (position < 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 400, error: 'La pregunta no pertenece a esta partida' };
    }

    let isCorrect = false;
    let optionId: string | null = null;
    if (input.timedOut) {
      isCorrect = false;
      optionId = null;
    } else {
      if (!input.optionId) {
        await client.query('ROLLBACK');
        return { ok: false, status: 400, error: 'option_id requerido' };
      }
      const optRes = await client.query<{ id: string; question_id: string; is_correct: boolean }>(
        `SELECT id, question_id, is_correct FROM question_options WHERE id = $1`,
        [input.optionId]
      );
      const opt = optRes.rows[0];
      if (!opt) {
        await client.query('ROLLBACK');
        return { ok: false, status: 400, error: 'Opción no válida' };
      }
      if (opt.question_id !== input.questionId) {
        await client.query('ROLLBACK');
        return { ok: false, status: 400, error: 'La opción no pertenece a la pregunta' };
      }
      isCorrect = opt.is_correct;
      optionId = opt.id;
    }

    // Respuesta duplicada: bloqueada por índice único (participant_id, question_position).
    const dupRes = await client.query<{ is_correct: boolean | null; points_delta: number }>(
      `SELECT is_correct, points_delta FROM participant_answers
       WHERE participant_id = $1 AND question_position = $2`,
      [participant.id, position]
    );
    if (dupRes.rowCount) {
      const dup = dupRes.rows[0];
      const selfNow = await client.query<{ score: number; xp: number }>(
        `SELECT score, xp FROM match_participants WHERE id = $1`,
        [participant.id]
      );
      const correctOpt = await client.query<{ id: string }>(
        `SELECT id FROM question_options WHERE question_id = $1 AND is_correct = TRUE LIMIT 1`,
        [input.questionId]
      );
      await client.query('ROLLBACK');
      return {
        ok: false,
        status: 409,
        code: 'duplicate',
        error: 'Respuesta ya registrada',
        correct: dup.is_correct === true,
        correct_option_id: input.timedOut ? null : (correctOpt.rows[0]?.id ?? null),
        points_delta: dup.points_delta,
        score: selfNow.rows[0]?.score ?? participant.score,
        xp: selfNow.rows[0]?.xp ?? participant.xp,
      };
    }

    const rules = rulesForMode(room.mode_code);
    const pointsDelta = isCorrect ? rules.correctPoints : rules.incorrectPoints;
    const starsDelta = isCorrect ? match.stars_per_correct : 0;
    const rawScore = participant.score + pointsDelta;
    const newScore = rules.floorAtZero ? Math.max(0, rawScore) : rawScore;
    const xpGain = isCorrect ? rules.xpPerCorrect : 0;

    try {
      await client.query(
        `INSERT INTO participant_answers
           (match_id, participant_id, question_id, option_id, question_position,
            is_correct, timed_out, response_time_ms, points_delta, stars_delta, answered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())`,
        [
          match.id,
          participant.id,
          input.questionId,
          optionId,
          position,
          isCorrect,
          input.timedOut,
          input.responseTimeMs,
          pointsDelta,
          starsDelta,
        ]
      );
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        await client.query('ROLLBACK');
        return { ok: false, status: 409, code: 'duplicate', error: 'Respuesta ya registrada' };
      }
      throw err;
    }


    // Estado derivado del historial de respuestas (orden por posición).
    const histRes = await client.query<{ is_correct: boolean | null }>(
      `SELECT is_correct FROM participant_answers
       WHERE participant_id = $1 ORDER BY question_position ASC`,
      [participant.id]
    );
    const flags = histRes.rows.map((r) => r.is_correct === true);
    const resourceValue = replayResource(rules, flags);
    const eliminated =
      (rules.resource != null && (resourceValue ?? 0) <= 0) ||
      (rules.eliminateOnIncorrect && !isCorrect);

    await client.query(
      `UPDATE match_participants SET score = $2, xp = xp + $3, stars_earned = stars_earned + $4 WHERE id = $1`,
      [participant.id, newScore, xpGain, starsDelta]
    );
    if (eliminated) {
      await client.query(
        `UPDATE match_participants SET status = 'eliminated', eliminated_on_question = $2
         WHERE id = $1 AND status = 'playing'`,
        [participant.id, position + 1]
      );
    }

    await client.query('COMMIT');

    const correctOptionRes = input.timedOut
      ? null
      : await queryOne<{ id: string }>(
          `SELECT id FROM question_options WHERE question_id = $1 AND is_correct = TRUE LIMIT 1`,
          [input.questionId]
        );

    return {
      ok: true,
      correct: isCorrect,
      correct_option_id: input.timedOut ? null : (correctOptionRes?.id ?? null),
      points_delta: pointsDelta,
      stars_delta: starsDelta,
      score: newScore,
      xp: participant.xp + xpGain,
      question_position: position,
      eliminated,
      timed_out: input.timedOut,
      status: eliminated ? 'eliminated' : 'playing',
      state:
        rules.resource && resourceValue !== undefined
          ? rules.resource.key === 'ticks'
            ? { ticks: resourceValue }
            : { platforms: resourceValue }
          : null,
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

export interface FinalizeMatchResult {
  ok: boolean;
  reason?: 'not_found' | 'forbidden' | 'bad_status';
  matchIds: string[];
  awarded: Array<{ user_id: string; stars: number }>;
}

/**
 * Finalización definitiva de una sala y su partida: en UNA transacción
 * marca la sala como finalizada, cierra el match activo, marca a los
 * participantes 'playing' como 'finished' (los 'eliminated' se conservan),
 * otorga las estrellas de liga acumuladas por acierto (source='room_match',
 * con su transacción en league_transactions) y registra el evento de
 * auditoría. Seguro ante concurrencia (bloquea la fila de la sala).
 */
export async function finalizeMatch(
  roomId: string,
  actorId: string,
  opts?: { isAdmin?: boolean }
): Promise<FinalizeMatchResult> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const roomRes = await client.query<{
      id: string;
      status: string;
      teacher_id: string;
      deleted_at: Date | null;
    }>(
      `SELECT id, status, teacher_id, deleted_at FROM rooms WHERE id = $1 FOR UPDATE`,
      [roomId]
    );
    const room = roomRes.rows[0];
    if (!room || room.deleted_at) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_found', matchIds: [], awarded: [] };
    }
    if (!opts?.isAdmin && room.teacher_id !== actorId) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'forbidden', matchIds: [], awarded: [] };
    }
    if (room.status !== 'waiting' && room.status !== 'in_progress') {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'bad_status', matchIds: [], awarded: [] };
    }

    await client.query(
      `UPDATE rooms SET status = 'finished', finished_at = coalesce(finished_at, now())
       WHERE id = $1`,
      [roomId]
    );

    const matchesRes = await client.query<{ id: string }>(
      `UPDATE matches SET status = 'finished', finished_at = coalesce(finished_at, now())
       WHERE room_id = $1 AND status = 'in_progress'
       RETURNING id`,
      [roomId]
    );
    const matchIds = matchesRes.rows.map((r) => r.id);
    const awarded: Array<{ user_id: string; stars: number }> = [];

    if (matchIds.length > 0) {
      await client.query(
        `UPDATE match_participants
         SET status = 'finished', finished_at = coalesce(finished_at, now())
         WHERE match_id = ANY($1::uuid[]) AND status = 'playing'`,
        [matchIds]
      );

      // Estrellas de liga (Paso 7): premio por acierto ya acumulado en
      // match_participants.stars_earned durante las respuestas.
      const starsRes = await client.query<{ user_id: string; match_id: string; stars: number }>(
        `SELECT mp.user_id, mp.match_id, mp.stars_earned::int AS stars
         FROM match_participants mp
         WHERE mp.match_id = ANY($1::uuid[]) AND mp.stars_earned > 0
         ORDER BY mp.match_id ASC, mp.user_id ASC`,
        [matchIds]
      );
      for (const p of starsRes.rows) {
        const applied = await applyStarsDeltaInTx(client, p.user_id, p.stars, 'room_match', {
          matchId: p.match_id,
          reason: 'Puntos por aciertos en partida',
        });
        if (applied > 0) awarded.push({ user_id: p.user_id, stars: applied });
      }
    }

    await client.query(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
       VALUES ($1, 'room', $2, 'finished', '{}'::jsonb)`,
      [actorId, roomId]
    );

    await client.query('COMMIT');
    return { ok: true, matchIds, awarded };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

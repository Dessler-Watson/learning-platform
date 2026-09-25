import type { PoolClient, QueryResultRow } from 'pg';
import { getPool, query } from './client';
import { rulesForMode } from './matches';

export interface AchievementRow {
  id: string;
  code: string;
  name: string;
  description: string;
  difficulty: string;
  icon: string | null;
  goal: number;
  stat_key: string;
  mode_code: string | null;
}

export interface AchievementProgressRow {
  achievement_id: string;
  code: string;
  progress: number;
  completed: boolean;
  unlocked_at: string | null;
}

const ACHIEVEMENTS_SQL = `
  SELECT a.id, a.code, a.name, a.description, a.difficulty::text AS difficulty,
         a.icon, a.goal, a.stat_key, gm.code AS mode_code
  FROM achievements a
  LEFT JOIN game_modes gm ON gm.id = a.game_mode_id
  WHERE a.active
  ORDER BY a.code`;

export async function listAchievements(): Promise<AchievementRow[]> {
  return query<AchievementRow>(ACHIEVEMENTS_SQL);
}

export async function listProgress(userId: string): Promise<AchievementProgressRow[]> {
  return query<AchievementProgressRow>(
    `SELECT ap.achievement_id, a.code, ap.progress, ap.completed,
            ap.unlocked_at::text AS unlocked_at
     FROM achievement_progress ap
     JOIN achievements a ON a.id = ap.achievement_id
     WHERE ap.user_id = $1
     ORDER BY a.code`,
    [userId]
  );
}

/**
 * Ejecutor de consultas: transacción propia o la del caller (migrate).
 * Siempre dentro de una transacción (BEGIN ya ejecutado por quien aplique).
 */
export type DbRunner = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) => Promise<T[]>;

export interface EvaluateAchievementsResult {
  /** Estadísticas crudas calculadas desde PostgreSQL (para depuración/reportes). */
  stats: Record<string, number>;
  /** Códigos desbloqueados POR PRIMERA VEZ en esta evaluación. */
  nuevos: string[];
}

interface ParticipationRow extends QueryResultRow {
  participant_id: string;
  mode: string;
  question_count: number;
  player_status: string;
  score: number;
  xp: number;
  started_at: Date | null;
  joined_at: Date | null;
}

interface AggRow extends QueryResultRow {
  participant_id: string;
  answered: number;
  correct: number;
  incorrect: number;
  max_pos: number;
}

/**
 * Estadísticas server-side de un usuario derivadas SOLO de partidas en sala
 * (matches / match_participants / participant_answers), nunca de datos del cliente.
 *
 * Convenciones (documentadas en el reporte del Paso 6):
 * - Partidas canceladas se excluyen por completo.
 * - Una partida "terminó" para el jugador si fue eliminado o respondió la
 *   última pregunta (max_pos = question_count - 1).
 * - "Completada" = terminó sin ser eliminado. Las partidas cerradas por el
 *   docente antes de que el jugador respondiera todo NO cuentan como completadas.
 * - La práctica y el juego local sin sala no están en estas tablas: no cuentan.
 */
async function computeUserStats(run: DbRunner, userId: string): Promise<Record<string, number>> {
  const parts = await run<ParticipationRow>(
    `SELECT mp.id AS participant_id, gm.code AS mode, m.question_count,
            mp.status AS player_status, mp.score, mp.xp,
            m.started_at, mp.joined_at
     FROM match_participants mp
     JOIN matches m ON m.id = mp.match_id
     JOIN game_modes gm ON gm.id = m.game_mode_id
     WHERE mp.user_id = $1 AND m.status <> 'cancelled'`,
    [userId]
  );

  const aggs = await run<AggRow>(
    `SELECT pa.participant_id,
            COUNT(*)::int AS answered,
            (COUNT(*) FILTER (WHERE pa.is_correct IS TRUE))::int AS correct,
            (COUNT(*) FILTER (WHERE pa.is_correct IS FALSE))::int AS incorrect,
            COALESCE(MAX(pa.question_position), -1)::int AS max_pos
     FROM participant_answers pa
     JOIN match_participants mp ON mp.id = pa.participant_id
     JOIN matches m ON m.id = mp.match_id
     WHERE mp.user_id = $1 AND m.status <> 'cancelled'
     GROUP BY pa.participant_id`,
    [userId]
  );

  const streaks = await run<{ participant_id: string; best_streak: number }>(
    `WITH correct AS (
       SELECT pa.participant_id, pa.question_position
       FROM participant_answers pa
       JOIN match_participants mp ON mp.id = pa.participant_id
       JOIN matches m ON m.id = mp.match_id
       WHERE mp.user_id = $1 AND m.status <> 'cancelled' AND pa.is_correct IS TRUE
     ), islands AS (
       SELECT participant_id,
              question_position
                - ROW_NUMBER() OVER (PARTITION BY participant_id ORDER BY question_position) AS grp
       FROM correct
     ), runs AS (
       SELECT participant_id, grp, COUNT(*)::int AS run_len
       FROM islands
       GROUP BY participant_id, grp
     )
     SELECT participant_id, MAX(run_len)::int AS best_streak
     FROM runs
     GROUP BY participant_id`,
    [userId]
  );

  const lavaFlags = await run<{ participant_id: string; is_correct: boolean | null }>(
    `SELECT pa.participant_id, pa.is_correct
     FROM participant_answers pa
     JOIN match_participants mp ON mp.id = pa.participant_id
     JOIN matches m ON m.id = mp.match_id
     JOIN game_modes gm ON gm.id = m.game_mode_id
     WHERE mp.user_id = $1 AND gm.code = 'lava' AND m.status <> 'cancelled'
     ORDER BY pa.participant_id, pa.question_position ASC`,
    [userId]
  );

  const stats: Record<string, number> = {};
  const bump = (key: string, by = 1) => {
    stats[key] = (stats[key] ?? 0) + by;
  };
  const peak = (key: string, value: number) => {
    if ((stats[key] ?? 0) < value) stats[key] = value;
  };

  const aggByParticipant = new Map(aggs.map((a) => [a.participant_id, a]));
  const streakByParticipant = new Map(streaks.map((s) => [s.participant_id, s.best_streak]));
  const partByParticipant = new Map(parts.map((p) => [p.participant_id, p]));

  interface EndedRun {
    mode: string;
    completed: boolean;
    startedAt: number;
    joinedAt: number;
  }
  const endedRuns: EndedRun[] = [];

  for (const p of parts) {
    const agg = aggByParticipant.get(p.participant_id) ?? {
      participant_id: p.participant_id,
      answered: 0,
      correct: 0,
      incorrect: 0,
      max_pos: -1,
    };
    const mode = p.mode;

    // Acumulados en vivo (cualquier respuesta registrada cuenta).
    bump(`${mode}_correct_answers`, agg.correct);
    peak(`${mode}_best_score`, p.score);
    const streak = streakByParticipant.get(p.participant_id) ?? 0;
    peak(`${mode}_best_streak`, streak);
    if (mode === 'decisiones') bump('decisiones_total_xp', p.xp);
    if (mode === 'lava') bump('lava_total_score', p.xp);

    const questionCount = Math.max(1, p.question_count);
    const reachedEnd = agg.max_pos >= questionCount - 1;
    const eliminated = p.player_status === 'eliminated';
    const ended = eliminated || reachedEnd;
    const completed = ended && !eliminated;

    if (ended) {
      if (agg.answered > 0) {
        peak(`${mode}_best_accuracy`, Math.round((100 * agg.correct) / questionCount));
      }
      if (mode === 'tierras' || mode === 'abismos') {
        // Partidas jugadas = terminadas ganadas O perdidas (eliminado).
        bump(`${mode}_games_played`);
        bump(`${mode}_total_score`, p.score);
      }
      if (completed) {
        bump(`${mode}_games_completed`);
        bump(`${mode}_games_won`);
        bump(`${mode}_games_survived`);
        const missed = agg.answered < questionCount;
        if (agg.incorrect === 0 && !missed) bump(`${mode}_perfect_games`);
        if (agg.incorrect > 0 || missed) bump(`${mode}_games_after_error`);
      }
      endedRuns.push({
        mode,
        completed,
        startedAt: p.started_at ? new Date(p.started_at).getTime() : 0,
        joinedAt: p.joined_at ? new Date(p.joined_at).getTime() : 0,
      });
    }
  }

  // Lava: replay de ticks por participación (mismo orden/semántica que
  // recordMatchAnswer) tomando el MÁXIMO alcanzado durante la partida.
  const lavaRules = rulesForMode('lava');
  const flagsByParticipant = new Map<string, boolean[]>();
  for (const row of lavaFlags) {
    const list = flagsByParticipant.get(row.participant_id) ?? [];
    list.push(row.is_correct === true);
    flagsByParticipant.set(row.participant_id, list);
  }
  if (lavaRules.resource) {
    for (const [participantId, flags] of flagsByParticipant) {
      if (!partByParticipant.has(participantId)) continue;
      let value = lavaRules.resource.start;
      let maxReached = value;
      for (const ok of flags) {
        value = ok
          ? Math.min(lavaRules.resource.max, value + 1)
          : Math.max(0, value - 1);
        if (value > maxReached) maxReached = value;
      }
      peak('lava_max_ticks_reached', maxReached);
    }
  }

  // Rachas de victorias / victorias tras derrota (solo modos con esas metas).
  const byMode = new Map<string, EndedRun[]>();
  for (const run_ of endedRuns) {
    const list = byMode.get(run_.mode) ?? [];
    list.push(run_);
    byMode.set(run_.mode, list);
  }
  for (const [mode, list] of byMode) {
    if (mode !== 'tierras' && mode !== 'abismos') continue;
    list.sort((a, b) => a.startedAt - b.startedAt || a.joinedAt - b.joinedAt);
    let currentStreak = 0;
    let bestStreak = 0;
    let winsAfterLoss = 0;
    let prevEndedCompleted: boolean | null = null;
    for (const item of list) {
      if (item.completed) {
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        if (prevEndedCompleted === false) winsAfterLoss += 1;
      } else {
        currentStreak = 0;
      }
      prevEndedCompleted = item.completed;
    }
    peak(`${mode}_best_win_streak`, bestStreak);
    peak(`${mode}_wins_after_loss`, winsAfterLoss);
  }

  return stats;
}

const UPSERT_SQL = `
  INSERT INTO achievement_progress (user_id, achievement_id, progress, completed, unlocked_at)
  VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN now() ELSE NULL END)
  ON CONFLICT (user_id, achievement_id) DO UPDATE SET
    progress = GREATEST(achievement_progress.progress, EXCLUDED.progress),
    completed = achievement_progress.completed OR EXCLUDED.completed,
    unlocked_at = COALESCE(achievement_progress.unlocked_at, EXCLUDED.unlocked_at),
    updated_at = now()`;

async function runEvaluation(
  run: DbRunner,
  targetUserId: string,
  subjectUserId: string
): Promise<EvaluateAchievementsResult> {
  const stats = await computeUserStats(run, subjectUserId);
  const achievements = await run<AchievementRow>(ACHIEVEMENTS_SQL);
  const progressRows = await run<{ achievement_id: string; progress: number; completed: boolean }>(
    `SELECT achievement_id, progress, completed FROM achievement_progress WHERE user_id = $1`,
    [targetUserId]
  );

  const state = new Map<string, { progress: number; completed: boolean }>();
  for (const row of progressRows) {
    state.set(row.achievement_id, { progress: row.progress, completed: row.completed });
  }

  const isMeta = (a: AchievementRow) => a.mode_code !== null && a.stat_key === `${a.mode_code}_all_unlocked`;

  const nuevos: string[] = [];
  const applyOne = async (a: AchievementRow, value: number) => {
    const prev = state.get(a.id);
    const prevProgress = prev?.progress ?? 0;
    const prevCompleted = prev?.completed ?? false;
    const target = Math.max(0, Math.min(value, a.goal));
    const nextCompleted = prevCompleted || value >= a.goal;
    if (target <= prevProgress && nextCompleted === prevCompleted) return;
    await run(UPSERT_SQL, [targetUserId, a.id, target, nextCompleted]);
    state.set(a.id, {
      progress: Math.max(prevProgress, target),
      completed: nextCompleted,
    });
    if (nextCompleted && !prevCompleted) nuevos.push(a.code);
  };

  // 1ª pasada: logros con stat_key directo.
  for (const a of achievements) {
    if (isMeta(a)) continue;
    await applyOne(a, stats[a.stat_key] ?? 0);
  }

  // 2ª pasada: metas `{modo}_all_unlocked` (otros logros del mismo modo).
  for (const a of achievements) {
    if (!isMeta(a)) continue;
    const count = achievements.filter(
      (other) =>
        other.id !== a.id &&
        other.mode_code === a.mode_code &&
        (state.get(other.id)?.completed ?? false)
    ).length;
    await applyOne(a, count);
  }

  return { stats, nuevos };
}

export interface EvaluateAchievementsOptions {
  /** Usuario cuyo progreso se escribe (siempre la sesión del request). */
  targetUserId: string;
  /** Usuario cuyo juego se evalúa. Por defecto el mismo (migrate pasa el invitado). */
  subjectUserId?: string;
  /** Transacción del caller (migrate). Si se omite, abre y cierra la suya. */
  client?: PoolClient;
}

/**
 * Evalúa las estadísticas del subject en PostgreSQL y escribe el progreso
 * (monótono: GREATEST + completed sticky + unlocked_at solo la primera vez).
 * Idempotente: repetirlo sin partidas nuevas no escribe ni devuelve "nuevos".
 */
export async function evaluateAchievements(
  opts: EvaluateAchievementsOptions
): Promise<EvaluateAchievementsResult> {
  const targetUserId = opts.targetUserId;
  const subjectUserId = opts.subjectUserId ?? opts.targetUserId;
  const external = opts.client ?? null;
  const client = external ?? (await getPool().connect());
  const ownsTx = external === null;
  try {
    if (ownsTx) await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1), 601)`, [`ach:${targetUserId}`]);
    const run: DbRunner = async <T extends QueryResultRow = QueryResultRow>(
      text: string,
      params: unknown[] = []
    ) => {
      const res = await client.query<T>(text, params as never[]);
      return res.rows;
    };
    const result = await runEvaluation(run, targetUserId, subjectUserId);
    if (ownsTx) await client.query('COMMIT');
    return result;
  } catch (err) {
    if (ownsTx) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
    }
    throw err;
  } finally {
    if (ownsTx) client.release();
  }
}

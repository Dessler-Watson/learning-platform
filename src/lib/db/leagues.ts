import { query, queryOne } from './client';

export interface LeagueProgress {
  stars: number;
  current_league_id: string;
  full_name: string;
  mineral: string;
  tier: number;
  sort_order: number;
  image_path: string | null;
  color: string | null;
}

export async function getLeagueProgress(userId: string): Promise<LeagueProgress | null> {
  return queryOne<LeagueProgress>(
    `SELECT plp.stars, plp.current_league_id,
            l.full_name, l.mineral, l.tier, l.sort_order, l.image_path, l.color
     FROM player_league_progress plp
     JOIN leagues l ON l.id = plp.current_league_id
     WHERE plp.user_id = $1`,
    [userId]
  );
}

export async function ensureLeagueProgress(userId: string): Promise<number> {
  await query(
    `INSERT INTO player_league_progress (user_id, stars, current_league_id)
     VALUES ($1, 0, (SELECT id FROM leagues ORDER BY sort_order ASC LIMIT 1))
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  const row = await queryOne<{ stars: number }>(
    `SELECT stars FROM player_league_progress WHERE user_id = $1`,
    [userId]
  );
  return row?.stars ?? 0;
}

/**
 * Aplica un delta de estrellas y registra la transacción.
 * Solo debe usarse con source='room_match' (o migration/adjustment).
 * La práctica NUNCA debe llamar esto.
 */
export async function applyStarsDelta(
  userId: string,
  delta: number,
  source: 'room_match' | 'adjustment' | 'migration',
  opts: { matchId?: string | null; reason?: string | null } = {}
): Promise<LeagueProgress | null> {
  if (delta === 0) return getLeagueProgress(userId);
  const row = await queryOne<{ stars: number; current_league_id: string }>(
    `SELECT stars, current_league_id FROM player_league_progress WHERE user_id = $1 FOR UPDATE`,
    [userId]
  );
  if (!row) {
    await ensureLeagueProgress(userId);
    return applyStarsDelta(userId, delta, source, opts);
  }
  const before = row.stars;
  const after = Math.max(0, before + delta);
  const actualDelta = after - before;
  if (actualDelta === 0) return getLeagueProgress(userId);

  await query(
    `UPDATE player_league_progress SET stars = $2 WHERE user_id = $1`,
    [userId, after]
  );
  const afterRow = await queryOne<{ current_league_id: string }>(
    `SELECT current_league_id FROM player_league_progress WHERE user_id = $1`,
    [userId]
  );
  await query(
    `INSERT INTO league_transactions
       (user_id, delta_stars, stars_after, league_id_before, league_id_after, source, match_id, reason)
     VALUES ($1, $2, $3, $4, $5, $6::league_tx_source, $7, $8)`,
    [
      userId,
      actualDelta,
      after,
      row.current_league_id,
      afterRow?.current_league_id ?? row.current_league_id,
      source,
      opts.matchId ?? null,
      opts.reason ?? null,
    ]
  );
  return getLeagueProgress(userId);
}

export async function listLeagues() {
  return query(
    `SELECT id, code, mineral, tier, full_name, stars_required, sort_order, image_path, color
     FROM leagues ORDER BY sort_order`
  );
}

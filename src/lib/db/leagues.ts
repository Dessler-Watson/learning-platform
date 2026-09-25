import type { PoolClient } from 'pg';
import { getPool, query, queryOne } from './client';

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
 * Núcleo transaccional: aplica un delta de estrellas y registra la
 * transacción DENTRO de la transacción del caller (cliente con BEGIN hecho).
 * Devuelve el delta realmente aplicado (0 si no hubo cambio).
 * Solo debe usarse con source='room_match' (o migration/adjustment).
 * La práctica NUNCA debe llamar esto.
 */
export async function applyStarsDeltaInTx(
  client: PoolClient,
  userId: string,
  delta: number,
  source: 'room_match' | 'adjustment' | 'migration',
  opts: { matchId?: string | null; reason?: string | null } = {}
): Promise<number> {
  if (delta === 0) return 0;
  await client.query(
    `INSERT INTO player_league_progress (user_id, stars, current_league_id)
     VALUES ($1, 0, (SELECT id FROM leagues ORDER BY sort_order ASC LIMIT 1))
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  const rowRes = await client.query<{ stars: number; current_league_id: string }>(
    `SELECT stars, current_league_id FROM player_league_progress WHERE user_id = $1 FOR UPDATE`,
    [userId]
  );
  const row = rowRes.rows[0];
  if (!row) return 0;
  const before = row.stars;
  const after = Math.max(0, before + delta);
  const actualDelta = after - before;
  if (actualDelta === 0) return 0;

  await client.query(
    `UPDATE player_league_progress SET stars = $2 WHERE user_id = $1`,
    [userId, after]
  );
  const afterRes = await client.query<{ current_league_id: string }>(
    `SELECT current_league_id FROM player_league_progress WHERE user_id = $1`,
    [userId]
  );
  await client.query(
    `INSERT INTO league_transactions
       (user_id, delta_stars, stars_after, league_id_before, league_id_after, source, match_id, reason)
     VALUES ($1, $2, $3, $4, $5, $6::league_tx_source, $7, $8)`,
    [
      userId,
      actualDelta,
      after,
      row.current_league_id,
      afterRes.rows[0]?.current_league_id ?? row.current_league_id,
      source,
      opts.matchId ?? null,
      opts.reason ?? null,
    ]
  );
  return actualDelta;
}

/**
 * Aplica un delta de estrellas en su propia transacción (SELECT ... FOR UPDATE,
 * UPDATE de estrellas con trigger de liga y registro de league_transactions,
 * todo atómico) y devuelve el progreso resultante.
 */
export async function applyStarsDelta(
  userId: string,
  delta: number,
  source: 'room_match' | 'adjustment' | 'migration',
  opts: { matchId?: string | null; reason?: string | null } = {}
): Promise<LeagueProgress | null> {
  if (delta === 0) return getLeagueProgress(userId);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await applyStarsDeltaInTx(client, userId, delta, source, opts);
    await client.query('COMMIT');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
  return getLeagueProgress(userId);
}

export async function listLeagues() {
  return query(
    `SELECT id, code, mineral, tier, full_name, stars_required, sort_order, image_path, color
     FROM leagues ORDER BY sort_order`
  );
}

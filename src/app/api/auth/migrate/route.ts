import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Migrate guest account state into the registered account (server-side only).
 * Body: { guest_id?: string, achievements?: Record<string, unknown> }
 * Stars always come from PostgreSQL for the given guest_id — never from the client body.
 */
export async function POST(req: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (user.is_guest) {
      return NextResponse.json({ error: 'Los invitados no pueden migrar' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const guestId = body.guest_id ? String(body.guest_id) : null;
    const achievements =
      body.achievements && typeof body.achievements === 'object' && !Array.isArray(body.achievements)
        ? (body.achievements as Record<string, unknown>)
        : null;

    if (!guestId) {
      return NextResponse.json({ ok: true, migrated_stars: 0 });
    }
    if (!UUID_RE.test(guestId)) {
      return NextResponse.json({ error: 'guest_id inválido' }, { status: 400 });
    }
    if (guestId === user.id) {
      return NextResponse.json({ error: 'No puedes migrarte a ti mismo' }, { status: 400 });
    }

    await client.query('BEGIN');

    const guestRow = await client.query<{ id: string; is_guest: boolean }>(
      `SELECT id, is_guest FROM users
       WHERE id = $1 AND deleted_at IS NULL AND is_guest
       FOR UPDATE`,
      [guestId]
    );
    const guest = guestRow.rows[0];
    if (!guest) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 });
    }

    await client.query(
      `INSERT INTO player_league_progress (user_id, stars, current_league_id)
       VALUES ($1, 0, (SELECT id FROM leagues ORDER BY sort_order ASC LIMIT 1))
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    const guestStarsRow = await client.query<{ stars: number }>(
      `SELECT stars FROM player_league_progress WHERE user_id = $1`,
      [guestId]
    );
    const currentRow = await client.query<{ stars: number }>(
      `SELECT stars FROM player_league_progress WHERE user_id = $1 FOR UPDATE`,
      [user.id]
    );
    const guestStars = guestStarsRow.rows[0]?.stars ?? 0;
    const currentStars = currentRow.rows[0]?.stars ?? 0;
    let migratedStars = 0;

    if (guestStars > currentStars) {
      const delta = guestStars - currentStars;
      const after = currentStars + delta;
      await client.query(`UPDATE player_league_progress SET stars = $2 WHERE user_id = $1`, [user.id, after]);
      await client.query(
        `INSERT INTO league_transactions
           (user_id, delta_stars, stars_after, league_id_before, league_id_after, source, match_id, reason)
         VALUES ($1, $2, $3,
                 (SELECT current_league_id FROM player_league_progress WHERE user_id = $1),
                 (SELECT current_league_id FROM player_league_progress WHERE user_id = $1),
                 'migration', NULL, 'Fusión de invitado')`,
        [user.id, delta, after]
      );
      migratedStars = delta;
    }

    await client.query(
      `INSERT INTO achievement_progress (user_id, achievement_id, progress, completed, unlocked_at)
       SELECT $1, ap.achievement_id, ap.progress, ap.completed, ap.unlocked_at
       FROM achievement_progress ap
       WHERE ap.user_id = $2
       ON CONFLICT (user_id, achievement_id) DO UPDATE SET
         progress = GREATEST(achievement_progress.progress, EXCLUDED.progress),
         completed = achievement_progress.completed OR EXCLUDED.completed,
         unlocked_at = COALESCE(achievement_progress.unlocked_at, EXCLUDED.unlocked_at)`,
      [user.id, guestId]
    );

    if (achievements) {
      const rows = await client.query<{ id: string; code: string; goal: number }>(
        `SELECT id, code, goal FROM achievements WHERE active`
      );
      for (const a of rows.rows) {
        const local = achievements[a.code];
        if (local && typeof local === 'object') {
          const prog = Number((local as { progress?: number }).progress ?? 0);
          const done = Boolean((local as { completed?: boolean }).completed) || prog >= a.goal;
          if (Number.isFinite(prog) && (prog > 0 || done)) {
            await client.query(
              `INSERT INTO achievement_progress (user_id, achievement_id, progress, completed, unlocked_at)
               VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN now() ELSE NULL END)
               ON CONFLICT (user_id, achievement_id) DO UPDATE SET
                 progress = GREATEST(achievement_progress.progress, EXCLUDED.progress),
                 completed = achievement_progress.completed OR EXCLUDED.completed,
                 unlocked_at = COALESCE(achievement_progress.unlocked_at, EXCLUDED.unlocked_at)`,
              [user.id, a.id, Math.max(0, Math.min(prog, a.goal)), done]
            );
          }
        }
      }
    }

    await client.query(
      `UPDATE users SET deleted_at = now(), status = 'inactive', merged_into_user_id = $2
       WHERE id = $1 AND is_guest AND deleted_at IS NULL`,
      [guestId, user.id]
    );
    await client.query(`UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [
      guestId,
    ]);

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, migrated_stars: migratedStars });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    console.error('[auth/migrate]', err);
    return NextResponse.json({ error: 'Error al migrar datos' }, { status: 500 });
  } finally {
    client.release();
  }
}

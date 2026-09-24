import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, applyStarsDelta, ensureLeagueProgress, hashPassword, query, queryOne } from '@/lib/db';
import { verifyPassword } from '@/lib/db/password';

export const dynamic = 'force-dynamic';

/**
 * Migrate guest localStorage state into the registered account.
 * Call after login/register when the client still has guest data.
 * Body: { stars?: number, achievements?: Record<string, unknown>, practices?: unknown[] }
 * Stars only migrate if source guest data has more stars than DB (one-way upgrade).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Optional: claim a guest account by providing guest email password — guests have no password.
    // Instead: merge stars from a specified guest user id if caller knows it.
    const guestId = body.guest_id ? String(body.guest_id) : null;
    const stars = Number(body.stars ?? 0);
    const achievements = body.achievements && typeof body.achievements === 'object' ? body.achievements : null;

    await ensureLeagueProgress(user.id);
    let migratedStars = 0;

    if (guestId) {
      const guestStarsRow = await queryOne<{ stars: number }>(
        `SELECT stars FROM player_league_progress WHERE user_id = $1`,
        [guestId]
      );
      const guestStars = guestStarsRow?.stars ?? 0;
      const current = await queryOne<{ stars: number }>(
        `SELECT stars FROM player_league_progress WHERE user_id = $1`,
        [user.id]
      );
      if (guestStars > (current?.stars ?? 0)) {
        const delta = guestStars - (current?.stars ?? 0);
        await applyStarsDelta(user.id, delta, 'migration', { reason: 'Fusión de invitado' });
        migratedStars = delta;
      }
      // Transfer guest achievements
      await query(
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
      // Soft-delete guest user
      await query(`UPDATE users SET deleted_at = now(), status = 'inactive' WHERE id = $1 AND is_guest`, [guestId]);
      await query(
        `UPDATE users SET merged_into_user_id = $2 WHERE id = $1 AND is_guest`,
        [guestId, user.id]
      );
    } else if (stars > 0) {
      const current = await queryOne<{ stars: number }>(
        `SELECT stars FROM player_league_progress WHERE user_id = $1`,
        [user.id]
      );
      if (stars > (current?.stars ?? 0)) {
        await applyStarsDelta(user.id, stars - (current?.stars ?? 0), 'migration', {
          reason: 'Migración de localStorage',
        });
        migratedStars = stars - (current?.stars ?? 0);
      }
    }

    if (achievements) {
      const rows = await query<{ id: string; code: string; goal: number }>(
        `SELECT id, code, goal FROM achievements WHERE active`
      );
      for (const a of rows) {
        const local = achievements[a.code];
        if (local && typeof local === 'object') {
          const prog = Number((local as { progress?: number }).progress ?? 0);
          const done = Boolean((local as { completed?: boolean }).completed) || prog >= a.goal;
          if (prog > 0 || done) {
            await query(
              `INSERT INTO achievement_progress (user_id, achievement_id, progress, completed, unlocked_at)
               VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN now() ELSE NULL END)
               ON CONFLICT (user_id, achievement_id) DO UPDATE SET
                 progress = GREATEST(achievement_progress.progress, EXCLUDED.progress),
                 completed = achievement_progress.completed OR EXCLUDED.completed,
                 unlocked_at = COALESCE(achievement_progress.unlocked_at, EXCLUDED.unlocked_at)`,
              [user.id, a.id, Math.min(prog, a.goal), done]
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true, migrated_stars: migratedStars });
  } catch (err) {
    console.error('[auth/migrate]', err);
    return NextResponse.json({ error: 'Error al migrar datos' }, { status: 500 });
  }
}

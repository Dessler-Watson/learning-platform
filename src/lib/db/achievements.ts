import { query, queryOne } from './client';

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

export async function listAchievements(): Promise<AchievementRow[]> {
  return query<AchievementRow>(
    `SELECT a.id, a.code, a.name, a.description, a.difficulty::text AS difficulty,
            a.icon, a.goal, a.stat_key, gm.code AS mode_code
     FROM achievements a
     LEFT JOIN game_modes gm ON gm.id = a.game_mode_id
     WHERE a.active
     ORDER BY a.code`
  );
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

export async function upsertProgress(
  userId: string,
  achievementId: string,
  progress: number,
  completed: boolean
): Promise<void> {
  await query(
    `INSERT INTO achievement_progress (user_id, achievement_id, progress, completed, unlocked_at)
     VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN now() ELSE NULL END)
     ON CONFLICT (user_id, achievement_id) DO UPDATE SET
       progress = GREATEST(achievement_progress.progress, EXCLUDED.progress),
       completed = achievement_progress.completed OR EXCLUDED.completed,
       unlocked_at = COALESCE(achievement_progress.unlocked_at, EXCLUDED.unlocked_at),
       updated_at = now()`,
    [userId, achievementId, progress, completed]
  );
}

export async function getProgressMap(userId: string): Promise<Map<string, AchievementProgressRow>> {
  const rows = await listProgress(userId);
  return new Map(rows.map((r) => [r.code, r]));
}

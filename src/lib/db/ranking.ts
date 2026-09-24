import { query } from './client';

export interface RankingEntry {
  user_id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  stars: number;
  league_name: string;
  mineral: string;
  tier: number;
  sort_order: number;
  global_rank: number;
}

/**
 * Ranking competitivo público (estrellas de salas).
 * Solo campos de competencia: nombre, avatar, estrellas, liga, nivel.
 * Nada de email/password/tokens/roles.
 */
export async function getGlobalRanking(limit = 50): Promise<RankingEntry[]> {
  return query<RankingEntry>(
    `SELECT v.user_id, v.nombre, v.apellido,
            coalesce(u.custom_avatar, nullif(concat('/images/avatares/', a.image), '/images/avatares/')) AS avatar,
            v.stars, v.league_name, v.mineral, v.tier::int AS tier, v.sort_order::int AS sort_order,
            v.global_rank::int AS global_rank
     FROM v_league_leaderboard v
     JOIN users u ON u.id = v.user_id
     LEFT JOIN avatars a ON a.id = v.avatar_id
     ORDER BY v.global_rank ASC, v.stars DESC
     LIMIT $1`,
    [limit]
  );
}

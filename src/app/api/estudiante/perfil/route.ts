import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getUserById, updateProfile, getLeagueProgress, ensureLeagueProgress, listAvatars, queryOne, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    await ensureLeagueProgress(user.id);
    const league = await getLeagueProgress(user.id);

    const practiceStats = await queryOne<{ total: number; avg_score: number; best_score: number }>(
      `SELECT count(*)::int AS total, COALESCE(avg(score),0)::int AS avg_score, COALESCE(max(score),0)::int AS best_score
       FROM practice_results WHERE user_id = $1`,
      [user.id]
    );
    const matchStats = await queryOne<{ games: number; wins: number }>(
      `SELECT count(*)::int AS games,
              count(*) FILTER (WHERE rn = 1)::int AS wins
       FROM (
         SELECT mp.user_id,
                dense_rank() OVER (PARTITION BY m.id ORDER BY mp.score DESC) AS rn
         FROM match_participants mp
         JOIN matches m ON m.id = mp.match_id AND m.status = 'finished'
         WHERE mp.user_id = $1
       ) t`,
      [user.id]
    );

    return NextResponse.json({
      usuario: {
        id_usuario: user.id,
        nombre: user.nombre,
        apellido: user.apellido || '',
        correo: user.email,
        rol: user.role,
        fecha_registro: user.created_at,
        is_guest: user.is_guest,
        avatar: {
          id_avatar: user.avatar_sort || 1,
          nombre: user.avatar_name || 'Güegüense',
          imagen: user.avatar_image || 'gueguense.png',
          custom: user.custom_avatar,
        },
      },
      estrellas: league?.stars ?? 0,
      liga: league
        ? {
            id: league.current_league_id,
            nombre: league.full_name,
            mineral: league.mineral,
            tier: league.tier,
            color: league.color,
            imagen: league.image_path,
            siguiente: null,
          }
        : null,
      estadisticas: {
        practicas: practiceStats?.total ?? 0,
        promedio_practica: practiceStats?.avg_score ?? 0,
        mejor_practica: practiceStats?.best_score ?? 0,
        partidas: matchStats?.games ?? 0,
        victorias: matchStats?.wins ?? 0,
      },
    });
  } catch (err) {
    console.error('[perfil GET]', err);
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : undefined;
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : undefined;
    const avatarId = body.avatar_id !== undefined && body.avatar_id !== null ? Number(body.avatar_id) : undefined;
    const customAvatar = body.custom_avatar !== undefined ? body.custom_avatar : undefined;

    if (avatarId !== undefined && !Number.isNaN(avatarId)) {
      const avatares = await listAvatars();
      if (!avatares.some((a) => a.sort_order === avatarId)) {
        return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 400 });
      }
    }

    const updated = await updateProfile(session.id, {
      nombre,
      apellido,
      avatarSort: avatarId !== undefined && !Number.isNaN(avatarId) ? avatarId : undefined,
      customAvatar,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id_usuario: updated.id,
        nombre: updated.nombre,
        apellido: updated.apellido || '',
        correo: updated.email,
        avatar: {
          id_avatar: updated.avatar_sort || 1,
          nombre: updated.avatar_name || 'Güegüense',
          imagen: updated.avatar_image || 'gueguense.png',
          custom: updated.custom_avatar,
        },
      },
    });
  } catch (err) {
    console.error('[perfil PATCH]', err);
    return NextResponse.json({ error: 'Error al guardar los cambios' }, { status: 500 });
  }
}

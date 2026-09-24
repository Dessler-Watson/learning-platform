import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, ensureLeagueProgress } from '@/lib/db';
import { getGlobalRanking } from '@/lib/db/ranking';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    await ensureLeagueProgress(session.id);

    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get('limit') ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const ranking = await getGlobalRanking(limit);
    return NextResponse.json({
      ranking: ranking.map((r) => ({
        posicion: r.global_rank,
        id: r.user_id,
        nombre: r.apellido ? `${r.nombre} ${r.apellido}` : r.nombre,
        avatar: r.avatar,
        estrellas: r.stars,
        liga: r.league_name,
        mineral: r.mineral,
        nivel: r.tier,
        es_tu: r.user_id === session.id,
      })),
    });
  } catch (err) {
    console.error('[ranking GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

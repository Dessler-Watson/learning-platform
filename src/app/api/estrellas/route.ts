import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getLeagueProgress, ensureLeagueProgress, applyStarsDelta, listLeagues } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    await ensureLeagueProgress(session.id);
    const progress = await getLeagueProgress(session.id);
    return NextResponse.json({ estrellas: progress?.stars ?? 0, liga: progress });
  } catch (err) {
    console.error('[estrellas GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/** Manual star adjustment is restricted to admins. Game flows use finish-room server logic. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await req.json();
    const userId = String(body.user_id ?? '');
    const delta = Number(body.delta ?? 0);
    if (!userId || !Number.isFinite(delta) || delta === 0) {
      return NextResponse.json({ error: 'user_id y delta requeridos' }, { status: 400 });
    }
    const progress = await applyStarsDelta(userId, delta, 'adjustment', { reason: body.reason ?? 'Ajuste admin' });
    return NextResponse.json({ ok: true, estrellas: progress?.stars ?? 0 });
  } catch (err) {
    console.error('[estrellas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

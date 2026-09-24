import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, ensureLeagueProgress } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    await ensureLeagueProgress(user.id);
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[auth/me]', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

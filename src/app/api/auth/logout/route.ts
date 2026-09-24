import { NextRequest, NextResponse } from 'next/server';
import { revokeSession, clearSessionCookie, getSessionTokenFromRequest } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = getSessionTokenFromRequest(req);
    if (token) {
      await revokeSession(token);
    }
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', clearSessionCookie());
    return res;
  } catch (err) {
    console.error('[auth/logout]', err);
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', clearSessionCookie());
    return res;
  }
}

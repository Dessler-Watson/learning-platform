import { NextRequest, NextResponse } from 'next/server';
import {
  revokeSession,
  clearPanelSessionCookie,
  getPanelSessionTokenFromRequest,
  getSessionTokenFromRequest,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Solo revoca/clear la sesión del panel: la sesión de estudiante del
    // mismo navegador (cookie compartida) no se toca.
    const token = getPanelSessionTokenFromRequest(req) ?? getSessionTokenFromRequest(req);
    if (token) await revokeSession(token);
  } catch (err) {
    console.error('[panel/auth/logout]', err);
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearPanelSessionCookie(req));
  return res;
}

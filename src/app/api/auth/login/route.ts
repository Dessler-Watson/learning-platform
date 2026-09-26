import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  setSessionCookie,
  getSessionTokenFromRequest,
  getUserBySessionToken,
  setGuestMergeCookie,
  updateLastLogin,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña son obligatorios' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // La contraseña se verifica ANTES del estado para no revelar si una cuenta
    // existe/está desactivada sin credenciales (evita enumeración de cuentas).
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
    }

    await updateLastLogin(user.id);
    const token = await createSession(user.id, req.headers.get('user-agent'), req.headers.get('x-forwarded-for'));

    // Vínculo invitado→cuenta: conserva el token del invitado entrante para la
    // verificación de propiedad en /api/auth/migrate.
    const incomingToken = getSessionTokenFromRequest(req);
    const incomingUser = incomingToken ? await getUserBySessionToken(incomingToken) : null;
    const guestMerge = incomingUser?.is_guest ? setGuestMergeCookie(incomingToken!, req) : null;

    const res = NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
        is_guest: user.is_guest,
        avatar_sort: user.avatar_sort,
        avatar_image: user.avatar_image,
        custom_avatar: user.custom_avatar,
      },
    });
    res.headers.set('Set-Cookie', setSessionCookie(token, req));
    if (guestMerge) res.headers.append('Set-Cookie', guestMerge);
    return res;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}

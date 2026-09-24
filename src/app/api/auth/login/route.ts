import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  setSessionCookie,
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
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await updateLastLogin(user.id);
    const token = await createSession(user.id, req.headers.get('user-agent'), req.headers.get('x-forwarded-for'));

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
    res.headers.set('Set-Cookie', setSessionCookie(token));
    return res;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}

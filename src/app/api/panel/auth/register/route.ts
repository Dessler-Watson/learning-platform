import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, hashPassword, createSession, setSessionCookie, updateLastLogin, getSessionUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nombre = String(body.nombre ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const institutionName = String(body.institution ?? body.institution_name ?? '').trim() || null;

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }

    const caller = await getSessionUser(req);
    const requestedRole = String(body.role ?? body.rol ?? 'teacher');
    let roleCode: 'teacher' | 'admin' = 'teacher';
    if (requestedRole === 'admin') {
      if (!caller || caller.role !== 'admin') {
        return NextResponse.json({ error: 'Solo un administrador puede crear cuentas admin' }, { status: 403 });
      }
      roleCode = 'admin';
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      roleCode,
      nombre,
      email,
      passwordHash,
      institutionName,
    });
    await updateLastLogin(user.id);

    const payload = {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        institution: user.institution_name,
      },
    };

    // Staff creating another account: do not replace the caller's session cookie.
    if (caller) {
      return NextResponse.json(payload, { status: 201 });
    }

    const token = await createSession(user.id, req.headers.get('user-agent'), req.headers.get('x-forwarded-for'));
    const res = NextResponse.json(payload, { status: 201 });
    res.headers.set('Set-Cookie', setSessionCookie(token, req));
    return res;
  } catch (err) {
    console.error('[panel/auth/register]', err);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}

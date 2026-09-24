import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, hashPassword, createSession, setSessionCookie, updateLastLogin } from '@/lib/db';

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
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const requestedRole = String(body.role ?? body.rol ?? 'teacher');
    const roleCode = requestedRole === 'admin' ? 'admin' : 'teacher';
    const user = await createUser({
      roleCode,
      nombre,
      email,
      passwordHash,
      institutionName,
    });
    await updateLastLogin(user.id);
    const token = await createSession(user.id, req.headers.get('user-agent'), req.headers.get('x-forwarded-for'));

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          institution: user.institution_name,
        },
      },
      { status: 201 }
    );
    res.headers.set('Set-Cookie', setSessionCookie(token));
    return res;
  } catch (err) {
    console.error('[panel/auth/register]', err);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}

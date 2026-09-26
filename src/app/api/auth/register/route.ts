import { NextRequest, NextResponse } from 'next/server';
import {
  createUser,
  getUserByEmail,
  hashPassword,
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
    const nombre = String(body.nombre ?? '').trim();
    const apellido = String(body.apellido ?? '').trim() || null;
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const avatarSort = body.avatar != null ? Number(body.avatar) : null;
    const birthDate = body.birth_date ? String(body.birth_date) : null;
    const sexRaw = body.sex ? String(body.sex).trim().toLowerCase() : null;
    const sex = sexRaw === 'masculino' || sexRaw === 'femenino' ? sexRaw : null;

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }
    if (nombre.length > 100) {
      return NextResponse.json({ error: 'El nombre es demasiado largo' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json({ error: 'Fecha de nacimiento inválida' }, { status: 400 });
    }
    if (avatarSort !== null && !Number.isInteger(avatarSort)) {
      return NextResponse.json({ error: 'Avatar inválido' }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      roleCode: 'student',
      nombre,
      apellido,
      email,
      passwordHash,
      avatarSort: Number.isFinite(avatarSort) ? avatarSort : null,
      birthDate,
      sex,
    });
    await updateLastLogin(user.id);
    const token = await createSession(user.id, req.headers.get('user-agent'), req.headers.get('x-forwarded-for'));

    // Si la sesión entrante pertenece a un invitado, conserva su token en una
    // cookie de vínculo para que /api/auth/migrate pueda verificar la propiedad
    // del guest_id (el cookie de sesión queda sobrescrito por el nuevo).
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
    }, { status: 201 });
    res.headers.set('Set-Cookie', setSessionCookie(token, req));
    if (guestMerge) res.headers.append('Set-Cookie', guestMerge);
    return res;
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}

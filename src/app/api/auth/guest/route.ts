import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession, setSessionCookie, ensureLeagueProgress } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (nombre.length > 50) {
      return NextResponse.json({ error: 'El nombre es demasiado largo (máx. 50)' }, { status: 400 });
    }

    const user = await createUser({
      roleCode: 'student',
      nombre,
      isGuest: true,
    });
    await ensureLeagueProgress(user.id);
    const token = await createSession(user.id, req.headers.get('user-agent'), req.headers.get('x-forwarded-for'));

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: null,
          role: user.role,
          is_guest: true,
          avatar_sort: user.avatar_sort,
          avatar_image: user.avatar_image,
          custom_avatar: user.custom_avatar,
        },
      },
      { status: 201 }
    );
    res.headers.set('Set-Cookie', setSessionCookie(token, req));
    return res;
  } catch (err) {
    console.error('[auth/guest]', err);
    return NextResponse.json({ error: 'Error al crear invitado' }, { status: 500 });
  }
}

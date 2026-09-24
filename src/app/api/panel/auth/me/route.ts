import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[panel/auth/me]', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

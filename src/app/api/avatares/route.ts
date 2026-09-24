import { NextResponse } from 'next/server';
import { listAvatars } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const avatares = await listAvatars();
    return NextResponse.json(
      avatares.map((a) => ({
        id_avatar: a.sort_order,
        nombre: a.name,
        imagen: a.image,
        desbloqueado: true,
      }))
    );
  } catch (err) {
    console.error('[avatares GET]', err);
    return NextResponse.json({ error: 'Error al listar avatares' }, { status: 500 });
  }
}

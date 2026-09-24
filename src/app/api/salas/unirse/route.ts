import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getRoomByCode, listParticipants, joinRoom } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
    if (!codigo) {
      return NextResponse.json({ error: 'El código de sala es requerido' }, { status: 400 });
    }

    const sala = await getRoomByCode(codigo);
    if (!sala) {
      return NextResponse.json({ error: 'Código de sala no encontrado' }, { status: 404 });
    }

    const result = await joinRoom(sala.id, session.id);
    if (!result.joined) {
      return NextResponse.json({ error: result.reason ?? 'No se pudo unir' }, { status: 400 });
    }

    const fresh = await getRoomByCode(codigo);
    const participantes = await listParticipants(sala.id);
    return NextResponse.json({
      success: true,
      sala: {
        id_sala: sala.id,
        codigo: sala.code,
        nombre: sala.name,
        estado: fresh?.status ?? sala.status,
        max_jugadores: sala.max_players,
        juego: { nombre: sala.mode_code },
      },
      participantes,
      usuario_id: session.id,
    });
  } catch (err) {
    console.error('[salas/unirse]', err);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

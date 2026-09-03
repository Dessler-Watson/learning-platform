import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/data';

interface Sala {
  id_sala: number;
  juego_id: number;
  creador_id: number;
  codigo: string;
  tipo: string;
  estado: string;
  max_jugadores: number;
}

interface Juego {
  id_juego: number;
  nombre: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, usuario_id } = body;

    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json({ error: 'El código de sala es requerido' }, { status: 400 });
    }

    const salas = readData<Sala>('salas');
    const juegos = readData<Juego>('juegos');

    const sala = salas.find(s => s.codigo.toLowerCase() === codigo.trim().toLowerCase());

    if (!sala) {
      return NextResponse.json({ error: 'Código de sala no encontrado' }, { status: 404 });
    }

    if (sala.estado !== 'esperando') {
      return NextResponse.json({ error: 'La sala no está disponible para unirse' }, { status: 400 });
    }

    const juego = juegos.find(j => j.id_juego === sala.juego_id);

    return NextResponse.json({
      success: true,
      sala: {
        id_sala: sala.id_sala,
        codigo: sala.codigo,
        estado: sala.estado,
        max_jugadores: sala.max_jugadores,
        juego: {
          id_juego: juego?.id_juego || sala.juego_id,
          nombre: juego?.nombre || 'Juego',
        },
      },
      usuario_id: usuario_id || null,
    });
  } catch {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

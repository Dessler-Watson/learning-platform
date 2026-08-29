import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, getNextId } from '@/lib/data';

interface Sala { id_sala: number; juego_id: number; creador_id: number; codigo: string; tipo: string; estado: string; max_jugadores: number; }
interface Juego { id_juego: number; nombre: string; }
interface Usuario { id_usuario: number; nombre: string; }
interface Partida { sala_id: number; }

export async function GET(req: NextRequest) {
  const salas = readData<Sala>('salas');
  const juegos = readData<Juego>('juegos');
  const usuarios = readData<Usuario>('usuarios');
  const partidas = readData<Partida>('partidas');

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get('estado');
  const juego = searchParams.get('juego');

  let result = salas.map(s => ({
    ...s,
    juego_nombre: juegos.find(j => j.id_juego === s.juego_id)?.nombre || '',
    creador_nombre: usuarios.find(u => u.id_usuario === s.creador_id)?.nombre || '',
    total_partidas: partidas.filter(p => p.sala_id === s.id_sala).length,
  }));

  if (estado) result = result.filter(s => s.estado === estado);
  if (juego) result = result.filter(s => s.juego_id === parseInt(juego));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData<Sala>('salas');
  const newId = getNextId('salas');
  const newSala = {
    id_sala: newId,
    juego_id: body.juego_id,
    creador_id: body.creador_id || 1,
    codigo: body.codigo,
    tipo: body.tipo || 'publica',
    estado: 'esperando',
    max_jugadores: body.max_jugadores || 8,
  };
  data.push(newSala);
  writeData('salas', data);
  return NextResponse.json(newSala, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const id = parseInt(parts[parts.length - 2]);
  const data = readData<Sala>('salas');
  const idx = data.findIndex(s => s.id_sala === id);
  if (idx === -1) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
  data[idx] = { ...data[idx], estado: body.estado };
  writeData('salas', data);
  return NextResponse.json(data[idx]);
}

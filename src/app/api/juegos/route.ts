import { NextResponse } from 'next/server';
import { readData } from '@/lib/data';

interface Juego { id_juego: number; nombre: string; descripcion: string; imagen: string; }
interface Cuestionario { id_cuestionario: number; nombre: string; }
interface Sala { juego_id: number; id_sala: number; }
interface Partida { sala_id: number; }
interface JuegoCuestionario { juego_id: number; cuestionario_id: number; }

export async function GET() {
  const juegos = readData<Juego>('juegos');
  const cuestionarios = readData<Cuestionario>('cuestionarios');
  const salas = readData<Sala>('salas');
  const partidas = readData<Partida>('partidas');
  const juegoCuestionario = readData<JuegoCuestionario>('juego_cuestionario');

  const result = juegos.map(j => ({
    ...j,
    cuestionarios: juegoCuestionario
      .filter(jc => jc.juego_id === j.id_juego)
      .map(jc => {
        const c = cuestionarios.find(q => q.id_cuestionario === jc.cuestionario_id);
        return { id_cuestionario: c?.id_cuestionario, nombre: c?.nombre };
      }),
    total_salas: salas.filter(s => s.juego_id === j.id_juego).length,
    total_partidas: partidas.filter(p => {
      const sala = salas.find(s => s.id_sala === p.sala_id);
      return sala?.juego_id === j.id_juego;
    }).length,
  }));

  return NextResponse.json(result);
}

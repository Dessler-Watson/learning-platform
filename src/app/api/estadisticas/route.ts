import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/data';

interface Resultado { correctas: number; incorrectas: number; puntaje: number; copas: number; }
interface Estadistica { juego_id: number; usuario_id: number; partidas: number; victorias: number; correctas: number; incorrectas: number; tiempo_promedio: number; }
interface Juego { id_juego: number; nombre: string; }
interface Usuario { id_usuario: number; nombre: string; rol: string; }
interface Progreso { usuario_id: number; copas: number; victorias: number; racha: number; }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');

  if (tipo === 'general') {
    const resultados = readData<Resultado>('resultados');
    const totalCorrectas = resultados.reduce((s, r) => s + (r.correctas || 0), 0);
    const totalIncorrectas = resultados.reduce((s, r) => s + (r.incorrectas || 0), 0);
    const puntajePromedio = resultados.length > 0
      ? Math.round((resultados.reduce((s, r) => s + (r.puntaje || 0), 0) / resultados.length) * 10) / 10
      : 0;
    const totalCopas = resultados.reduce((s, r) => s + (r.copas || 0), 0);
    return NextResponse.json({ total_correctas: totalCorrectas, total_incorrectas: totalIncorrectas, puntaje_promedio: puntajePromedio, total_copas: totalCopas });
  }

  if (tipo === 'por-juego') {
    const estadisticas = readData<Estadistica>('estadisticas');
    const juegos = readData<Juego>('juegos');
    const result = juegos.map(j => {
      const stats = estadisticas.filter(e => e.juego_id === j.id_juego);
      return {
        juego: j.nombre,
        estudiantes: stats.length,
        total_partidas: stats.reduce((s, e) => s + (e.partidas || 0), 0),
        total_victorias: stats.reduce((s, e) => s + (e.victorias || 0), 0),
        total_correctas: stats.reduce((s, e) => s + (e.correctas || 0), 0),
        total_incorrectas: stats.reduce((s, e) => s + (e.incorrectas || 0), 0),
        tiempo_promedio: stats.length > 0 ? Math.round((stats.reduce((s, e) => s + (e.tiempo_promedio || 0), 0) / stats.length) * 10) / 10 : 0,
      };
    });
    return NextResponse.json(result);
  }

  if (tipo === 'por-estudiante') {
    const usuarios = readData<Usuario>('usuarios');
    const estadisticas = readData<Estadistica>('estadisticas');
    const estudiantes = usuarios.filter(u => u.rol === 'estudiante');
    const result = estudiantes.map(u => {
      const stats = estadisticas.filter(e => e.usuario_id === u.id_usuario);
      const totalPartidas = stats.reduce((s, e) => s + (e.partidas || 0), 0);
      const totalVictorias = stats.reduce((s, e) => s + (e.victorias || 0), 0);
      const totalCorrectas = stats.reduce((s, e) => s + (e.correctas || 0), 0);
      const totalIncorrectas = stats.reduce((s, e) => s + (e.incorrectas || 0), 0);
      const porcentajeAcierto = totalCorrectas + totalIncorrectas > 0
        ? Math.round((totalCorrectas * 100) / (totalCorrectas + totalIncorrectas) * 10) / 10
        : 0;
      return { id_usuario: u.id_usuario, nombre: u.nombre, total_partidas: totalPartidas, total_victorias: totalVictorias, total_correctas: totalCorrectas, total_incorrectas: totalIncorrectas, porcentaje_acierto: porcentajeAcierto };
    });
    return NextResponse.json(result.sort((a, b) => b.total_partidas - a.total_partidas));
  }

  if (tipo === 'top-estudiantes') {
    const usuarios = readData<Usuario>('usuarios');
    const progreso = readData<Progreso>('progreso');
    const estudiantes = usuarios.filter(u => u.rol === 'estudiante');
    const result = estudiantes.map(u => {
      const prog = progreso.filter(p => p.usuario_id === u.id_usuario);
      return {
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        total_copas: prog.reduce((s, p) => s + (p.copas || 0), 0),
        total_victorias: prog.reduce((s, p) => s + (p.victorias || 0), 0),
        mejor_racha: Math.max(0, ...prog.map(p => p.racha || 0)),
      };
    });
    return NextResponse.json(result.sort((a, b) => b.total_copas - a.total_copas).slice(0, 10));
  }

  return NextResponse.json({ error: 'Tipo de estadistica no valido' }, { status: 400 });
}

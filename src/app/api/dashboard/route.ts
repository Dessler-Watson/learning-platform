import { NextResponse } from 'next/server';
import { readData } from '@/lib/data';

interface Usuario { rol: string; estado: string; }
interface Sala { id_sala: number; estado: string; juego_id: number; }
interface Partida { id_partida: number; sala_id: number; }
interface Pregunta { id_pregunta: number; categoria_id: number; }
interface Curso { id_curso: number; nombre: string; docente_id: number; }
interface Resultado { correctas: number; incorrectas: number; puntaje: number; copas: number; }
interface Categoria { id_categoria: number; nombre: string; }
interface CursoEstudiante { curso_id: number; usuario_id: number; }
interface Juego { id_juego: number; nombre: string; }

export async function GET() {
  const usuarios = readData<Usuario>('usuarios');
  const salas = readData<Sala>('salas');
  const partidas = readData<Partida>('partidas');
  const preguntas = readData<Pregunta>('preguntas');
  const cursos = readData<Curso>('cursos');
  const resultados = readData<Resultado>('resultados');
  const categorias = readData<Categoria>('categorias');
  const cursoEstudiante = readData<CursoEstudiante>('curso_estudiante');
  const juegos = readData<Juego>('juegos');

  const estudiantesActivos = usuarios.filter(u => u.rol === 'estudiante' && u.estado === 'activo').length;
  const totalEstudiantes = usuarios.filter(u => u.rol === 'estudiante').length;
  const totalDocentes = usuarios.filter(u => u.rol === 'docente').length;
  const salasActivas = salas.filter(s => s.estado === 'jugando').length;

  const totalCorrectas = resultados.reduce((s, r) => s + (r.correctas || 0), 0);
  const totalIncorrectas = resultados.reduce((s, r) => s + (r.incorrectas || 0), 0);
  const porcentajeAcierto = totalCorrectas + totalIncorrectas > 0
    ? Math.round((totalCorrectas * 100) / (totalCorrectas + totalIncorrectas) * 10) / 10
    : 0;

  // Temas con más errores (simulado basado en categorías)
  const temasMasErrores = categorias.slice(0, 5).map(c => ({
    categoria: c.nombre,
    total_errores: Math.floor(Math.random() * 10) + 1
  }));

  // Participación por curso
  const participacionCursos = cursos.map(c => ({
    nombre: c.nombre,
    estudiantes: cursoEstudiante.filter(ce => ce.curso_id === c.id_curso).length
  }));

  // Partidas por juego
  const partidasPorJuego = juegos.map(j => ({
    juego: j.nombre,
    partidas: partidas.filter(p => {
      const sala = salas.find(s => s.id_sala === p.sala_id);
      return sala?.juego_id === j.id_juego;
    }).length
  }));

  return NextResponse.json({
    estudiantes_activos: estudiantesActivos,
    total_estudiantes: totalEstudiantes,
    total_docentes: totalDocentes,
    salas_activas: salasActivas,
    total_partidas: partidas.length,
    total_preguntas: preguntas.length,
    total_cursos: cursos.length,
    rendimiento_general: { total_correctas: totalCorrectas, total_incorrectas: totalIncorrectas, porcentaje_acierto: porcentajeAcierto },
    temas_mas_errores: temasMasErrores,
    participacion_cursos: participacionCursos,
    partidas_por_juego: partidasPorJuego,
  });
}

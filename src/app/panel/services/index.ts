import { Curso, CursoEstudiante, Pregunta, Estudiante, Juego, Actividad, EstadisticasInicio } from '../types';
import { cursos } from '../data/cursos';
import { cursoEstudiantes, estudiantes } from '../data/estudiantes';
import { preguntas } from '../data/preguntas';
import { juegos } from '../data/juegos';
import { actividadReciente } from '../data/actividad';
import { salas } from '../data/salas';
import { Sala, ParticipanteSala, DetalleEstudianteSala, PreguntaDificil, ModoJuego, RespuestaDetalleSala } from '../types';

const delay = () => new Promise((r) => setTimeout(r, 60));

// ─── Cursos ───

export interface CursoConDetalles extends Curso {
  totalEstudiantes: number;
  promedio: number;
  progreso: number;
  totalPreguntas: number;
}

function calcularDetallesCurso(curso: Curso): CursoConDetalles {
  const rels = cursoEstudiantes.filter((r) => r.cursoId === curso.id);
  const count = rels.length;
  const promedio = count > 0 ? Math.round(rels.reduce((a, r) => a + r.progreso, 0) / count) : 0;
  const totalPreguntas = preguntas.filter((p) => p.cursoId === curso.id && p.estado === 'activa').length;
  return { ...curso, totalEstudiantes: count, promedio, progreso: promedio, totalPreguntas };
}

export const cursosService = {
  async obtenerTodos(teacherId: string): Promise<Curso[]> {
    await delay();
    return cursos.filter((c) => c.teacherId === teacherId);
  },
  async obtenerPorGameMode(teacherId: string, gameModeId: string): Promise<CursoConDetalles[]> {
    await delay();
    return cursos.filter((c) => c.teacherId === teacherId && c.gameModeId === gameModeId).map(calcularDetallesCurso);
  },
  async obtenerPorId(id: string): Promise<Curso | undefined> {
    await delay();
    return cursos.find((c) => c.id === id);
  },
  async crear(teacherId: string, data: Omit<Curso, 'id' | 'fechaCreacion' | 'teacherId'>): Promise<Curso> {
    await delay();
    const nuevo: Curso = { ...data, teacherId, id: `cur-${Date.now()}`, fechaCreacion: new Date().toISOString().split('T')[0] };
    cursos.push(nuevo);
    return nuevo;
  },
  async actualizar(id: string, data: Partial<Curso>): Promise<Curso | undefined> {
    await delay();
    const idx = cursos.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    cursos[idx] = { ...cursos[idx], ...data };
    return cursos[idx];
  },
  async eliminar(id: string): Promise<boolean> {
    await delay();
    const idx = cursos.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    cursos.splice(idx, 1);
    return true;
  },
  async copiarCurso(cursoId: string): Promise<{ curso: Curso; preguntas: Pregunta[] } | undefined> {
    await delay();
    const curso = cursos.find((c) => c.id === cursoId);
    if (!curso) return undefined;
    const preguntasCurso = preguntas.filter((p) => p.cursoId === cursoId);
    return { curso, preguntas: preguntasCurso };
  },
  async pegarCurso(teacherId: string, gameModeId: string, datos: { curso: Curso; preguntas: Pregunta[] }, nombrePersonalizado?: string): Promise<Curso> {
    await delay();
    const nuevoCursoId = `cur-${Date.now()}`;
    const nuevoCurso: Curso = { id: nuevoCursoId, teacherId, nombre: nombrePersonalizado ?? `${datos.curso.nombre} (Copia)`, descripcion: datos.curso.descripcion, estado: datos.curso.estado, fechaCreacion: new Date().toISOString().split('T')[0], gameModeId };
    cursos.push(nuevoCurso);
    datos.preguntas.forEach((pregunta, idx) => {
      const nuevaPregunta: Pregunta = { id: `pre-${Date.now()}-${idx}`, teacherId, juegoId: gameModeId, cursoId: nuevoCursoId, enunciado: pregunta.enunciado, opciones: [...pregunta.opciones], respuestaCorrecta: pregunta.respuestaCorrecta, estado: pregunta.estado };
      preguntas.push(nuevaPregunta);
    });
    return nuevoCurso;
  },
  async existeCursoConNombre(teacherId: string, gameModeId: string, nombre: string): Promise<boolean> {
    await delay();
    return cursos.some((c) => c.teacherId === teacherId && c.gameModeId === gameModeId && c.nombre.toLowerCase() === nombre.toLowerCase());
  },
};

// ─── Juegos ───

export interface JuegoConDetalles extends Juego {
  totalPreguntas: number;
  preguntasActivas: number;
}

export const juegosService = {
  async obtenerTodos(teacherId: string): Promise<JuegoConDetalles[]> {
    await delay();
    return juegos.map((juego) => {
      const delJuego = preguntas.filter((p) => p.teacherId === teacherId && p.juegoId === juego.id);
      return { ...juego, totalPreguntas: delJuego.length, preguntasActivas: delJuego.filter((p) => p.estado === 'activa').length };
    });
  },
  async obtenerPorId(id: string): Promise<JuegoConDetalles | undefined> {
    await delay();
    const juego = juegos.find((j) => j.id === id);
    if (!juego) return undefined;
    const delJuego = preguntas.filter((p) => p.juegoId === juego.id);
    return { ...juego, totalPreguntas: delJuego.length, preguntasActivas: delJuego.filter((p) => p.estado === 'activa').length };
  },
};

// ─── Preguntas ───

export const preguntasService = {
  async obtenerTodas(teacherId: string): Promise<Pregunta[]> {
    await delay();
    return preguntas.filter((p) => p.teacherId === teacherId);
  },
  async obtenerPorCurso(teacherId: string, cursoId: string): Promise<Pregunta[]> {
    await delay();
    return preguntas.filter((p) => p.teacherId === teacherId && p.cursoId === cursoId);
  },
  async crear(teacherId: string, data: Omit<Pregunta, 'id' | 'teacherId'>): Promise<Pregunta> {
    await delay();
    const nueva: Pregunta = { ...data, teacherId, id: `pre-${Date.now()}` };
    preguntas.push(nueva);
    return nueva;
  },
  async actualizar(id: string, data: Partial<Pregunta>): Promise<Pregunta | undefined> {
    await delay();
    const idx = preguntas.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    preguntas[idx] = { ...preguntas[idx], ...data };
    return preguntas[idx];
  },
  async eliminar(id: string): Promise<boolean> {
    await delay();
    const idx = preguntas.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    preguntas.splice(idx, 1);
    return true;
  },
};

// ─── Inicio ───

export const inicioService = {
  async estadisticas(teacherId: string): Promise<EstadisticasInicio> {
    await delay();
    const teacherCursos = cursos.filter((c) => c.teacherId === teacherId && c.estado !== 'borrador');
    const teacherEstudiantes = estudiantes.filter((e) => e.teacherId === teacherId && e.estado === 'activo');
    const teacherPreguntas = preguntas.filter((p) => p.teacherId === teacherId && p.estado === 'activa');
    return { totalCursos: teacherCursos.length, totalEstudiantes: teacherEstudiantes.length, juegosActivos: juegos.filter((j) => j.estado === 'activo').length, totalPreguntas: teacherPreguntas.length };
  },
  async actividad(teacherId: string): Promise<Actividad[]> {
    await delay();
    return [...actividadReciente].filter((a) => a.teacherId === teacherId).sort((a, b) => b.fecha.localeCompare(a.fecha));
  },
};

// ─── Salas ───

export { salas };

const estudiantesSimulacion = [
  { id: 'sim-1', nombre: 'Carlos López' },
  { id: 'sim-2', nombre: 'María Pérez' },
  { id: 'sim-3', nombre: 'José Martínez' },
  { id: 'sim-4', nombre: 'Laura Rodríguez' },
  { id: 'sim-5', nombre: 'Pedro Sánchez' },
  { id: 'sim-6', nombre: 'Ana Martínez' },
];

function generarCodigoSalas(existentes: string[]): string {
  let codigo: string;
  do { codigo = Math.floor(100000 + Math.random() * 900000).toString(); } while (existentes.includes(codigo));
  return codigo;
}

interface SimulacionEstado { secuencia: boolean[]; respuestas: { correcta: boolean; puntosGanados: number; puntosPerdidos: number; distanciaLava: number }[]; distanciaLava: number; eliminado: boolean; preguntaActual: number; }
const simulacionEstados: Record<string, Record<string, SimulacionEstado>> = {};

function generarSecuencia(totalPreguntas: number, perfil: string): boolean[] {
  const secuencia: boolean[] = [];
  for (let i = 0; i < totalPreguntas; i++) {
    switch (perfil) {
      case 'bueno': secuencia.push(Math.random() < 0.85); break;
      case 'mixto': secuencia.push(Math.random() < 0.55); break;
      case 'malo': secuencia.push(Math.random() < 0.25); break;
      case 'instakill': secuencia.push(Math.random() < 0.15); break;
      case 'recuperacion': if (i < 3) secuencia.push(Math.random() < 0.3); else if (i < 6) secuencia.push(Math.random() < 0.6); else secuencia.push(Math.random() < 0.85); break;
      default: secuencia.push(Math.random() < 0.5);
    }
  }
  return secuencia;
}

function inicializarSimulacion(sala: Sala) {
  if (simulacionEstados[sala.id]) return;
  const esLava = sala.juegoId === 'juego-2';
  const perfiles = ['bueno', 'bueno', 'mixto', 'mixto', 'malo', 'recuperacion'];
  if (esLava) perfiles.push('instakill');
  const estados: Record<string, SimulacionEstado> = {};
  sala.participantes.forEach((p) => {
    const perfil = perfiles[Math.floor(Math.random() * perfiles.length)];
    estados[p.estudianteId] = { secuencia: generarSecuencia(sala.totalPreguntas, perfil), respuestas: [], distanciaLava: 5, eliminado: false, preguntaActual: 0 };
  });
  simulacionEstados[sala.id] = estados;
}

function calcularPuntos(correcta: boolean, modo: ModoJuego): { ganados: number; perdidos: number } {
  if (modo === 'lava') return correcta ? { ganados: 15, perdidos: 0 } : { ganados: 0, perdidos: 5 };
  return correcta ? { ganados: 10, perdidos: 0 } : { ganados: 0, perdidos: 5 };
}

function aplicarRespuesta(estado: SimulacionEstado, correcta: boolean, modo: ModoJuego): { distanciaLava: number; eliminado: boolean } {
  const puntos = calcularPuntos(correcta, modo);
  let distanciaLava = estado.distanciaLava;
  if (modo === 'lava') { distanciaLava = correcta ? Math.min(distanciaLava + 1, 5) : distanciaLava - 1; }
  estado.respuestas.push({ correcta, puntosGanados: puntos.ganados, puntosPerdidos: puntos.perdidos, distanciaLava });
  estado.distanciaLava = distanciaLava;
  if (modo === 'lava' && distanciaLava <= 0) { estado.eliminado = true; return { distanciaLava, eliminado: true }; }
  return { distanciaLava, eliminado: false };
}

export const salasService = {
  async obtenerTodas(teacherId: string): Promise<Sala[]> { await delay(); return salas.filter((s) => s.teacherId === teacherId); },
  async obtenerPorId(salaId: string): Promise<Sala | undefined> { await delay(); return salas.find((s) => s.id === salaId); },
  async crear(data: { teacherId: string; juegoId: string; cursoId: string; nombre: string; tiempoPorPregunta: number }): Promise<Sala> {
    await delay();
    const codigos = salas.map((s) => s.codigo);
    const codigo = generarCodigoSalas(codigos);
    const curso = cursos.find((c) => c.id === data.cursoId);
    const totalPreguntas = preguntas.filter((p) => p.teacherId === data.teacherId && p.juegoId === data.juegoId && p.cursoId === data.cursoId).length;
    const nuevaSala: Sala = { id: `sala-${Date.now()}`, teacherId: data.teacherId, juegoId: data.juegoId, cursoId: data.cursoId, nombre: data.nombre || `Sesión de ${curso?.nombre ?? 'Curso'}`, codigo, estado: 'esperando', tiempoPorPregunta: data.tiempoPorPregunta, totalPreguntas: totalPreguntas || 4, createdAt: new Date().toISOString(), startedAt: null, finishedAt: null, participantes: [] };
    salas.push(nuevaSala);
    return nuevaSala;
  },
  async iniciar(salaId: string): Promise<Sala | undefined> { await delay(); const sala = salas.find((s) => s.id === salaId); if (!sala) return undefined; sala.estado = 'en_curso'; sala.startedAt = new Date().toISOString(); inicializarSimulacion(sala); return sala; },
  async finalizar(salaId: string): Promise<Sala | undefined> { await delay(); const sala = salas.find((s) => s.id === salaId); if (!sala) return undefined; sala.estado = 'finalizada'; sala.finishedAt = new Date().toISOString(); sala.participantes.forEach((p) => { if (p.estado !== 'eliminado') p.estado = 'finalizado'; }); return sala; },
  async eliminar(salaId: string): Promise<boolean> { await delay(); const idx = salas.findIndex((s) => s.id === salaId); if (idx === -1) return false; salas.splice(idx, 1); return true; },
  async simularProgreso(salaId: string): Promise<Sala | undefined> {
    await delay();
    const sala = salas.find((s) => s.id === salaId);
    if (!sala || sala.estado !== 'en_curso') return undefined;
    inicializarSimulacion(sala);
    const esLava = sala.juegoId === 'juego-2';
    const modo: ModoJuego = esLava ? 'lava' : 'decisiones';
    const estados = simulacionEstados[sala.id];
    sala.participantes.forEach((p) => {
      if (p.estado === 'finalizado' || p.estado === 'eliminado') return;
      const estado = estados[p.estudianteId];
      if (!estado || estado.preguntaActual >= sala.totalPreguntas || estado.eliminado) { if (estado?.eliminado) p.estado = 'eliminado'; else if (estado && estado.preguntaActual >= sala.totalPreguntas) p.estado = 'finalizado'; return; }
      if (Math.random() > 0.35) return;
      const correcta = estado.secuencia[estado.preguntaActual];
      const resultado = aplicarRespuesta(estado, correcta, modo);
      estado.preguntaActual++;
      p.progreso = estado.preguntaActual;
      p.estado = 'jugando';
      if (correcta) p.correctas++; else p.incorrectas++;
      p.puntosNetos = estado.respuestas.reduce((acc, r) => acc + r.puntosGanados - r.puntosPerdidos, 0);
      p.distanciaLava = resultado.distanciaLava;
      if (resultado.eliminado) { p.estado = 'eliminado'; p.eliminadoEn = estado.preguntaActual; }
      else if (estado.preguntaActual >= sala.totalPreguntas) p.estado = 'finalizado';
    });
    const todosTerminaron = sala.participantes.every((p) => p.estado === 'finalizado' || p.estado === 'eliminado');
    if (todosTerminaron && sala.participantes.length > 0) { sala.estado = 'finalizada'; sala.finishedAt = new Date().toISOString(); }
    return sala;
  },
  async simularIngresoEstudiante(salaId: string): Promise<{ sala: Sala; estudiante: { id: string; nombre: string } } | undefined> {
    await delay();
    const sala = salas.find((s) => s.id === salaId);
    if (!sala || sala.estado !== 'esperando') return undefined;
    const idsEnSala = new Set(sala.participantes.map((p) => p.estudianteId));
    const disponibles = estudiantesSimulacion.filter((e) => !idsEnSala.has(e.id));
    if (disponibles.length === 0) return undefined;
    const estudiante = disponibles[Math.floor(Math.random() * disponibles.length)];
    const esLava = sala.juegoId === 'juego-2';
    sala.participantes.push({ estudianteId: estudiante.id, nombre: estudiante.nombre, progreso: 0, correctas: 0, incorrectas: 0, estado: 'esperando', puntosNetos: 0, distanciaLava: 5 });
    return { sala, estudiante };
  },
  async obtenerDetalleEstudianteSala(salaId: string, estudianteId: string): Promise<DetalleEstudianteSala | undefined> {
    await delay();
    const sala = salas.find((s) => s.id === salaId);
    if (!sala) return undefined;
    const participante = sala.participantes.find((p) => p.estudianteId === estudianteId);
    if (!participante) return undefined;
    const esLava = sala.juegoId === 'juego-2';
    const modo: ModoJuego = esLava ? 'lava' : 'decisiones';
    const preguntasSala = preguntas.filter((p) => p.teacherId === sala.teacherId && p.juegoId === sala.juegoId && p.cursoId === sala.cursoId);
    const totalQuestions = Math.min(preguntasSala.length, sala.totalPreguntas);
    const preguntasUsar = preguntasSala.slice(0, totalQuestions);
    const answers: RespuestaDetalleSala[] = [];
    let distanciaLavaActual = 5;
    let eliminado = false;
    for (let idx = 0; idx < totalQuestions; idx++) {
      const pregunta = preguntasUsar[idx];
      const maxTime = sala.tiempoPorPregunta;
      let esCorrecta: boolean;
      let status: 'correct' | 'incorrect' | 'timeout';
      let selectedAnswer: string | null;
      if (eliminado) { status = 'timeout'; selectedAnswer = null; esCorrecta = false; }
      else if (idx < participante.correctas) { esCorrecta = true; status = 'correct'; selectedAnswer = pregunta.respuestaCorrecta; }
      else if (idx < participante.correctas + participante.incorrectas) { esCorrecta = false; status = 'incorrect'; selectedAnswer = pregunta.opciones.filter((o) => o !== pregunta.respuestaCorrecta)[0] || 'Opción incorrecta'; }
      else { esCorrecta = false; status = 'timeout'; selectedAnswer = null; }
      const puntos = calcularPuntos(esCorrecta, modo);
      if (esLava && !eliminado) { distanciaLavaActual = esCorrecta ? Math.min(distanciaLavaActual + 1, 5) : distanciaLavaActual - 1; if (distanciaLavaActual <= 0) eliminado = true; }
      const responseTime = status === 'timeout' ? maxTime : status === 'correct' ? Math.floor(Math.random() * (maxTime * 0.7)) + 3 : Math.floor(Math.random() * (maxTime * 0.6)) + Math.floor(maxTime * 0.4);
      answers.push({ questionId: pregunta.id, questionText: pregunta.enunciado, selectedAnswer, correctAnswer: pregunta.respuestaCorrecta, status, responseTime, maxTime, puntosGanados: puntos.ganados, puntosPerdidos: puntos.perdidos, puntosNetos: puntos.ganados - puntos.perdidos, distanciaLava: distanciaLavaActual });
    }
    const correctAnswers = answers.filter((a) => a.status === 'correct').length;
    const incorrectAnswers = answers.filter((a) => a.status === 'incorrect').length;
    const timedOutAnswers = answers.filter((a) => a.status === 'timeout').length;
    const precision = answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0;
    const averageResponseTime = answers.length > 0 ? Math.round(answers.reduce((a, ans) => a + ans.responseTime, 0) / answers.length) : 0;
    return { estudianteId, nombre: participante.nombre, modoJuego: modo, estadoFinal: participante.estado === 'eliminado' ? 'eliminado' : 'completado', totalQuestions, preguntasRespondidas: answers.length, correctAnswers, incorrectAnswers, timedOutAnswers, precision, averageResponseTime, puntosGanados: answers.reduce((a, ans) => a + ans.puntosGanados, 0), puntosPerdidos: answers.reduce((a, ans) => a + ans.puntosPerdidos, 0), puntosNetos: answers.reduce((a, ans) => a + ans.puntosGanados, 0) - answers.reduce((a, ans) => a + ans.puntosPerdidos, 0), preguntaEliminacion: participante.eliminadoEn, answers };
  },
  async obtenerPreguntasDificiles(salaId: string): Promise<PreguntaDificil[]> {
    await delay();
    const sala = salas.find((s) => s.id === salaId);
    if (!sala || sala.participantes.length === 0) return [];
    const preguntasSala = preguntas.filter((p) => p.teacherId === sala.teacherId && p.juegoId === sala.juegoId && p.cursoId === sala.cursoId);
    const totalQuestions = Math.min(preguntasSala.length, sala.totalPreguntas);
    if (totalQuestions === 0) return [];
    const preguntasUsar = preguntasSala.slice(0, totalQuestions);
    const statsMap: Record<string, { correctas: number; incorrectas: number; total: number; opcionA: number; opcionB: number }> = {};
    preguntasUsar.forEach((pregunta) => { statsMap[pregunta.id] = { correctas: 0, incorrectas: 0, total: 0, opcionA: 0, opcionB: 0 }; });
    sala.participantes.forEach((participante) => {
      let correctCount = 0;
      preguntasUsar.forEach((pregunta, idx) => {
        const hash = Math.abs(((participante.estudianteId + sala.id + pregunta.id + String(idx)).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)));
        const esCorrecta = idx < (participante.correctas + participante.incorrectas) && correctCount < participante.correctas && (hash % 100) < 70;
        if (esCorrecta) { statsMap[pregunta.id].correctas++; correctCount++; }
        else if (idx < (participante.correctas + participante.incorrectas)) statsMap[pregunta.id].incorrectas++;
        statsMap[pregunta.id].total++;
        if (hash % 2 === 0) statsMap[pregunta.id].opcionA++; else statsMap[pregunta.id].opcionB++;
      });
    });
    return preguntasUsar.map((pregunta, idx) => {
      const s = statsMap[pregunta.id];
      const totalOpciones = s.opcionA + s.opcionB;
      return { preguntaId: pregunta.id, posicion: idx + 1, enunciado: pregunta.enunciado, porcentajeCorrectas: s.total > 0 ? Math.round((s.correctas / s.total) * 100) : 0, correctas: s.correctas, incorrectas: s.incorrectas, totalRespuestas: s.total, opciones: pregunta.opciones.map((texto, oi) => ({ texto, cantidad: oi === 0 ? s.opcionA : s.opcionB, porcentaje: totalOpciones > 0 ? Math.round(((oi === 0 ? s.opcionA : s.opcionB) / totalOpciones) * 100) : 0 })) };
    }).sort((a, b) => a.porcentajeCorrectas - b.porcentajeCorrectas);
  },
};

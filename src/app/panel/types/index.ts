export type EstadoCurso = 'activo' | 'inactivo' | 'borrador';
export type EstadoEstudiante = 'activo' | 'inactivo' | 'suspendido';
export type EstadoJuego = 'activo' | 'inactivo';
export type RolUsuario = 'docente' | 'admin';
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

export interface Docente {
  id: string;
  nombre: string;
  correo: string;
  contrasena: string;
  institucion: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaRegistro: string;
  ultimaActividad: string;
}

export interface Curso {
  id: string;
  teacherId: string;
  nombre: string;
  descripcion: string;
  estado: EstadoCurso;
  fechaCreacion: string;
  gameModeId: string;
}

export interface CursoEstudiante {
  cursoId: string;
  estudianteId: string;
  progreso: number;
}

export interface Estudiante {
  id: string;
  teacherId: string;
  courseId?: string;
  nombre: string;
  correo: string;
  estado: EstadoEstudiante;
  fechaRegistro: string;
  ultimoAcceso: string;
  nivel: number;
  puntos: number;
}

export interface JuegoConfig {
  tiempoLimite: number;
  cantidadNiveles: number;
  cantidadRondas: number;
}

export interface Juego {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  color: string;
  estado: EstadoJuego;
  config: JuegoConfig;
}

export interface Pregunta {
  id: string;
  teacherId: string;
  juegoId: string;
  cursoId: string;
  enunciado: string;
  opciones: [string, string];
  respuestaCorrecta: string;
  estado: 'activa' | 'inactiva';
}

export interface Resultado {
  id: string;
  teacherId: string;
  estudianteId: string;
  juegoId: string;
  cursoId: string;
  puntaje: number;
  correctas: number;
  incorrectas: number;
  fecha: string;
  posicion: number;
}

export interface Actividad {
  id: string;
  teacherId?: string;
  tipo: 'partida' | 'completado' | 'puntaje' | 'registro' | 'acceso' | 'curso_creado' | 'curso_actualizado' | 'curso_copiado' | 'pregunta_creada' | 'pregunta_modificada' | 'sala_finalizada' | 'sala_creada';
  estudianteNombre?: string;
  descripcion: string;
  fecha: string;
  salaNombre?: string;
  juegoNombre?: string;
  cursoNombre?: string;
}

export interface Alerta {
  id: string;
  teacherId?: string;
  tipo: 'sin_actividad' | 'preguntas_pendientes' | 'bajo_rendimiento' | 'info';
  mensaje: string;
}

export interface EstadisticasInicio {
  totalCursos: number;
  totalEstudiantes: number;
  juegosActivos: number;
  totalPreguntas: number;
}

export interface RespuestaEstudiante {
  id: string;
  teacherId: string;
  estudianteId: string;
  cursoId: string;
  juegoId: string;
  preguntaId: string;
  respuestaSeleccionada: string;
  respuestaCorrecta: string;
  esCorrecta: boolean;
  fecha: string;
}

export type EstadoSala = 'esperando' | 'en_curso' | 'finalizada';
export type EstadoParticipante = 'esperando' | 'jugando' | 'finalizado' | 'eliminado';
export type ModoJuego = 'decisiones' | 'lava';

export interface RespuestaDetalleSala {
  questionId: string;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  status: 'correct' | 'incorrect' | 'timeout';
  responseTime: number;
  maxTime: number;
  puntosGanados: number;
  puntosPerdidos: number;
  puntosNetos: number;
  distanciaLava?: number;
}

export interface DetalleEstudianteSala {
  estudianteId: string;
  nombre: string;
  modoJuego: ModoJuego;
  estadoFinal: 'completado' | 'eliminado';
  totalQuestions: number;
  preguntasRespondidas: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timedOutAnswers: number;
  precision: number;
  averageResponseTime: number;
  puntosGanados: number;
  puntosPerdidos: number;
  puntosNetos: number;
  preguntaEliminacion?: number;
  answers: RespuestaDetalleSala[];
}

export interface ParticipanteSala {
  estudianteId: string;
  nombre: string;
  avatar?: string;
  progreso: number;
  correctas: number;
  incorrectas: number;
  estado: EstadoParticipante;
  puntosNetos: number;
  distanciaLava: number;
  eliminadoEn?: number;
}

export interface Sala {
  id: string;
  teacherId: string;
  juegoId: string;
  cursoId: string;
  nombre: string;
  codigo: string;
  estado: EstadoSala;
  tiempoPorPregunta: number;
  totalPreguntas: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  participantes: ParticipanteSala[];
}

export interface OpcionEstadistica {
  texto: string;
  cantidad: number;
  porcentaje: number;
}

export interface PreguntaDificil {
  preguntaId: string;
  posicion: number;
  enunciado: string;
  porcentajeCorrectas: number;
  correctas: number;
  incorrectas: number;
  totalRespuestas: number;
  opciones: OpcionEstadistica[];
}

export interface ResumenSala {
  totalEstudiantes: number;
  completados: number;
  eliminados: number;
  puntosPromedio: number;
  totalPuntosGanados: number;
  totalPuntosPerdidos: number;
  porcentajeCorrectasGlobal: number;
  porcentajeIncorrectasGlobal: number;
  eliminadosLava?: number;
  preguntaPromedioEliminacion?: number;
  maxPuntuacion?: string;
  maxAvanceEliminado?: string;
}

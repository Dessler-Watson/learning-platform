import { Sala, ParticipanteSala } from '../types';

const participantesSimulados: Record<string, ParticipanteSala[]> = {
  'sala-002': [
    { estudianteId: 'est-11', nombre: 'Andrés Vega', avatar_id: 2, estrellas: 700, progreso: 9, correctas: 7, incorrectas: 2, estado: 'jugando', puntosNetos: 60, distanciaLava: 3 },
    { estudianteId: 'est-14', nombre: 'Isabella Cruz', avatar_id: 6, estrellas: 15200, progreso: 12, correctas: 11, incorrectas: 1, estado: 'finalizado', puntosNetos: 105, distanciaLava: 3 },
    { estudianteId: 'est-19', nombre: 'Nicolás Aguilar', avatar_id: 2, estrellas: 13500, progreso: 6, correctas: 4, incorrectas: 2, estado: 'jugando', puntosNetos: 30, distanciaLava: 2 },
    { estudianteId: 'est-1', nombre: 'Carlos López', avatar_id: 2, estrellas: 1800, progreso: 4, correctas: 3, incorrectas: 1, estado: 'jugando', puntosNetos: 25, distanciaLava: 2 },
    { estudianteId: 'est-6', nombre: 'Ana Martínez', avatar_id: 6, estrellas: 9800, progreso: 10, correctas: 9, incorrectas: 1, estado: 'jugando', puntosNetos: 85, distanciaLava: 3 },
  ],
  'sala-003': [
    { estudianteId: 'est-5', nombre: 'Pedro Sánchez', avatar_id: 5, estrellas: 300, progreso: 5, correctas: 3, incorrectas: 2, estado: 'jugando', puntosNetos: 35, distanciaLava: 2 },
    { estudianteId: 'est-13', nombre: 'Fernando Morales', avatar_id: 1, estrellas: 400, progreso: 3, correctas: 1, incorrectas: 2, estado: 'jugando', puntosNetos: 5, distanciaLava: 1 },
    { estudianteId: 'est-16', nombre: 'Gabriela Navarro', avatar_id: 7, estrellas: 6000, progreso: 7, correctas: 5, incorrectas: 2, estado: 'jugando', puntosNetos: 65, distanciaLava: 3 },
  ],
  'sala-004': [
    { estudianteId: 'est-1', nombre: 'Carlos López', avatar_id: 2, estrellas: 1800, progreso: 4, correctas: 4, incorrectas: 0, estado: 'finalizado', puntosNetos: 40, distanciaLava: 3 },
    { estudianteId: 'est-2', nombre: 'María Pérez', avatar_id: 4, estrellas: 5400, progreso: 4, correctas: 3, incorrectas: 1, estado: 'finalizado', puntosNetos: 25, distanciaLava: 2 },
    { estudianteId: 'est-3', nombre: 'José Martínez', avatar_id: 1, estrellas: 50, progreso: 4, correctas: 2, incorrectas: 2, estado: 'finalizado', puntosNetos: 10, distanciaLava: 2 },
    { estudianteId: 'est-6', nombre: 'Ana Martínez', avatar_id: 6, estrellas: 9800, progreso: 4, correctas: 4, incorrectas: 0, estado: 'finalizado', puntosNetos: 40, distanciaLava: 3 },
    { estudianteId: 'est-7', nombre: 'Luis Hernández', avatar_id: 7, estrellas: 150, progreso: 4, correctas: 3, incorrectas: 1, estado: 'finalizado', puntosNetos: 25, distanciaLava: 2 },
    { estudianteId: 'est-10', nombre: 'Valentina Torres', avatar_id: 3, estrellas: 2800, progreso: 4, correctas: 4, incorrectas: 0, estado: 'finalizado', puntosNetos: 40, distanciaLava: 3 },
  ],
};

export const salas: Sala[] = [
  {
    id: 'sala-001', teacherId: 'teacher-001', juegoId: 'juego-1', cursoId: 'cur-cd-8a',
    nombre: 'Repaso de Derechos Humanos', codigo: '482731', estado: 'esperando',
    tiempoPorPregunta: 30, totalPreguntas: 4, createdAt: '2026-08-10T10:00:00',
    startedAt: null, finishedAt: null, participantes: [],
  },
  {
    id: 'sala-002', teacherId: 'teacher-001', juegoId: 'juego-1', cursoId: 'cur-cd-10a',
    nombre: 'Simulacro Ciudadanía', codigo: '719456', estado: 'en_curso',
    tiempoPorPregunta: 20, totalPreguntas: 12, createdAt: '2026-08-10T09:00:00',
    startedAt: '2026-08-10T09:02:00', finishedAt: null,
    participantes: participantesSimulados['sala-002'],
  },
  {
    id: 'sala-003', teacherId: 'teacher-001', juegoId: 'juego-2', cursoId: 'cur-lc-7a',
    nombre: 'Práctica Prevención de Violencia', codigo: '538210', estado: 'en_curso',
    tiempoPorPregunta: 30, totalPreguntas: 12, createdAt: '2026-08-09T14:00:00',
    startedAt: '2026-08-09T14:03:00', finishedAt: null,
    participantes: participantesSimulados['sala-003'],
  },
  {
    id: 'sala-004', teacherId: 'teacher-001', juegoId: 'juego-1', cursoId: 'cur-cd-8b',
    nombre: 'Evaluación Igualdad de Género', codigo: '625083', estado: 'finalizada',
    tiempoPorPregunta: 30, totalPreguntas: 4, createdAt: '2026-08-08T11:00:00',
    startedAt: '2026-08-08T11:02:00', finishedAt: '2026-08-08T11:25:00',
    participantes: participantesSimulados['sala-004'],
  },
];

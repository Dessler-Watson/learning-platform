import { Actividad, Alerta } from '../types';

export const actividadReciente: Actividad[] = [
  { id: 'act-1', teacherId: 'teacher-001', tipo: 'sala_creada', descripcion: 'Sala "Simulacro Ciudadanía" creada', fecha: '2026-08-10T09:00:00', salaNombre: 'Simulacro Ciudadanía', juegoNombre: 'Camino de Decisiones', cursoNombre: '10° A — Preparatoria' },
  { id: 'act-2', teacherId: 'teacher-001', tipo: 'sala_creada', descripcion: 'Sala "Repaso de Derechos Humanos" creada', fecha: '2026-08-10T10:00:00', salaNombre: 'Repaso de Derechos Humanos', juegoNombre: 'Camino de Decisiones', cursoNombre: '8° A — Secundaria' },
  { id: 'act-3', teacherId: 'teacher-001', tipo: 'sala_creada', descripcion: 'Sala "Práctica Prevención de Violencia" creada', fecha: '2026-08-09T14:00:00', salaNombre: 'Práctica Prevención de Violencia', juegoNombre: 'La Lava del Conocimiento', cursoNombre: '7° A — Secundaria' },
  { id: 'act-4', teacherId: 'teacher-001', tipo: 'sala_creada', descripcion: 'Sala "Evaluación Igualdad de Género" creada', fecha: '2026-08-08T11:00:00', salaNombre: 'Evaluación Igualdad de Género', juegoNombre: 'Camino de Decisiones', cursoNombre: '8° B — Secundaria' },
  { id: 'act-5', teacherId: 'teacher-002', tipo: 'sala_creada', descripcion: 'Sala creada', fecha: '2026-08-09T10:00:00', salaNombre: 'Sesión de 10° A', juegoNombre: 'Camino de Decisiones', cursoNombre: '10° A — Preparatoria' },
];

export const alertas: Alerta[] = [
  { id: 'alert-1', teacherId: 'teacher-001', tipo: 'info', mensaje: 'Tienes 4 salas activas o recientes. Revisa el estado de cada una.' },
  { id: 'alert-2', teacherId: 'teacher-001', tipo: 'preguntas_pendientes', mensaje: 'El curso "7° A — Secundaria" tiene solo 3 preguntas. Considera agregar más.' },
];

import {
  Curso,
  CursoEstudiante,
  Pregunta,
  Estudiante,
  Juego,
  Actividad,
  EstadisticasInicio,
  Docente,
} from '../types';
import { Sala, ParticipanteSala, DetalleEstudianteSala, PreguntaDificil, ModoJuego, RespuestaDetalleSala } from '../types';
import { MODE_THEME, GameModeId } from '@/shared/lib/game-modes';

export const MAX_PREGUNTAS_POR_CURSO = 30;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return (await res.json()) as T;
}

// ─── Cursos ───

export interface CursoConDetalles extends Curso {
  totalEstudiantes: number;
  promedio: number;
  progreso: number;
  totalPreguntas: number;
}

type ApiCurso = Curso & { totalEstudiantes?: number; promedio?: number; progreso?: number; totalPreguntas?: number };

function withDetalles(c: ApiCurso): CursoConDetalles {
  return {
    ...c,
    totalEstudiantes: c.totalEstudiantes ?? 0,
    promedio: c.promedio ?? 0,
    progreso: c.progreso ?? 0,
    totalPreguntas: c.totalPreguntas ?? 0,
  };
}

export const cursosService = {
  async obtenerTodos(_teacherId: string): Promise<Curso[]> {
    const data = await api<{ cursos: ApiCurso[] }>('/api/panel/cursos');
    return data.cursos.map((c) => ({ ...c }));
  },
  async obtenerPorGameMode(_teacherId: string, gameModeId: string): Promise<CursoConDetalles[]> {
    const data = await api<{ cursos: ApiCurso[] }>('/api/panel/cursos');
    return data.cursos.filter((c) => c.gameModeId === gameModeId).map(withDetalles);
  },
  async obtenerPorId(id: string): Promise<Curso | undefined> {
    try {
      const data = await api<{ curso: ApiCurso }>(`/api/panel/cursos?id=${encodeURIComponent(id)}`);
      return data.curso;
    } catch {
      return undefined;
    }
  },
  async crear(
    teacherId: string,
    data: Omit<Curso, 'id' | 'fechaCreacion' | 'teacherId'>
  ): Promise<Curso> {
    const res = await api<{ ok: boolean; curso: ApiCurso }>('/api/panel/cursos', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!res.curso) throw new Error('No se pudo crear el curso');
    return { ...res.curso, teacherId };
  },
  async actualizar(id: string, data: Partial<Curso>): Promise<Curso | undefined> {
    try {
      const res = await api<{ ok: boolean; curso: ApiCurso }>('/api/panel/cursos', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', id, ...data }),
      });
      return res.curso;
    } catch {
      return undefined;
    }
  },
  async eliminar(id: string): Promise<boolean> {
    try {
      await api('/api/panel/cursos', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
      return true;
    } catch {
      return false;
    }
  },
  async copiarCurso(cursoId: string): Promise<{ curso: Curso; preguntas: Pregunta[] } | undefined> {
    try {
      const res = await api<{ curso: Curso; preguntas: Pregunta[] }>('/api/panel/cursos', {
        method: 'POST',
        body: JSON.stringify({ action: 'copy', id: cursoId }),
      });
      return res;
    } catch {
      return undefined;
    }
  },
  async pegarCurso(
    teacherId: string,
    gameModeId: string,
    datos: { curso: Curso; preguntas: Pregunta[] },
    nombrePersonalizado?: string
  ): Promise<Curso> {
    const res = await api<{ ok: boolean; curso: Curso }>('/api/panel/cursos', {
      method: 'POST',
      body: JSON.stringify({
        action: 'paste',
        curso: datos.curso,
        preguntas: datos.preguntas,
        gameModeId,
        nombrePersonalizado,
      }),
    });
    if (!res.curso) throw new Error('No se pudo pegar el curso');
    return { ...res.curso, teacherId };
  },
  async existeCursoConNombre(teacherId: string, gameModeId: string, nombre: string): Promise<boolean> {
    try {
      const res = await api<{ existe: boolean }>('/api/panel/cursos', {
        method: 'POST',
        body: JSON.stringify({ action: 'exists', nombre, gameModeId }),
      });
      return res.existe;
    } catch {
      return false;
    }
  },
};

// ─── Juegos ───

export interface JuegoConDetalles extends Juego {
  totalPreguntas: number;
  preguntasActivas: number;
}

const JUEGOS_BASE: Juego[] = (Object.values(MODE_THEME) as Array<{ id: GameModeId; label: string; color: string }>).map((m, i) => ({
  id: m.id,
  nombre: m.label,
  descripcion:
    m.id === 'decisiones'
      ? 'Avanza por un camino celestial eligiendo entre dos puertas. Responde correctamente para seguir avanzando.'
      : m.id === 'lava'
        ? 'Sobrevive al ascenso de la lava respondiendo preguntas. Cada acierto te eleva, cada error hace subir la lava.'
        : m.id === 'tierras'
          ? 'Salta entre plataformas en un manglar. Responde correctamente para avanzar, pero cuidado: una mala elección te hunde.'
          : 'Construye un puente y cruza entre montañas. Responde correctamente para ganar plataformas, pero ten cuidado: si caes al abismo, pierdes todo.',
  emoji: '',
  color: m.color,
  estado: 'activo',
  config: { cantidadNiveles: m.id === 'decisiones' ? 10 : 1, cantidadRondas: m.id === 'decisiones' ? 1 : m.id === 'lava' ? 8 : 15 },
  sort: i,
})) as Juego[];

export const juegosService = {
  async obtenerTodos(teacherId: string): Promise<JuegoConDetalles[]> {
    try {
      const [cursosRes, preguntasRes] = await Promise.all([
        api<{ cursos: ApiCurso[] }>('/api/panel/cursos'),
        api<{ preguntas: Pregunta[] }>('/api/panel/preguntas'),
      ]);
      const teacherCursos = cursosRes.cursos.filter((c) => c.teacherId === teacherId);
      const teacherPreguntas = preguntasRes.preguntas.filter((p) => p.teacherId === teacherId);
      return JUEGOS_BASE.map((juego) => {
        const delJuego = teacherPreguntas.filter((p) => p.juegoId === juego.id);
        const cursoIds = new Set(teacherCursos.filter((c) => c.gameModeId === juego.id).map((c) => c.id));
        const inMode = delJuego.filter((p) => cursoIds.has(p.cursoId));
        return {
          ...juego,
          totalPreguntas: inMode.length,
          preguntasActivas: inMode.filter((p) => p.estado === 'activa').length,
        };
      });
    } catch {
      return JUEGOS_BASE.map((j) => ({ ...j, totalPreguntas: 0, preguntasActivas: 0 }));
    }
  },
  async obtenerPorId(id: string): Promise<JuegoConDetalles | undefined> {
    const all = await juegosService.obtenerTodos('');
    return all.find((j) => j.id === id);
  },
};

// ─── Preguntas ───

export const preguntasService = {
  async obtenerTodas(_teacherId: string): Promise<Pregunta[]> {
    const data = await api<{ preguntas: Pregunta[] }>('/api/panel/preguntas');
    return data.preguntas;
  },
  async obtenerPorCurso(_teacherId: string, cursoId: string): Promise<Pregunta[]> {
    const data = await api<{ preguntas: Pregunta[] }>(`/api/panel/preguntas?curso_id=${encodeURIComponent(cursoId)}`);
    return data.preguntas;
  },
  async crear(teacherId: string, data: Omit<Pregunta, 'id' | 'teacherId'>): Promise<Pregunta> {
    const res = await api<{ ok: boolean; pregunta: Pregunta }>('/api/panel/preguntas', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', ...data }),
    });
    if (!res.pregunta) throw new Error('No se pudo crear la pregunta');
    return { ...res.pregunta, teacherId };
  },
  async actualizar(id: string, data: Partial<Pregunta>): Promise<Pregunta | undefined> {
    try {
      const res = await api<{ ok: boolean; pregunta: Pregunta }>('/api/panel/preguntas', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', id, ...data }),
      });
      return res.pregunta;
    } catch {
      return undefined;
    }
  },
  async eliminar(id: string): Promise<boolean> {
    try {
      await api('/api/panel/preguntas', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
      return true;
    } catch {
      return false;
    }
  },
};

// ─── Inicio ───

export const inicioService = {
  async estadisticas(_teacherId: string): Promise<EstadisticasInicio> {
    const data = await api<{ estadisticas: EstadisticasInicio }>('/api/panel/inicio');
    return data.estadisticas;
  },
  async actividad(_teacherId: string): Promise<Actividad[]> {
    const data = await api<{ actividades: Actividad[] }>('/api/panel/inicio');
    return data.actividades;
  },
};

// ─── Salas ───

export const salasService = {
  async obtenerTodas(_teacherId: string): Promise<Sala[]> {
    const data = await api<{ salas: Sala[] }>('/api/panel/salas');
    return data.salas;
  },
  async obtenerPorId(salaId: string): Promise<Sala | undefined> {
    try {
      const data = await api<{ sala: Sala }>(`/api/panel/salas?id=${encodeURIComponent(salaId)}`);
      return data.sala;
    } catch {
      return undefined;
    }
  },
  async crear(data: {
    teacherId: string;
    juegoId: string;
    cursoId: string;
    nombre: string;
  }): Promise<Sala> {
    const res = await api<{ ok: boolean; sala: Sala }>('/api/panel/salas', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        cursoId: data.cursoId,
        juegoId: data.juegoId,
        nombre: data.nombre,
      }),
    });
    if (!res.sala) throw new Error('No se pudo crear la sala');
    return res.sala;
  },
  async iniciar(salaId: string): Promise<Sala | undefined> {
    try {
      const res = await api<{ ok: boolean; sala: Sala }>('/api/panel/salas', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', id: salaId }),
      });
      return res.sala;
    } catch {
      return undefined;
    }
  },
  async finalizar(salaId: string): Promise<Sala | undefined> {
    try {
      const res = await api<{ ok: boolean; sala: Sala }>('/api/panel/salas', {
        method: 'POST',
        body: JSON.stringify({ action: 'finish', id: salaId }),
      });
      return res.sala;
    } catch {
      return undefined;
    }
  },
  async eliminar(salaId: string): Promise<boolean> {
    try {
      await api('/api/panel/salas', { method: 'POST', body: JSON.stringify({ action: 'delete', id: salaId }) });
      return true;
    } catch {
      return false;
    }
  },
  async refrescar(salaId: string): Promise<Sala | undefined> {
    try {
      const res = await api<{ sala: Sala }>('/api/panel/salas', {
        method: 'POST',
        body: JSON.stringify({ action: 'poll', id: salaId }),
      });
      return res.sala;
    } catch {
      return undefined;
    }
  },
  async obtenerDetalleEstudianteSala(salaId: string, estudianteId: string): Promise<DetalleEstudianteSala | undefined> {
    try {
      const res = await api<{ detalle: DetalleEstudianteSala }>('/api/panel/salas', {
        method: 'POST',
        body: JSON.stringify({ action: 'student_detail', id: salaId, estudianteId }),
      });
      return res.detalle;
    } catch {
      return undefined;
    }
  },
  async obtenerPreguntasDificiles(salaId: string): Promise<PreguntaDificil[]> {
    try {
      const res = await api<{ preguntasDificiles: PreguntaDificil[] }>('/api/panel/salas', {
        method: 'POST',
        body: JSON.stringify({ action: 'hard_questions', id: salaId }),
      });
      return res.preguntasDificiles;
    } catch {
      return [];
    }
  },
};

// ─── Docentes (admin) ───

export const docentesService = {
  async obtenerTodos(): Promise<{ docentes: Docente[]; instituciones: string[] }> {
    return api<{ docentes: Docente[]; instituciones: string[] }>('/api/panel/docentes');
  },
  async existe(correo: string): Promise<boolean> {
    const res = await api<{ existe: boolean }>('/api/panel/docentes', {
      method: 'POST',
      body: JSON.stringify({ action: 'exists', correo }),
    });
    return res.existe;
  },
  async actualizar(
    id: string,
    data: { nombre?: string; correo?: string; institucion?: string; contrasena?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await api('/api/panel/docentes', { method: 'POST', body: JSON.stringify({ action: 'update', id, ...data }) });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Error al actualizar' };
    }
  },
  async eliminar(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api('/api/panel/docentes', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Error al eliminar' };
    }
  },
};

/** Kept for type-only imports in older pages; simulation removed. */
export type { ModoJuego, RespuestaDetalleSala, ParticipanteSala, CursoEstudiante, Estudiante };
export type { Docente };

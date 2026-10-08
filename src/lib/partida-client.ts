'use client';
import type { GameQuestion } from '@/games/decision-road/types';
import type { ChaosSurpriseEffect } from '@/lib/chaos/sorpresa';
import { useSurvivalStore } from '@/stores/survival.store';

export function getMatchRoomId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('sala');
  } catch {
    return null;
  }
}

/* Fin de sala confirmado por el servidor (useRoomFinished). Una vez seteado,
 * no se envían más respuestas a /api/partida. Vive en el módulo: cada partida
 * arranca con una carga completa de página, así que no cruza partidas. */
let roomFinishedDetected = false;

export function markRoomFinished(): void {
  roomFinishedDetected = true;
}

export function isRoomFinished(): boolean {
  return roomFinishedDetected;
}

/** ¿La partida actual es una sala real gestionada por el docente? */
export function isMatchRoom(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('eduplay_practice')) return false;
  } catch { /* ignore */ }
  return getMatchRoomId() !== null;
}

export interface MatchOptionDTO {
  id: string;
  text: string;
}

export interface MatchQuestionDTO {
  position: number;
  id: string;
  prompt: string;
  explanation: string;
  difficulty: string;
  correct_option_id?: string | null;
  /** 'pregunta_sorpresa': efecto determinista de ESTA pregunta según el
   * servidor (null = 'normal'). Solo presente con el modificador activo;
   * solo lectura: el cliente no lo envía nunca al responder. */
  sorpresa?: ChaosSurpriseEffect | null;
  options: MatchOptionDTO[];
}

export interface MatchStateDTO {
  partida: {
    id: string;
    room_id: string;
    status: string;
    question_count: number;
    modo: string;
    /** Modificadores de la partida (Caos). Sala docente: []. Solo lectura:
     * el servidor sigue siendo la autoridad en puntuación. */
    modificadores: string[];
    /** 'tiempo_compartido' (Grupo 2): ms restantes del presupuesto global
     * (now() del servidor). Solo presente con el modificador activo. */
    tiempo?: { restar_ms: number };
  };
  yo: {
    score: number;
    xp: number;
    estado: string;
    /** Grupo 3 (supervivencia): solo con el modificador correspondiente activo. */
    vidas?: number;
    racha?: number;
    errores?: number;
    critico?: boolean;
    respondidas: { question_id: string; position: number; is_correct: boolean | null; timed_out: boolean; points_delta: number }[];
  };
  preguntas: MatchQuestionDTO[];
}

function mapDifficulty(d: string): 'basic' | 'intermediate' | 'advanced' {
  if (d === 'dificil') return 'advanced';
  if (d === 'media') return 'intermediate';
  return 'basic';
}

export function toStoreQuestion(q: MatchQuestionDTO): GameQuestion {
  // La opción correcta viene en el boot para que el cliente pueda calcular el
  // resultado de forma inmediata; el servidor sigue siendo la autoridad en el
  // POST /api/partida (se reconcilia en segundo plano).
  let correctAnswer: 'A' | 'B' = 'A';
  if (q.correct_option_id && q.options[1]?.id === q.correct_option_id) correctAnswer = 'B';
  return {
    id: q.id,
    statement: q.prompt,
    optionA: q.options[0]?.text ?? '',
    optionB: q.options[1]?.text ?? '',
    correctAnswer,
    explanation: q.explanation ?? '',
    difficulty: mapDifficulty(q.difficulty),
    optionIds: [q.options[0]?.id ?? '', q.options[1]?.id ?? ''],
    sorpresa: q.sorpresa ?? null,
  };
}

export async function fetchMatchState(roomId: string): Promise<MatchStateDTO> {
  const res = await fetch(`/api/partida?room_id=${encodeURIComponent(roomId)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'No se pudo cargar la partida');
  ingestMatchClock(data as MatchStateDTO);
  // Grupo 3 (supervivencia): vidas/racha/errores/crítico del boot → HUD.
  useSurvivalStore.getState().ingestState(data as MatchStateDTO);
  return data as MatchStateDTO;
}

/* ------------------------------------------------------------------ */
/*  'tiempo_compartido' (Grupo 2): reloj global compartido de la sala    */
/* ------------------------------------------------------------------ */

let chaosClockMs: number | null = null;
let chaosClockAt = 0;

/** Fija el presupuesto global restante (ms); null lo limpia. */
export function setChaosClock(ms: number | null): void {
  chaosClockMs = ms == null ? null : Math.max(0, ms);
  chaosClockAt = Date.now();
}

/**
 * Actualiza el reloj global desde un estado servido que lleve
 * `partida.tiempo.restar_ms` (GET /api/partida). Ausencia del campo = la
 * partida no tiene 'tiempo_compartido' → limpia el reloj.
 */
export function ingestMatchClock(state: { partida?: { tiempo?: { restar_ms?: number } } } | null | undefined): void {
  const ms = state?.partida?.tiempo?.restar_ms;
  setChaosClock(typeof ms === 'number' && Number.isFinite(ms) ? ms : null);
}

/**
 * Ms restantes del presupuesto global: decrece localmente a partir del
 * último ingest (el pintado usa el reloj del navegador; la autoridad sigue
 * siendo el servidor: GET /api/salas finaliza la sala al agotarse). null =
 * sin 'tiempo_compartido'.
 */
export function getChaosClockRemaining(): number | null {
  if (chaosClockMs == null) return null;
  return Math.max(0, chaosClockMs - (Date.now() - chaosClockAt));
}

/* ------------------------------------------------------------------ */
/*  RESULTADOS REALES (Paso 5) — servidor, no mocks                    */
/* ------------------------------------------------------------------ */

export interface MatchResultDTO {
  sala: { id: string; codigo: string; nombre: string; modo: string };
  partida: {
    id: string;
    status: string;
    total_preguntas: number;
    started_at: string | null;
    finished_at: string | null;
    duracion_ms: number;
  };
  yo: {
    user_id: string;
    nombre: string;
    score: number;
    xp: number;
    estado: string;
    eliminado_en: number | null;
    estrellas_partida: number;
    correctas: number;
    incorrectas: number;
    timeouts: number;
    sin_responder: number;
    porcentaje: number;
    posicion: number;
    total_jugadores: number;
    promedio_respuesta_ms: number | null;
  };
  respuestas: {
    posicion: number;
    pregunta: string;
    elegida: string | null;
    correcta: string | null;
    is_correct: boolean | null;
    timed_out: boolean;
    puntos: number;
    tiempo_ms: number | null;
  }[];
  ranking: {
    posicion: number;
    user_id: string;
    nombre: string;
    avatar_id: number | null;
    avatar: string | null;
    score: number;
    estado: string;
  }[];
}

export async function fetchMatchResult(roomId: string): Promise<MatchResultDTO> {
  const res = await fetch(`/api/partida/resultados?room_id=${encodeURIComponent(roomId)}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar los resultados');
  return data as MatchResultDTO;
}

/** Ruta de salida tras terminar una partida (práctica / sala real / local). */
export function postGameRoute(): string {
  if (typeof window === 'undefined') return '/inicio';
  try {
    if (sessionStorage.getItem('eduplay_practice')) return '/practica/resultados';
  } catch { /* ignore */ }
  const sala = getMatchRoomId();
  if (sala) return `/resultados?sala=${encodeURIComponent(sala)}`;
  return '/inicio';
}

export interface MatchAnswerResult {
  correct: boolean;
  correct_option_id: string | null;
  points_delta: number;
  score: number;
  xp: number;
  question_position: number;
  eliminated: boolean;
  timed_out: boolean;
  status: string;
  state: { ticks?: number; platforms?: number } | null;
  /** Grupo 3 (supervivencia): solo con el modificador correspondiente activo. */
  vidas?: number;
  racha?: number;
  errores?: number;
  critico?: boolean;
}

function normalize(data: Record<string, unknown>): MatchAnswerResult {
  const st = (data.state ?? null) as { ticks?: number; platforms?: number } | null;
  return {
    correct: data.correct === true,
    correct_option_id: typeof data.correct_option_id === 'string' ? data.correct_option_id : null,
    points_delta: Number(data.points_delta ?? 0),
    score: Number(data.score ?? 0),
    xp: Number(data.xp ?? 0),
    question_position: Number(data.question_position ?? -1),
    eliminated: data.eliminated === true,
    timed_out: data.timed_out === true,
    status: String(data.status ?? ''),
    state: st,
    ...(typeof data.vidas === 'number' ? { vidas: data.vidas } : {}),
    ...(typeof data.racha === 'number' ? { racha: data.racha } : {}),
    ...(typeof data.errores === 'number' ? { errores: data.errores } : {}),
    ...(typeof data.critico === 'boolean' ? { critico: data.critico } : {}),
  };
}

export async function submitMatchAnswer(opts: {
  roomId: string;
  questionId: string;
  optionId?: string;
  timedOut?: boolean;
  responseTimeMs?: number;
}): Promise<MatchAnswerResult | null> {
  const payload = {
    action: 'answer',
    room_id: opts.roomId,
    question_id: opts.questionId,
    option_id: opts.optionId ?? null,
    timed_out: opts.timedOut === true,
    response_time_ms: opts.responseTimeMs ?? 0,
  };

  // Sala finalizada: el backend rechazaría con 409; no se envía nada.
  if (roomFinishedDetected) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const out = normalize(data);
        useSurvivalStore.getState().ingestAnswer(out);
        return out;
      }
      if (res.status === 409 && data?.code === 'duplicate') {
        // Resync: el servidor ya registró la respuesta; devuelve el estado real.
        const out = normalize(data);
        useSurvivalStore.getState().ingestAnswer(out);
        return out;
      }
      // Errores de estado (finalizada/eliminado/no participante): no reintentar.
      if (res.status === 409 || res.status === 403 || res.status === 404) return null;
      if (attempt === 0) continue;
      return null;
    } catch {
      if (attempt === 0) continue;
      return null;
    }
  }
  return null;
}

/**
 * 'contrarreloj': aviso de que una pregunta SE MUESTRA ahora (el reloj lo
 * marca el SERVIDOR con su propio now(); nunca se envía la hora del cliente).
 * Fire-and-forget con 1 reintento: si no llega, el plazo se deriva del ancla
 * (respuesta previa / boot) sin romper la partida.
 */
export async function notifyQuestionStarted(questionId: string): Promise<void> {
  const roomId = getMatchRoomId();
  if (!roomId || !questionId) return;
  if (roomFinishedDetected) return;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'question_started',
          room_id: roomId,
          question_id: questionId,
        }),
      });
      if (res.ok) return;
      // Errores de estado (finalizada/no participante): no reintentar.
      if (res.status === 409 || res.status === 403 || res.status === 404) return;
      if (attempt === 0) continue;
      return;
    } catch {
      if (attempt === 0) continue;
      return;
    }
  }
}

/**
 * Reporta una muerte SIN respuesta al servidor (p.ej. caída al agua en
 * tierras-hundidas por salto fallido, caída al costado o caída al vacío en
 * entre-abismos). Fire-and-forget: el servidor solo actualiza si el
 * participante sigue 'playing', por lo que es seguro llamarlo también cuando
 * la eliminación ya vino de una respuesta incorrecta (idempotente).
 *
 * `forfeitStars` (entre-abismos): el participante pierde TODAS las estrellas
 * de liga ganadas en la partida al caer al vacío.
 */
export async function reportMatchElimination(opts?: { forfeitStars?: boolean }): Promise<boolean> {
  const roomId = getMatchRoomId();
  if (!roomId) return false;
  if (roomFinishedDetected) return false;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'eliminate',
          room_id: roomId,
          ...(opts?.forfeitStars ? { forfeit_stars: true } : {}),
        }),
      });
      if (res.ok) return true;
      // Errores de estado (finalizada/no participante): no reintentar.
      if (res.status === 409 || res.status === 403 || res.status === 404) return false;
      if (attempt === 0) continue;
      return false;
    } catch {
      if (attempt === 0) continue;
      return false;
    }
  }
  return false;
}

/**
 * Reconciliación optimista: corrige la corrección de la respuesta ya registrada
 * si el servidor no coincide. Devuelve la MISMA referencia si no hay cambio.
 */
export function replaceLastAnswer<T extends { questionId: string; correct: boolean }>(
  answers: T[],
  questionId: string,
  correct: boolean
): T[] {
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].questionId === questionId) {
      if (answers[i].correct === correct) return answers;
      const next = answers.slice();
      next[i] = { ...next[i], correct };
      return next;
    }
  }
  return answers;
}

/** Racha actual = respuestas correctas consecutivas al final del historial. */
export function trailingStreak(answers: ReadonlyArray<{ correct: boolean }>): number {
  let n = 0;
  for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) n++;
  return n;
}

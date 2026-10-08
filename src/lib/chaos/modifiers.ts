import { randomInt } from 'crypto';

/**
 * Modo Caos — ETAPA 2.
 *
 * Define los modificadores válidos de Caos y el sorteo que se ejecuta UNA
 * sola vez al crear la sala (createChaosRoom). Los modificadores viajan
 * chaos_rooms.modifiers → matches.modifiers → GET /api/partida y cada juego
 * aplica sus efectos SOLO si el id está en esa lista.
 *
 * IDs (ETAPA 2):
 * - Grupo 1 (Paso 1-4 + Grupo 1 de efectos): doble_puntos, barajado,
 *   ritmo_expres, pantalla_al_reves, ceguera, controles_invertidos,
 *   mouse_invertido, velocidad_extrema, movimiento_pesado, super_salto,
 *   salto_reducido, respuestas_mezcladas, opciones_numeradas.
 * - Grupo 2 (preguntas con reloj/estado): contrarreloj, pregunta_fugaz,
 *   memoria, tiempo_compartido, pregunta_sorpresa.
 * - Grupo 3 (supervivencia): instakill, vida_limitada, racha_obligatoria,
 *   error_acumulativo, ultima_oportunidad.
 *
 * No existe un segundo sistema: normalizeChaosModifiers sigue filtrando
 * exactamente contra esta lista y drawChaosModifiers sortea 1..2 de aquí.
 */

export const CHAOS_MODIFIER_IDS = [
  'doble_puntos',
  'barajado',
  'ritmo_expres',
  'pantalla_al_reves',
  'ceguera',
  'controles_invertidos',
  'mouse_invertido',
  'velocidad_extrema',
  'movimiento_pesado',
  'super_salto',
  'salto_reducido',
  'respuestas_mezcladas',
  'opciones_numeradas',
  'contrarreloj',
  'pregunta_fugaz',
  'memoria',
  'tiempo_compartido',
  'pregunta_sorpresa',
  'instakill',
  'vida_limitada',
  'racha_obligatoria',
  'error_acumulativo',
  'ultima_oportunidad',
] as const;
export type ChaosModifierId = (typeof CHAOS_MODIFIER_IDS)[number];

/** Pool de sorteo: IDs únicos. */
export const CHAOS_MODIFIER_POOL: readonly ChaosModifierId[] = CHAOS_MODIFIER_IDS;

export function isChaosModifierId(raw: unknown): raw is ChaosModifierId {
  return typeof raw === 'string' && (CHAOS_MODIFIER_IDS as readonly string[]).includes(raw);
}

/**
 * Normaliza una lista leída de BD: conserva solo IDs válidos y elimina
 * duplicados preservando el orden. Cualquier contenido inesperado en el
 * JSONB (no-array, IDs desconocidos) degrada a lista filtrada o [].
 */
export function normalizeChaosModifiers(raw: unknown): ChaosModifierId[] {
  if (!Array.isArray(raw)) return [];
  const out: ChaosModifierId[] = [];
  for (const item of raw) {
    if (isChaosModifierId(item) && !out.includes(item)) out.push(item);
  }
  return out;
}

/**
 * Sorteo seguro con crypto.randomInt: 1 o 2 IDs únicos del pool, en orden
 * de sorteo. Devuelve un array de strings JSON-serializable.
 */
export function drawChaosModifiers(): ChaosModifierId[] {
  const count = randomInt(1, Math.min(2, CHAOS_MODIFIER_POOL.length) + 1); // 1..2
  const pool = [...CHAOS_MODIFIER_POOL];
  const picked: ChaosModifierId[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = randomInt(pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

/**
 * ETAPA 2 — Paso 4: modificador 'ritmo_expres' (solo cliente).
 *
 * Devuelve la duración efectiva de una pausa/feedback YA EXISTENTE del juego:
 * - con 'ritmo_expres' en los modificadores de la partida: base × 0.6
 *   (redondeo entero, siempre > 0);
 * - sin el modificador (salas docentes y Caos sin ritmo): la base intacta.
 *
 * Solo se aplica sobre duraciones que ya existen en cada juego; no crea
 * timers nuevos ni sistemas globales. La lista `modifiers` llega por
 * GET /api/partida (partida.modificadores) ya cargada en el store del juego:
 * aquí no hay fetch ni acceso a BD.
 */
export function getChaosTiming(
  baseDuration: number,
  modifiers?: readonly string[] | null
): number {
  const fast = Array.isArray(modifiers) && modifiers.includes('ritmo_expres');
  if (!fast || !(baseDuration > 0)) return baseDuration;
  return Math.max(1, Math.round(baseDuration * 0.6));
}

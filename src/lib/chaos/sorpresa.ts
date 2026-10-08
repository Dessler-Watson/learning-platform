/**
 * ETAPA 2 — Grupo 2: 'pregunta_sorpresa'.
 *
 * Cuando el modificador está activo en matches.modifiers, CADA pregunta
 * recibe un efecto adicional DETERMINISTA (o ninguno/'normal'), calculado a
 * partir de sha256(matchId:questionId) en el servidor. Módulo compartido
 * (cliente y servidor) solo con el POOL y el tipo: el cálculo del hash vive
 * en el servidor (src/lib/db/matches.ts) para que el cliente no pueda
 * forzar el resultado.
 *
 * Reglas (spec):
 * - el pool es SOLO de comportamientos compatibles con una pregunta;
 * - la selección es determinista por match.id + question.id, igual para
 *   todos los jugadores y estable entre GET/renders (sin Math.random());
 * - no modifica matches.modifiers.
 */

/** ID del modificador (solo en matches.modifiers). */
export const SORPRESA_MODIFIER = 'pregunta_sorpresa';

/** Pool de sorpresa: efectos reutilizados de modificadores ya existentes. */
export const SORPRESA_POOL = [
  'respuestas_mezcladas',
  'opciones_numeradas',
  'pregunta_fugaz',
  'memoria',
] as const;

export type ChaosSurpriseEffect = (typeof SORPRESA_POOL)[number];

/** ¿Es un efecto del pool? (validación defensiva al leer la BD/DTO). */
export function isSurpriseEffect(v: unknown): v is ChaosSurpriseEffect {
  return typeof v === 'string' && (SORPRESA_POOL as readonly string[]).includes(v);
}

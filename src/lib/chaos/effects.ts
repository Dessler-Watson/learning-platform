/**
 * ETAPA 2 — Grupo 1: helpers puros de EFECTOS de los modificadores de Caos
 * (solo cliente, salvo donde se indique).
 *
 * Cada helper recibe la lista `modifiers` tal como llega de
 * matches.modifiers vía GET /api/partida (ya cargada en el store del juego).
 * Con la lista vacía o ausente (salas docentes, práctica, Caos sin ese
 * modificador) TODOS los helpers devuelven el factor identidad: el código
 * existente se comporta exactamente igual que antes.
 *
 * Reglas del grupo:
 * - velocidad: multiplica la VELOCIDAD BASE existente (nunca la reemplaza);
 *   no toca gravedad, animaciones ambientales ni físicas permanentes.
 * - salto: multiplica el impulso vertical existente (nunca la gravedad).
 * - etiquetas: solo cambian cómo se MUESTRA la opción; el option_id, la
 *   validación del servidor y la selección interna 'A'/'B' no cambian.
 * - 'pregunta_sorpresa': los helpers aceptan el `effect` determinista de la
 *   pregunta actual (del servidor, vía DTO) como fuente ALTERNATIVA del
 *   mismo efecto, sin modificar la lista de modificadores de la partida.
 */

import type { ChaosSurpriseEffect } from '@/lib/chaos/sorpresa';

/** ¿Está el modificador presente en la lista de la partida? */
export function hasChaosModifier(
  modifiers: readonly string[] | null | undefined,
  id: string
): boolean {
  return Array.isArray(modifiers) && modifiers.includes(id);
}

/**
 * Multiplicador de velocidad del jugador.
 * velocidad_extrema → ×2, movimiento_pesado → ×0.5 (se acumulan si coexisten).
 */
export function getChaosMoveMultiplier(modifiers?: readonly string[] | null): number {
  if (!Array.isArray(modifiers)) return 1;
  let m = 1;
  if (modifiers.includes('velocidad_extrema')) m *= 2;
  if (modifiers.includes('movimiento_pesado')) m *= 0.5;
  return m;
}

/**
 * Multiplicador del impulso de salto (fuerza vertical existente).
 * super_salto → ×1.75, salto_reducido → ×0.5 (se acumulan si coexisten).
 */
export function getChaosJumpMultiplier(modifiers?: readonly string[] | null): number {
  if (!Array.isArray(modifiers)) return 1;
  let m = 1;
  if (modifiers.includes('super_salto')) m *= 1.75;
  if (modifiers.includes('salto_reducido')) m *= 0.5;
  return m;
}

/**
 * Etiqueta visual de una opción según su posición visual.
 * Normal: 'A' / 'B'. Con 'opciones_numeradas': '[1]' / '[2]'.
 * La posición 1 corresponde siempre a la primera opción visual (que con
 * 'respuestas_mezcladas' puede ser cualquier option_id).
 */
export function getChaosOptionLabel(
  modifiers: readonly string[] | null | undefined,
  side: 'A' | 'B',
  effect?: ChaosSurpriseEffect | null
): string {
  if (!hasChaosModifier(modifiers, 'opciones_numeradas') && effect !== 'opciones_numeradas') return side;
  return side === 'A' ? '[1]' : '[2]';
}

/**
 * ms hasta ocultar el ENUNCIADO (5 s) o null si no se oculta.
 * 'memoria'/'pregunta_fugaz' por modificador de la partida o como efecto
 * determinista de ESTA pregunta ('pregunta_sorpresa'). Solo visual; no
 * corta la respuesta.
 */
export function getChaosHidePromptMs(
  modifiers: readonly string[] | null | undefined,
  effect?: ChaosSurpriseEffect | null
): number | null {
  if (hasChaosModifier(modifiers, 'memoria') || hasChaosModifier(modifiers, 'pregunta_fugaz')) return 5_000;
  return effect === 'memoria' || effect === 'pregunta_fugaz' ? 5_000 : null;
}

/**
 * ms hasta ocultar las OPCIONES (5 s) o null si no se ocultan.
 * Solo 'memoria' (por modificador o como efecto sorpresa de la pregunta).
 */
export function getChaosHideOptionsMs(
  modifiers: readonly string[] | null | undefined,
  effect?: ChaosSurpriseEffect | null
): number | null {
  if (hasChaosModifier(modifiers, 'memoria')) return 5_000;
  return effect === 'memoria' ? 5_000 : null;
}

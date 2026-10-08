/* ------------------------------------------------------------------ */
/*  MODIFICADORES DE SUPERVIVENCIA (ETAPA 2, Grupo 3)                  */
/*  — servidor autoritativo, helpers puros sin I/O                     */
/* ------------------------------------------------------------------ */

/** IDs del Grupo 3 (los5 "finales" de Caos). */
export const INSTAKILL_MODIFIER = 'instakill';
export const VIDA_LIMITADA_MODIFIER = 'vida_limitada';
export const RACHA_OBLIGATORIA_MODIFIER = 'racha_obligatoria';
export const ERROR_ACUMULATIVO_MODIFIER = 'error_acumulativo';
export const ULTIMA_OPORTUNIDAD_MODIFIER = 'ultima_oportunidad';

export const SURVIVAL_MODIFIER_IDS = [
  INSTAKILL_MODIFIER,
  VIDA_LIMITADA_MODIFIER,
  RACHA_OBLIGATORIA_MODIFIER,
  ERROR_ACUMULATIVO_MODIFIER,
  ULTIMA_OPORTUNIDAD_MODIFIER,
] as const;

/** Vidas iniciales con 'vida_limitada' (capa EXTRA: no toca los recursos del modo). */
export const MAX_LIVES = 3;
/** Tope del multiplicador de 'racha_obligatoria' (×1..×4). */
export const MAX_RACHA_MULT = 4;
/** Tope del multiplicador de 'error_acumulativo' (×1..×4). */
export const MAX_ERROR_MULT = 4;

export function hasSurvivalModifier(modifiers: unknown): boolean {
  const mods = Array.isArray(modifiers) ? modifiers : [];
  return SURVIVAL_MODIFIER_IDS.some((m) => mods.includes(m));
}

export function hasModifier(modifiers: unknown, id: string): boolean {
  const mods = Array.isArray(modifiers) ? modifiers : [];
  return mods.includes(id);
}

/** Racha actual = correctas consecutivas al FINAL del historial. */
export function trailingStreakFlags(flags: ReadonlyArray<boolean>): number {
  let n = 0;
  for (let i = flags.length - 1; i >= 0 && flags[i]; i--) n++;
  return n;
}

/** Errores consecutivos al FINAL del historial (0 si la última fue correcta). */
export function trailingErrorsFlags(flags: ReadonlyArray<boolean>): number {
  let n = 0;
  for (let i = flags.length - 1; i >= 0 && !flags[i]; i--) n++;
  return n;
}

/** Multiplicador de 'racha_obligatoria' según la racha DESPUÉS del acierto. */
export function rachaMultiplier(streak: number): number {
  return Math.min(Math.max(1, streak), MAX_RACHA_MULT);
}

/** Multiplicador de 'error_acumulativo' según errores consecutivos del fallo. */
export function errorMultiplier(consecutiveErrors: number): number {
  return Math.min(Math.max(1, consecutiveErrors), MAX_ERROR_MULT);
}

export interface SurvivalState {
  /** Racha DESPUÉS de esta respuesta (0 tras un fallo). */
  racha: number;
  /** Errores consecutivos DESPUÉS de esta respuesta (0 tras un acierto). */
  errores: number;
  /** Total de errores incluyendo esta (base de vidas/última oportunidad). */
  totalErrores: number;
  /** Vidas restantes con 'vida_limitada' (MAX_LIVES - totalErrores, ≥0). */
  vidas: number;
  /** 'ultima_oportunidad': ya tuvo al menos1 error (banner de peligro). */
  critico: boolean;
  /** 'ultima_oportunidad' protege el PRIMER error de cualquier muerte. */
  shield: boolean;
  /** Muerte impuesta por los modificadores de Grupo 3 en ESTA respuesta. */
  death: boolean;
}

/**
 * Estado de supervivencia que resulta de aplicar esta respuesta al historial
 * previo (`prevFlags` = is_correct de las respuestas ANTES de insertar esta).
 *
 * - instakill: cualquier fallo mata (si no hay escudo de ultima_oportunidad).
 * - vida_limitada: el tercer fallo agota las3 vidas.
 * - ultima_oportunidad: el primer error de la partida NUNCA mata (escudo que
 *   además suprime la muerte del modo); el segundo error mata.
 * - racha_obligatoria / error_acumulativo: solo afectan a los puntos
 *   (multiplicadores), nunca a la eliminación.
 */
export function computeSurvival(
  modifiers: unknown,
  prevFlags: ReadonlyArray<boolean>,
  isCorrect: boolean
): SurvivalState {
  const totalErroresPrev = prevFlags.reduce((n, ok) => (ok ? n : n + 1), 0);
  const totalErrores = totalErroresPrev + (isCorrect ? 0 : 1);
  const racha = isCorrect ? trailingStreakFlags(prevFlags) + 1 : 0;
  const errores = isCorrect ? 0 : trailingErrorsFlags(prevFlags) + 1;
  const mods = Array.isArray(modifiers) ? modifiers : [];

  const ultima = mods.includes(ULTIMA_OPORTUNIDAD_MODIFIER);
  const shield = !isCorrect && ultima && totalErroresPrev === 0;

  let death = false;
  if (!isCorrect) {
    if (mods.includes(INSTAKILL_MODIFIER)) death = true;
    else if (mods.includes(VIDA_LIMITADA_MODIFIER) && totalErrores >= MAX_LIVES) death = true;
    else if (ultima && totalErroresPrev >= 1) death = true;
  }

  return {
    racha,
    errores,
    totalErrores,
    vidas: Math.max(0, MAX_LIVES - totalErrores),
    critico: ultima && totalErrores >= 1,
    shield,
    death,
  };
}

/**
 * Muerte de Grupo 3 determinista calculada SOLO con el estado local
 * (modificadores + errores acumulados del cliente). Espejo exacto de
 * computeSurvival para que los juegos reaccionen a la eliminación sin
 * depender de la latencia de la respuesta del servidor.
 */
export function localSurvivalDeath(
  modifiers: unknown,
  totalErrors: number,
  lastAnswerCorrect: boolean
): boolean {
  const mods = Array.isArray(modifiers) ? modifiers : [];
  if (!hasSurvivalModifier(mods)) return false;
  if (lastAnswerCorrect || totalErrors <= 0) return false;
  if (mods.includes(ULTIMA_OPORTUNIDAD_MODIFIER) && totalErrors === 1) return false; // escudo
  if (mods.includes(INSTAKILL_MODIFIER)) return true;
  if (mods.includes(VIDA_LIMITADA_MODIFIER) && totalErrors >= MAX_LIVES) return true;
  if (mods.includes(ULTIMA_OPORTUNIDAD_MODIFIER) && totalErrors >= 2) return true;
  return false;
}

/** El escudo de 'ultima_oportunidad' protege este primer error (totalErrors incluye el actual). */
export function localSurvivalShielded(modifiers: unknown, totalErrors: number): boolean {
  const mods = Array.isArray(modifiers) ? modifiers : [];
  return mods.includes(ULTIMA_OPORTUNIDAD_MODIFIER) && totalErrors === 1;
}

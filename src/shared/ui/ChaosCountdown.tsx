'use client';

/**
 * Contador visible de 'contrarreloj' (⏱ 10 → 0). Se monta junto al badge de
 * "Pregunta x/y" de cada HUD. `data-chaos-countdown` es el ancla de tests.
 */
export function ChaosCountdown({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft == null) return null;
  return (
    <span
      data-chaos-countdown
      style={{ marginLeft: 8, fontVariantNumeric: 'tabular-nums', color: '#ffd166' }}
    >
      {`⏱ ${secondsLeft}`}
    </span>
  );
}

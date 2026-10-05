'use client';

import { useMemo, type CSSProperties } from 'react';

/**
 * AmbientMotes — capa decorativa de motas flotantes para las 4 partidas.
 *
 * Solo visual: `pointer-events: none` (no toca hitboxes) y no modifica
 * texturas, animaciones ni mecánicas del mundo 3D. Cada modo la instancia
 * con su propia paleta (ascuas, esporas, nieve, chispas de luz).
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEYFRAMES = `
@keyframes eduplayMoteUp {
  0% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
  15% { opacity: 1; }
  50% { transform: translate3d(calc(var(--mote-dx, 0px) * 0.5), -52vh, 0) scale(1); }
  85% { opacity: 1; }
  100% { transform: translate3d(var(--mote-dx, 0px), -108vh, 0) scale(0.8); opacity: 0; }
}
@keyframes eduplayMoteDown {
  0% { transform: translate3d(0, 0, 0) scale(0.7); opacity: 0; }
  15% { opacity: 1; }
  50% { transform: translate3d(calc(var(--mote-dx, 0px) * 0.5), 52vh, 0) scale(1); }
  85% { opacity: 1; }
  100% { transform: translate3d(var(--mote-dx, 0px), 108vh, 0) scale(0.9); opacity: 0; }
}`;

interface AmbientMotesProps {
  count?: number;
  /** Colores rgba con alfa propio (el alfa controla la sutileza). */
  colors: readonly string[];
  minSize?: number;
  maxSize?: number;
  minDur?: number;
  maxDur?: number;
  direction?: 'up' | 'down';
  /** box-shadow opcional (ej. brillo de ascuas). */
  glow?: string;
  zIndex?: number;
  seed?: number;
}

export function AmbientMotes({
  count = 12,
  colors,
  minSize = 3,
  maxSize = 6,
  minDur = 9,
  maxDur = 18,
  direction = 'up',
  glow,
  zIndex = 3,
  seed = 7,
}: AmbientMotesProps) {
  const motes = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const size = Math.round((minSize + rnd() * (maxSize - minSize)) * 10) / 10;
      return {
        i,
        left: Math.round(rnd() * 1000) / 10,
        size,
        dur: Math.round((minDur + rnd() * (maxDur - minDur)) * 10) / 10,
        delay: Math.round(-rnd() * 300) / 10,
        dx: Math.round((rnd() - 0.5) * 140),
        color: colors[Math.floor(rnd() * colors.length)] ?? colors[0],
      };
    });
  }, [count, colors, minSize, maxSize, minDur, maxDur, seed]);

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{ position: 'absolute', inset: 0, zIndex, overflow: 'hidden' }}
    >
      <style>{KEYFRAMES}</style>
      {motes.map((m) => (
        <span
          key={m.i}
          style={
            {
              position: 'absolute',
              left: `${m.left}%`,
              [direction === 'up' ? 'bottom' : 'top']: -10,
              width: m.size,
              height: m.size,
              borderRadius: '50%',
              background: m.color,
              boxShadow: glow ? `0 0 ${Math.max(4, Math.round(m.size * 2))}px ${glow}` : undefined,
              opacity: 0,
              '--mote-dx': `${m.dx}px`,
              animation: `${direction === 'up' ? 'eduplayMoteUp' : 'eduplayMoteDown'} ${m.dur}s linear ${m.delay}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

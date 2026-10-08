'use client';
import { useEffect, useState } from 'react';
import { getChaosClockRemaining, getMatchRoomId } from '@/lib/partida-client';

/**
 * Contador del presupuesto global de 'tiempo_compartido' (Grupo 2): mm:ss
 * decreciente a partir del último ingest (fetchMatchState y la relectura de
 * GET /api/salas en useRoomFinished). Sin 'tiempo_compartido' no se pinta
 * nada. La autoridad es el servidor: al llegar a 0 se fuerza una lectura de
 * GET /api/salas (expireTimedSharedRoom → finalizeMatch → SSE room:finished)
 * y el pintado solo usa el reloj del navegador. `data-chaos-global-timer` es
 * el ancla de tests.
 */
export function ChaosGlobalTimer() {
  const [ms, setMs] = useState<number | null>(() => getChaosClockRemaining());

  useEffect(() => {
    setMs(getChaosClockRemaining());
    const roomId = getMatchRoomId();
    let fired = false;
    const t = window.setInterval(() => {
      const v = getChaosClockRemaining();
      setMs(v);
      if (v != null && v <= 0 && !fired && roomId) {
        fired = true;
        void fetch(`/api/salas?id=${encodeURIComponent(roomId)}&join=0`, { cache: 'no-store' }).catch(() => {});
      }
    }, 500);
    return () => window.clearInterval(t);
  }, []);

  if (ms == null) return null;
  const totalSec = Math.ceil(ms / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return (
    <span
      data-chaos-global-timer
      aria-label="Tiempo restante de la partida"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(8px)',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.5,
        color: totalSec <= 30 ? '#ff6b6b' : '#ffd166',
        textShadow: '0 1px 6px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
      }}
    >
      {`⏱ ${mm}:${String(ss).padStart(2, '0')}`}
    </span>
  );
}

'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { avatarUrl } from '@/lib/avatares';
import { fetchMatchResult, getMatchRoomId } from '@/lib/partida-client';
import { useRoomEvents } from '@/shared/hooks/useRoomEvents';

interface Competitor {
  id: string;
  name: string;
  avatar: string;
  score: number;
  prevScore: number;
  trend: 'up' | 'down' | 'same';
}

interface FloatingRankingProps {
  /** Puntaje local en vivo de "Tu" (store del modo). */
  score: number;
  /** Mostrar u ocultar la ventana (fases de juego de cada modo). */
  visible: boolean;
  /** Anclaje: arriba-izquierda (hueco libre) o arriba-derecha bajo el boton de menu. */
  slot?: 'top-left' | 'top-right';
  /** Desplazamiento vertical explicito (para esquivar la carta de pregunta). */
  top?: number;
}

/**
 * Ajuste de layout calculado contra la carta de pregunta ([data-qcard]):
 * si la columna horizontal del panel choca con la carta, el panel baja
 * debajo de ella y, si el espacio vertical no alcanza, muestra menos filas
 * o se oculta. La cabecera (POSICIONES) nunca se oculta.
 */
interface LayoutAdj {
  top?: number;
  maxRows: number;
  hidden: boolean;
}
const FULL_LAYOUT: LayoutAdj = { maxRows: Infinity, hidden: false };
const sameAdj = (a: LayoutAdj, b: LayoutAdj) =>
  a.top === b.top && a.maxRows === b.maxRows && a.hidden === b.hidden;

/** Hueco vertical de respeto bajo la carta y bajo el borde inferior. */
const GAP = 6;

/**
 * Ventana flotante de POSICIONES en partida (mismo diseno que la de Rumbo).
 * `pointer-events: none` para nunca bloquear botones/respuestas del modo.
 */
export function FloatingRanking({ score, visible, slot = 'top-left', top }: FloatingRankingProps) {
  const isMobile = useIsMobile();
  const isPractice = typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false;
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const roomIdRef = useRef<string | null>(null);
  if (roomIdRef.current === null && typeof window !== 'undefined') {
    roomIdRef.current = getMatchRoomId();
  }

  const mostrar = !isPractice && visible;

  // --- Evitar solapes con la carta de pregunta (mediciones en el cliente) ---
  const rootRef = useRef<HTMLDivElement>(null);
  const [adj, setAdj] = useState<LayoutAdj>(FULL_LAYOUT);
  const adjRef = useRef<LayoutAdj>(FULL_LAYOUT);
  const applyAdj = (next: LayoutAdj) => {
    if (!sameAdj(adjRef.current, next)) {
      adjRef.current = next;
      setAdj(next);
    }
  };
  // Metricas del panel a tamano completo (solo se refrescan cuando se renderiza
  // completo): el ancho cacheado evita oscilar al truncar filas (el contenido
  // mas corto estrecha el panel y "esconderia" el solape).
  const cacheRef = useRef<{ fullH: number; fullW: number; listH: number; n: number } | null>(null);
  const enDerechaSlot = slot === 'top-right';

  useLayoutEffect(() => {
    if (!mostrar) return;
    const isFull = (a: LayoutAdj) => !a.hidden && a.maxRows === Infinity;

    const refreshCache = () => {
      const self = rootRef.current;
      if (!self) return;
      const list = self.querySelector<HTMLElement>('[data-fr-list]');
      const s = self.getBoundingClientRect();
      const listH = list ? list.getBoundingClientRect().height : 0;
      cacheRef.current = {
        fullH: s.height,
        fullW: s.width,
        listH,
        n: list ? list.children.length : 0,
      };
    };

    const compute = () => {
      const self = rootRef.current;
      if (!self) return;
      const estabaFull = isFull(adjRef.current);
      if (estabaFull) refreshCache();
      const anchor = document.querySelector<HTMLElement>('[data-qcard]');
      if (!anchor) {
        applyAdj(FULL_LAYOUT);
        return;
      }
      const a = anchor.getBoundingClientRect();
      const s = self.getBoundingClientRect();
      // Ancho del panel en su estado completo (si ya esta compactado, el
      // renderizado actual seria mas angosto y el juicio, incorrecto).
      const w = estabaFull ? s.width : cacheRef.current?.fullW ?? s.width;
      const right = isMobile ? 8 : 16;
      const leftOff = isMobile ? 8 : 16;
      const panelLeft = enDerechaSlot ? window.innerWidth - right - w : leftOff;
      const panelRight = enDerechaSlot ? window.innerWidth - right : leftOff + w;
      // Umbral identico al del test: solape horizontal real (> 2px).
      const overlapX = Math.min(panelRight, a.right) - Math.max(panelLeft, a.left) > 2;
      if (!overlapX) {
        applyAdj(FULL_LAYOUT);
        return;
      }

      const desiredTop = a.bottom + GAP;
      const budget = window.innerHeight - GAP - desiredTop;
      const c = cacheRef.current;
      const fullH = c?.fullH ?? s.height;
      if (budget <= 0) {
        applyAdj({ top: desiredTop, maxRows: 0, hidden: true });
        return;
      }
      if (budget >= fullH) {
        applyAdj({ top: desiredTop, maxRows: Infinity, hidden: false });
        return;
      }
      if (c && c.n > 0 && c.listH > 0) {
        const base = fullH - c.listH; // padding + cabecera + huecos
        const rowH = c.listH / c.n;
        if (budget < base + rowH) {
          applyAdj({ top: desiredTop, maxRows: 0, hidden: true });
          return;
        }
        const maxRows = Math.max(1, Math.min(c.n, Math.floor((budget - base) / rowH)));
        applyAdj({ top: desiredTop, maxRows, hidden: false });
        return;
      }
      applyAdj({ top: desiredTop, maxRows: 1, hidden: false });
    };

    // Estado completo para (re)medir el panel, y recalcular tras el pintado.
    adjRef.current = FULL_LAYOUT;
    setAdj(FULL_LAYOUT);
    let raf = requestAnimationFrame(() => requestAnimationFrame(compute));
    const iv = window.setInterval(compute, 400);
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(iv);
      window.removeEventListener('resize', compute);
    };
  }, [mostrar, slot, isMobile, competitors.length]);

  const cargarRef = useRef<(() => void) | null>(null);

  // SSE: refresca el ranking al instante tras cada respuesta de cualquier jugador.
  const realtimeConnected = useRoomEvents(roomIdRef.current, () => {
    cargarRef.current?.();
  });

  useEffect(() => {
    if (!mostrar) return;
    const roomId = roomIdRef.current;
    if (!roomId) return;
    let cancelado = false;
    const cargar = async () => {
      try {
        const res = await fetchMatchResult(roomId);
        if (cancelado) return;
        const yo = res.yo.user_id;
        setCompetitors((prev) =>
          res.ranking
            .filter((r) => r.user_id !== yo)
            .map((r) => {
              const anterior = prev.find((c) => c.id === r.user_id);
              const nuevo = r.score;
              const viejo = anterior?.score ?? nuevo;
              return {
                id: r.user_id,
                name: r.nombre,
                avatar: avatarUrl(r.avatar_id ?? 1),
                score: nuevo,
                prevScore: viejo,
                trend: (nuevo > viejo ? 'up' : nuevo < viejo ? 'down' : 'same') as Competitor['trend'],
              };
            })
        );
      } catch {
        /* sin conexion: se conserva el ultimo ranking conocido */
      }
    };
    cargarRef.current = cargar;
    cargar();
    const period = realtimeConnected ? 8000 : 2500;
    const interval = setInterval(cargar, period);
    return () => {
      cancelado = true;
      cargarRef.current = null;
      clearInterval(interval);
    };
  }, [mostrar, realtimeConnected]);

  const playerEntry = {
    id: 'player',
    name: 'Tu',
    avatar: avatarUrl(1),
    score,
    prevScore: 0,
    trend: 'same' as const,
    isPlayer: true,
  };

  const allPlayers = [...competitors, playerEntry].sort((a, b) => b.score - a.score);

  if (!mostrar) return null;
  if (adj.hidden) return null;

  const enDerecha = slot === 'top-right';

  // Filas visibles al compactar: siempre las mejores y "Tu" (realIdx conserva
  // la posicion real en el orden completo).
  let shownPlayers = allPlayers;
  if (adj.maxRows !== Infinity && allPlayers.length > adj.maxRows) {
    shownPlayers = allPlayers.slice(0, adj.maxRows);
    if (!shownPlayers.includes(playerEntry)) {
      shownPlayers = [...shownPlayers.slice(0, Math.max(0, adj.maxRows - 1)), playerEntry];
    }
  }

  return (
    <motion.div
      ref={rootRef}
      initial={{ x: enDerecha ? 100 : -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      style={{
        position: 'fixed',
        ...(enDerecha
          ? { top: adj.top ?? top ?? 64, right: isMobile ? 8 : 16 }
          : { top: adj.top ?? top ?? (isMobile ? 8 : 16), left: isMobile ? 8 : 16 }),
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(25,38,60,0.88) 0%, rgba(36,59,85,0.82) 100%)',
        borderRadius: isMobile ? 16 : 22,
        padding: isMobile ? '10px 12px' : '14px 16px',
        minWidth: isMobile ? 140 : 185,
        maxWidth: isMobile ? 170 : 215,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header */}
        <div data-fr-header style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8,
          marginBottom: isMobile ? 8 : 12, paddingBottom: isMobile ? 6 : 10,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <svg width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD54F" />
          </svg>
          <span style={{
            color: '#FFD54F', fontSize: isMobile ? 10 : 12, fontWeight: 900,
            fontFamily: 'var(--font-baloo)', letterSpacing: 0.8,
            textShadow: '0 0 10px rgba(255,213,79,0.3)',
          }}>
            POSICIONES
          </span>
        </div>

        {/* Player list */}
        <div data-fr-list style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 3 : 5 }}>
          <AnimatePresence mode="popLayout">
            {shownPlayers.map((p) => {
              const isPlayer = 'isPlayer' in p && p.isPlayer;
              const realIdx = allPlayers.indexOf(p);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8,
                    padding: isMobile ? '4px 6px' : '5px 8px',
                    borderRadius: isMobile ? 10 : 14,
                    background: isPlayer
                      ? 'linear-gradient(135deg, rgba(76,175,80,0.45) 0%, rgba(102,187,106,0.3) 100%)'
                      : 'transparent',
                    border: isPlayer ? '1px solid rgba(76,175,80,0.5)' : '1px solid transparent',
                    boxShadow: isPlayer ? '0 0 16px rgba(76,175,80,0.2)' : 'none',
                  }}
                >
                  {/* Position */}
                  <span style={{
                    width: isMobile ? 14 : 18, textAlign: 'center',
                    fontSize: isMobile ? 10 : 12, fontWeight: 900,
                    fontFamily: 'var(--font-baloo)',
                    color: realIdx === 0 ? '#FFD54F' : realIdx === 1 ? '#E0E0E0' : realIdx === 2 ? '#FFAB91' : 'rgba(255,255,255,0.4)',
                  }}>
                    {realIdx + 1}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    width: isMobile ? 20 : 26, height: isMobile ? 20 : 26, borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    border: isPlayer ? '2px solid #66BB6A' : '1.5px solid rgba(255,255,255,0.15)',
                    boxShadow: isPlayer ? '0 0 16px rgba(76,175,80,0.35)' : 'none',
                  }}>
                    <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Name */}
                  <span style={{
                    flex: 1, minWidth: 0,
                    fontSize: isMobile ? 9 : 11, fontWeight: 700,
                    fontFamily: 'var(--font-baloo)',
                    color: isPlayer ? '#66BB6A' : 'rgba(255,255,255,0.8)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {isPlayer ? 'Tu' : p.name}
                  </span>

                  {/* Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <motion.span
                      key={p.score}
                      initial={{ scale: 1.3, color: p.score > (p as Competitor).prevScore ? '#66BB6A' : p.score < (p as Competitor).prevScore ? '#EF5350' : '#fff' }}
                      animate={{ scale: 1, color: isPlayer ? '#66BB6A' : 'rgba(255,255,255,0.9)' }}
                      transition={{ duration: 0.4 }}
                      style={{
                        fontSize: isMobile ? 10 : 12, fontWeight: 900,
                        fontFamily: 'var(--font-baloo)',
                        minWidth: isMobile ? 22 : 30, textAlign: 'right',
                      }}
                    >
                      {p.score}
                    </motion.span>
                    {'trend' in p && p.trend === 'up' && (
                      <span style={{ fontSize: isMobile ? 7 : 9, color: '#66BB6A' }}>&#9650;</span>
                    )}
                    {'trend' in p && p.trend === 'down' && (
                      <span style={{ fontSize: isMobile ? 7 : 9, color: '#EF5350' }}>&#9660;</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

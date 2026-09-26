'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
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

export function Leaderboard() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const isMobile = useIsMobile();
  const isPractice = typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false;
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const roomIdRef = useRef<string | null>(null);
  if (roomIdRef.current === null && typeof window !== 'undefined') {
    roomIdRef.current = getMatchRoomId();
  }

  const visible = !isPractice && (phase === 'playing' || phase === 'question' || phase === 'correctFeedback' || phase === 'incorrectFeedback');

  const cargarRef = useRef<(() => void) | null>(null);

  // Paso 11: SSE actualiza el ranking al instante tras cada respuesta de
  // cualquier jugador; el evento solo señala el cambio.
  const realtimeConnected = useRoomEvents(roomIdRef.current, () => {
    cargarRef.current?.();
  });

  // Ranking real de la sala (Paso 5): se consulta al servidor; sin sala no hay rivales.
  useEffect(() => {
    if (!visible) return;
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
        /* sin conexión: se conserva el último ranking conocido */
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
  }, [visible, realtimeConnected]);

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

  if (!visible) return null;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      style={{
        position: 'absolute',
        top: isMobile ? 8 : 16,
        left: isMobile ? 8 : 16,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(25,38,60,0.88) 0%, rgba(36,59,85,0.82) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isMobile ? 16 : 22,
        padding: isMobile ? '10px 12px' : '14px 16px',
        minWidth: isMobile ? 140 : 185,
        maxWidth: isMobile ? 170 : 215,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header */}
        <div style={{
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 3 : 5 }}>
          <AnimatePresence mode="popLayout">
            {allPlayers.map((p, idx) => {
              const isPlayer = 'isPlayer' in p && p.isPlayer;
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
                    color: idx === 0 ? '#FFD54F' : idx === 1 ? '#E0E0E0' : idx === 2 ? '#FFAB91' : 'rgba(255,255,255,0.4)',
                  }}>
                    {idx + 1}
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

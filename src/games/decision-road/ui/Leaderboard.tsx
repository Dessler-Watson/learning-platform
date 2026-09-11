'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { MOCK_PLAYER_NAMES } from '@/lib/rooms';
import { avatarUrl } from '@/lib/avatares';

interface Competitor {
  id: string;
  name: string;
  avatar: string;
  score: number;
  prevScore: number;
  trend: 'up' | 'down' | 'same';
}

const INITIAL_COMPETITORS: Omit<Competitor, 'score' | 'prevScore' | 'trend'>[] = [
  { id: 'c1', name: MOCK_PLAYER_NAMES[0], avatar: avatarUrl(2) },
  { id: 'c2', name: MOCK_PLAYER_NAMES[1], avatar: avatarUrl(3) },
  { id: 'c3', name: MOCK_PLAYER_NAMES[2], avatar: avatarUrl(4) },
  { id: 'c4', name: MOCK_PLAYER_NAMES[3], avatar: avatarUrl(5) },
  { id: 'c5', name: MOCK_PLAYER_NAMES[4], avatar: avatarUrl(6) },
];

function initCompetitors(): Competitor[] {
  return INITIAL_COMPETITORS.map((c) => ({
    ...c,
    score: Math.floor(Math.random() * 30),
    prevScore: 0,
    trend: 'same' as const,
  }));
}

export function Leaderboard() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const questions = useGameStore((s) => s.questions);
  const isMobile = useIsMobile();
  const [competitors, setCompetitors] = useState<Competitor[]>(initCompetitors);
  const lastQuestionRef = useRef(currentQuestionIndex);

  const visible = !isMobile && (phase === 'playing' || phase === 'question' || phase === 'correctFeedback' || phase === 'incorrectFeedback');
  const total = questions.length;
  const current = Math.min(currentQuestionIndex + 1, total);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCompetitors((prev) =>
        prev.map((c) => {
          const shouldChange = Math.random() < 0.35;
          if (!shouldChange) return c;
          const change = Math.floor(Math.random() * 35) - 8;
          const newScore = Math.max(0, c.score + change);
          return {
            ...c,
            prevScore: c.score,
            score: newScore,
            trend: newScore > c.score ? 'up' : newScore < c.score ? 'down' : 'same',
          };
        })
      );
    }, 2200);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (currentQuestionIndex > lastQuestionRef.current) {
      lastQuestionRef.current = currentQuestionIndex;
      setCompetitors((prev) =>
        prev.map((c) => {
          const bonus = Math.random() < 0.6 ? Math.floor(Math.random() * 30) + 10 : 0;
          const newScore = c.score + bonus;
          return {
            ...c,
            prevScore: c.score,
            score: newScore,
            trend: bonus > 0 ? 'up' : 'same',
          };
        })
      );
    }
  }, [currentQuestionIndex]);

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
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: 16,
        transform: 'translateY(-50%)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'rgba(16,24,36,0.75)',
        backdropFilter: 'blur(14px)',
        borderRadius: 18,
        padding: '10px 12px',
        minWidth: 160,
        maxWidth: 190,
        boxShadow: '0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid rgba(46,158,79,0.25)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 8, paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FDDB33" />
          </svg>
          <span style={{
            color: '#FDDB33', fontSize: 11, fontWeight: 900,
            fontFamily: 'var(--font-baloo)', letterSpacing: 0.5,
          }}>
            POSICIONES
          </span>
        </div>

        {/* Player list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 6px',
                    borderRadius: 10,
                    background: isPlayer ? 'rgba(46,158,79,0.2)' : 'transparent',
                    border: isPlayer ? '1px solid rgba(46,158,79,0.4)' : '1px solid transparent',
                  }}
                >
                  {/* Position */}
                  <span style={{
                    width: 16, textAlign: 'center',
                    fontSize: 10, fontWeight: 900,
                    fontFamily: 'var(--font-baloo)',
                    color: idx === 0 ? '#FDDB33' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.5)',
                  }}>
                    {idx + 1}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    border: isPlayer ? '1.5px solid #6EE08A' : '1px solid rgba(255,255,255,0.15)',
                  }}>
                    <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Name */}
                  <span style={{
                    flex: 1, minWidth: 0,
                    fontSize: 10, fontWeight: 700,
                    fontFamily: 'var(--font-baloo)',
                    color: isPlayer ? '#6EE08A' : 'rgba(255,255,255,0.8)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {isPlayer ? 'Tu' : p.name}
                  </span>

                  {/* Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <motion.span
                      key={p.score}
                      initial={{ scale: 1.3, color: p.score > (p as Competitor).prevScore ? '#6EE08A' : p.score < (p as Competitor).prevScore ? '#E94930' : '#fff' }}
                      animate={{ scale: 1, color: isPlayer ? '#6EE08A' : 'rgba(255,255,255,0.9)' }}
                      transition={{ duration: 0.4 }}
                      style={{
                        fontSize: 10, fontWeight: 900,
                        fontFamily: 'var(--font-baloo)',
                        minWidth: 24, textAlign: 'right',
                      }}
                    >
                      {p.score}
                    </motion.span>
                    {'trend' in p && p.trend === 'up' && (
                      <span style={{ fontSize: 8, color: '#6EE08A' }}>▲</span>
                    )}
                    {'trend' in p && p.trend === 'down' && (
                      <span style={{ fontSize: 8, color: '#E94930' }}>▼</span>
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

'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Check, X, Star } from 'lucide-react';
import { hudTargets } from '@/shared/refs/hudRefs';

function useAnimatedNumber(target: number, trigger: number, duration = 650) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const prevTriggerRef = useRef(0);

  useEffect(() => { displayRef.current = display; });

  useEffect(() => {
    const triggerChanged = trigger !== prevTriggerRef.current;
    prevTriggerRef.current = trigger;
    if (!triggerChanged) { setDisplay(target); displayRef.current = target; return; }
    const from = displayRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else displayRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, duration]);

  return display;
}

export function DecisionHUD() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const countTick = useGameStore((s) => s.countTick);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const correctCount = useGameStore((s) => s.correctCount);
  const incorrectCount = useGameStore((s) => s.incorrectCount);
  const animatedScore = useAnimatedNumber(score, countTick);
  const isMobile = useIsMobile();

  const isPractice = typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false;

  const checkIconRef = useRef<HTMLDivElement>(null);
  const crossIconRef = useRef<HTMLDivElement>(null);
  const starIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hudTargets.checkRef.current = checkIconRef.current;
    hudTargets.crossRef.current = crossIconRef.current;
    hudTargets.starRef.current = starIconRef.current;
  });

  if (phase === 'loading' || phase === 'intro' || phase === 'completed' || phase === 'results') return null;

  const total = questions.length;
  const answered = correctCount + incorrectCount;
  const scoreArrived = score === animatedScore;

  return (
    <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18,
          background: 'linear-gradient(160deg, rgba(25,38,60,0.88) 0%, rgba(36,59,85,0.82) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 999,
          padding: isMobile ? '10px 16px 10px 14px' : '14px 28px 14px 22px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Question counter */}
          <span style={{
            color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 13 : 16, fontWeight: 900,
            fontFamily: 'var(--font-baloo)', whiteSpace: 'nowrap',
          }}>
            {answered}/{total}
          </span>

          {/* Divider */}
          <div style={{
            width: 1, height: isMobile ? 20 : 28,
            background: 'rgba(255,255,255,0.1)',
          }} />

          {/* Correct count */}
          <motion.div
            key={`correct-${correctCount}`}
            animate={correctCount > 0 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}
          >
            <div ref={checkIconRef} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? 24 : 30, height: isMobile ? 24 : 30,
              borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(76,175,80,0.35) 0%, rgba(102,187,106,0.2) 100%)',
              border: '1.5px solid rgba(76,175,80,0.4)',
            }}>
              <Check size={isMobile ? 13 : 16} color="#66BB6A" strokeWidth={3} />
            </div>
            <span style={{
              color: '#66BB6A', fontSize: isMobile ? 14 : 18, fontWeight: 900,
              fontFamily: 'var(--font-baloo)',
            }}>
              {correctCount}
            </span>
          </motion.div>

          {/* Incorrect count */}
          <motion.div
            key={`incorrect-${incorrectCount}`}
            animate={incorrectCount > 0 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}
          >
            <div ref={crossIconRef} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? 24 : 30, height: isMobile ? 24 : 30,
              borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(239,83,80,0.35) 0%, rgba(239,83,80,0.15) 100%)',
              border: '1.5px solid rgba(239,83,80,0.4)',
            }}>
              <X size={isMobile ? 13 : 16} color="#EF5350" strokeWidth={3} />
            </div>
            <span style={{
              color: '#EF5350', fontSize: isMobile ? 14 : 18, fontWeight: 900,
              fontFamily: 'var(--font-baloo)',
            }}>
              {incorrectCount}
            </span>
          </motion.div>

          {/* Divider */}
          {!isPractice && (
            <div style={{
              width: 1, height: isMobile ? 20 : 28,
              background: 'rgba(255,255,255,0.1)',
            }} />
          )}

          {/* Score */}
          {!isPractice && (
            <motion.div
              key={countTick}
              animate={scoreArrived && countTick > 0 ? { scale: [1, 1.3, 0.95, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8,
                minWidth: isMobile ? 44 : 60, justifyContent: 'center',
                position: 'relative', padding: '4px 10px', borderRadius: 999,
              }}
            >
              <AnimatePresence>
                {countTick > 0 && scoreArrived && (
                  <motion.div
                    key={`flash-${countTick}`}
                    initial={{ opacity: 0.8, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', inset: -10,
                      borderRadius: 999,
                      background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>
              <div ref={starIconRef} style={{ display: 'flex', alignItems: 'center' }}>
                <Star size={isMobile ? 18 : 24} fill="#FFD54F" color="#FFD54F" style={{ filter: 'drop-shadow(0 0 6px rgba(255,213,79,0.4))' }} />
              </div>
              <motion.span
                animate={scoreArrived && countTick > 0 ? { color: ['#66BB6A', '#FFD54F', '#66BB6A'] } : {}}
                transition={{ duration: 0.6 }}
                style={{
                  fontSize: isMobile ? 16 : 22, fontWeight: 900, fontFamily: 'var(--font-baloo)',
                  color: '#FFD54F',
                  textShadow: '0 0 12px rgba(255,213,79,0.3)',
                }}
              >
                {animatedScore}
              </motion.span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

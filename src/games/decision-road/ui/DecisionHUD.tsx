'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Check, X } from 'lucide-react';
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
    <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 14,
          background: 'rgba(16,24,36,0.75)', backdropFilter: 'blur(14px)',
          borderRadius: 999, padding: isMobile ? '7px 12px 7px 10px' : '10px 20px 10px 16px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(46,158,79,0.25)',
        }}>
          {/* Question counter */}
          <span style={{
            color: '#B0BEC5', fontSize: isMobile ? 11 : 14, fontWeight: 900,
            fontFamily: 'var(--font-baloo)', whiteSpace: 'nowrap',
          }}>
            {answered}/{total}
          </span>

          {/* Correct count */}
          <motion.div
            key={`correct-${correctCount}`}
            animate={correctCount > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 4 }}
          >
            <div ref={checkIconRef} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? 16 : 20, height: isMobile ? 16 : 20,
              borderRadius: 999, background: 'rgba(46,158,79,0.2)',
            }}>
              <Check size={isMobile ? 10 : 13} color="#4CAF50" strokeWidth={3} />
            </div>
            <span style={{
              color: '#4CAF50', fontSize: isMobile ? 12 : 15, fontWeight: 900,
              fontFamily: 'var(--font-baloo)', minWidth: isMobile ? 14 : 18,
            }}>
              {correctCount}
            </span>
          </motion.div>

          {/* Incorrect count */}
          <motion.div
            key={`incorrect-${incorrectCount}`}
            animate={incorrectCount > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 4 }}
          >
            <div ref={crossIconRef} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? 16 : 20, height: isMobile ? 16 : 20,
              borderRadius: 999, background: 'rgba(233,73,48,0.2)',
            }}>
              <X size={isMobile ? 10 : 13} color="#E94930" strokeWidth={3} />
            </div>
            <span style={{
              color: '#E94930', fontSize: isMobile ? 12 : 15, fontWeight: 900,
              fontFamily: 'var(--font-baloo)', minWidth: isMobile ? 14 : 18,
            }}>
              {incorrectCount}
            </span>
          </motion.div>

          {/* Divider */}
          {!isPractice && (
            <div style={{ width: 1, height: isMobile ? 16 : 22, background: 'rgba(255,255,255,0.15)' }} />
          )}

          {/* Score */}
          {!isPractice && (
            <motion.div
              key={countTick}
              animate={scoreArrived && countTick > 0 ? { scale: [1, 1.45, 0.92, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 5, minWidth: isMobile ? 36 : 52, justifyContent: 'center', position: 'relative', padding: '2px 6px', borderRadius: 999 }}
            >
              <AnimatePresence>
                {countTick > 0 && scoreArrived && (
                  <motion.div
                    key={`flash-${countTick}`}
                    initial={{ opacity: 0.9, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 1.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', inset: -8,
                      borderRadius: 999,
                      background: 'radial-gradient(circle, rgba(253,219,51,0.85) 0%, rgba(253,219,51,0.3) 50%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>
              <div ref={starIconRef} style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/images/puntos.png" alt="Puntos" style={{ width: isMobile ? 16 : 22, height: isMobile ? 16 : 22, objectFit: 'contain' }} />
              </div>
              <motion.span
                animate={scoreArrived && countTick > 0 ? { color: ['#6EE08A', '#FDDB33', '#6EE08A'] } : {}}
                transition={{ duration: 0.6 }}
                style={{ fontSize: isMobile ? 14 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)', color: '#6EE08A' }}
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

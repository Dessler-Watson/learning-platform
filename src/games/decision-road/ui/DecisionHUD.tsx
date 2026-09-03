'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';

function useAnimatedNumber(target: number, trigger: number, duration = 650) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const prevTriggerRef = useRef(0);

  useEffect(() => {
    displayRef.current = display;
  });

  useEffect(() => {
    const triggerChanged = trigger !== prevTriggerRef.current;
    prevTriggerRef.current = trigger;

    if (!triggerChanged) {
      setDisplay(target);
      displayRef.current = target;
      return;
    }

    const from = displayRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (target - from) * eased);
      setDisplay(val);
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
  const animatedScore = useAnimatedNumber(score, countTick);
  if (phase === 'loading' || phase === 'intro' || phase === 'completed' || phase === 'results') return null;
  const total = questions.length;
  const current = Math.min(currentQuestionIndex + 1, total);
  const progress = total > 0 ? (current / total) * 100 : 0;
  const scoreArrived = score === animatedScore;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(16,24,36,0.75)', backdropFilter: 'blur(14px)',
        borderRadius: 999, padding: '10px 18px 10px 14px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid rgba(46,158,79,0.25)',
      }}>
        <span style={{ color: '#2E9E4F', fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>
          {current}/{total}
        </span>
        <div style={{ width: 110, height: 8, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #2E9E4F, #6EE08A)', borderRadius: 999 }}
          />
        </div>
        <div style={{ width: 110, height: 8, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${Math.min(100, (animatedScore / 400) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #FDDB33, #FDF293)', borderRadius: 999 }}
          />
        </div>
        <motion.div
          key={countTick}
          animate={scoreArrived && countTick > 0 ? { scale: [1, 1.45, 0.92, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 52, justifyContent: 'center', position: 'relative', padding: '2px 8px', borderRadius: 999 }}
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
          <img src="/images/puntos.png" alt="Puntos" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <motion.span
            animate={scoreArrived && countTick > 0 ? { color: ['#6EE08A', '#FDDB33', '#6EE08A'] } : {}}
            transition={{ duration: 0.6 }}
            style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-baloo)', color: '#6EE08A' }}
          >
            {animatedScore}
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}

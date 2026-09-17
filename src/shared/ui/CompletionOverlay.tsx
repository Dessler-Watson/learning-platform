'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameAudio } from '@/shared/lib/gameAudio';

interface Props {
  show: boolean;
  onDone: () => void;
  duration?: number;
}

export function CompletionOverlay({ show, onDone, duration = 4000 }: Props) {
  const [phase, setPhase] = useState<'idle' | 'enter' | 'hold' | 'exit'>('idle');

  useEffect(() => {
    if (!show) { setPhase('idle'); return; }
    gameAudio.completion();
    setPhase('enter');
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), duration - 500);
    const t3 = setTimeout(() => { setPhase('idle'); onDone(); }, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show, duration, onDone]);

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
          key="completion-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'exit' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,15,25,0.65)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          {/* Game controller icon */}
          <motion.div
            initial={{ scale: 0, rotate: -120, y: 30 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 14 }}
            style={{ marginBottom: 12 }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 11h4M8 9v4M14 12h.01M17 12h.01" stroke="#26C6DA" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M15.5 2H8.5C5.46 2 3 4.46 3 7.5V16.5C3 19.54 5.46 22 8.5 22H15.5C18.54 22 21 19.54 21 16.5V7.5C21 4.46 18.54 2 15.5 2Z" stroke="#26C6DA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          {/* "Completado!" text — letter-by-letter bounce */}
          <div style={{ display: 'flex', gap: 2, overflow: 'hidden' }}>
            {'Completado!'.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: 60, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.2 + i * 0.045,
                  type: 'spring',
                  stiffness: 350,
                  damping: 12,
                }}
                style={{
                  fontFamily: 'var(--font-baloo)',
                  fontSize: 'clamp(40px, 8vw, 64px)',
                  fontWeight: 900,
                  color: '#FFD600',
                  textShadow: '0 3px 18px rgba(255,214,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
                  lineHeight: 1,
                  display: 'inline-block',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </div>

          {/* Subtle underline sweep */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: 4,
              width: 120,
              borderRadius: 4,
              background: 'linear-gradient(90deg, transparent, #26C6DA, transparent)',
              marginTop: 14,
            }}
          />
        </motion.div>
    </AnimatePresence>
  );
}

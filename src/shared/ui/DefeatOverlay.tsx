'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  show: boolean;
  onDone: () => void;
  duration?: number;
  message?: string;
}

export function DefeatOverlay({ show, onDone, duration = 4000, message = 'Caíste a la lava!' }: Props) {
  const [phase, setPhase] = useState<'idle' | 'enter' | 'hold' | 'exit'>('idle');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!show) { setPhase('idle'); return; }
    setPhase('enter');
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), duration - 500);
    const t3 = setTimeout(() => { setPhase('idle'); onDoneRef.current(); }, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show, duration]);

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="defeat-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'exit' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(40,8,8,0.7)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* Skull icon */}
        <motion.div
          initial={{ scale: 0, rotate: -90, y: 30 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 14 }}
          style={{ marginBottom: 8 }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" fill="#1a1a1a" stroke="#E94930" strokeWidth="1.5"/>
            <circle cx="9" cy="9" r="1.8" fill="#E94930"/>
            <circle cx="15" cy="9" r="1.8" fill="#E94930"/>
            <path d="M9.5 14.5C10 15.5 11 16 12 16C13 16 14 15.5 14.5 14.5" stroke="#E94930" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="12" y1="13" x2="12" y2="16" stroke="#E94930" strokeWidth="1"/>
            <line x1="10" y1="14" x2="10" y2="16" stroke="#E94930" strokeWidth="0.8"/>
            <line x1="14" y1="14" x2="14" y2="16" stroke="#E94930" strokeWidth="0.8"/>
          </svg>
        </motion.div>

        {/* Defeat text — letter-by-letter bounce */}
        <div style={{ display: 'flex', gap: 1, overflow: 'hidden' }}>
          {message.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: 50, opacity: 0, scale: 0.4 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2 + i * 0.04,
                type: 'spring',
                stiffness: 350,
                damping: 12,
              }}
              style={{
                fontFamily: 'var(--font-baloo)',
                fontSize: 'clamp(28px, 6vw, 52px)',
                fontWeight: 900,
                color: '#E94930',
                textShadow: '0 3px 18px rgba(233,73,48,0.6), 0 1px 4px rgba(0,0,0,0.5)',
                lineHeight: 1,
                display: 'inline-block',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>

        {/* Red underline sweep */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.5, ease: 'easeOut' }}
          style={{
            height: 4,
            width: 100,
            borderRadius: 4,
            background: 'linear-gradient(90deg, transparent, #E94930, transparent)',
            marginTop: 12,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

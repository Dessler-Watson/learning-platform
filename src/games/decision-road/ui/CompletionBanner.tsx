'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';

export function CompletionBanner() {
  const phase = useGameStore((s) => s.phase);
  const result = useGameStore((s) => s.result);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase !== 'completed') { setVisible(false); return; }
    const isPractice = typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false;
    if (isPractice) {
      useGameStore.getState().setPhase('results');
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      useGameStore.getState().setPhase('results');
    }, 3500);
    return () => clearTimeout(t);
  }, [phase]);

  if (!visible || !result) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="completion-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,20,40,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 28,
              padding: '40px 50px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
              border: '2px solid rgba(255,255,255,0.6)',
              maxWidth: 420,
              width: '90%',
            }}
          >
            {/* Game icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 14 }}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #26C6DA 0%, #00ACC1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 6px 20px rgba(0,172,193,0.4)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="14" y1="12" x2="18" y2="12" />
                <line x1="6" y1="6" x2="18" y2="6" />
                <line x1="6" y1="18" x2="18" y2="18" />
                <circle cx="12" cy="12" r="2" fill="white" stroke="none" />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                fontFamily: 'var(--font-baloo)',
                fontSize: 36,
                fontWeight: 900,
                color: '#1a1a2e',
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '-0.5px',
              }}
            >
              Carrera Completada!
            </motion.h1>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{
                height: 4,
                width: 80,
                borderRadius: 4,
                background: 'linear-gradient(90deg, #4CAF50, #81C784)',
                margin: '14px auto',
              }}
            />

            {/* Stats */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              style={{
                fontFamily: 'var(--font-baloo)',
                fontSize: 16,
                fontWeight: 700,
                color: '#666',
                margin: 0,
              }}
            >
              {result.correctAnswers} correctas de {result.totalQuestions} preguntas
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

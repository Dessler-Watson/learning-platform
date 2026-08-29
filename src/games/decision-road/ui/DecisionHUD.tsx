'use client';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
export function DecisionHUD() {
  const phase = useGameStore((s) => s.phase); const score = useGameStore((s) => s.score); const xp = useGameStore((s) => s.xp);
  const questions = useGameStore((s) => s.questions); const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const streak = useGameStore((s) => s.streak);
  if (phase === 'loading' || phase === 'intro' || phase === 'completed' || phase === 'results') return null;
  const total = questions.length; const current = Math.min(currentQuestionIndex + 1, total);
  const progress = total > 0 ? (currentQuestionIndex / total) * 100 : 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: 22, padding: '8px 22px', border: '2px solid rgba(240,135,169,0.3)', boxShadow: '0 4px 16px rgba(240,135,169,0.2)' }}>
        <span style={{ color: '#6B7A94', fontSize: 12, fontWeight: 700 }}>Dignidad de la Mujer</span>
        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)' }} />
        <span style={{ color: '#344054', fontSize: 13, fontWeight: 800 }}>{current}/{total}</span>
        <div style={{ width: 80, height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 3 }}><motion.div animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} style={{ height: '100%', background: 'linear-gradient(90deg, #F087A9, #FDDB33)', borderRadius: 3 }} /></div>
        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)' }} />
        <span style={{ fontSize: 14, color: '#FDDB33', fontWeight: 800 }}>🏆 {score}</span>
        <span style={{ fontSize: 14, color: '#F087A9', fontWeight: 800 }}>💎 {xp}</span>
        {streak >= 2 && <span style={{ fontSize: 14, fontWeight: 800, color: '#E94930' }}>🔥 {streak}</span>}
      </div>
    </motion.div>
  );
}

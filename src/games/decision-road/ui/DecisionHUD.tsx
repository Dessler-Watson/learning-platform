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
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', borderRadius: 22, padding: '8px 22px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#aaa', fontSize: 12, fontWeight: 600 }}>Dignidad de la Mujer</span>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{current}/{total}</span>
        <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}><motion.div animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} style={{ height: '100%', background: '#FFD93D', borderRadius: 2 }} /></div>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: 14, color: '#FFD93D', fontWeight: 700 }}>🏆 {score}</span>
        <span style={{ fontSize: 14, color: '#7C4DFF', fontWeight: 700 }}>💎 {xp}</span>
        {streak >= 2 && <span style={{ fontSize: 14, fontWeight: 700 }}>🔥 {streak}</span>}
      </div>
    </motion.div>
  );
}

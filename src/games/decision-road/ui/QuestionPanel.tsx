'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
export function QuestionPanel() {
  const phase = useGameStore((s) => s.phase); const questions = useGameStore((s) => s.questions); const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const visible = phase === 'playing' || phase === 'question'; const question = questions[currentQuestionIndex];
  return (
    <AnimatePresence>{visible && question && (
      <motion.div key="qpanel" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'center', pointerEvents: 'none', paddingTop: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderRadius: 22, padding: '14px 32px', maxWidth: 640, width: '90%', border: '2px solid rgba(240,135,169,0.2)', boxShadow: '0 4px 16px rgba(240,135,169,0.1)' }}>
          <p style={{ color: '#344054', fontSize: 18, fontWeight: 700, textAlign: 'center', margin: 0, lineHeight: 1.3 }}>{question.statement}</p>
        </div>
      </motion.div>
    )}</AnimatePresence>
  );
}

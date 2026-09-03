'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';

export function QuestionPanel() {
  const phase = useGameStore((s) => s.phase);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const visible = phase === 'playing' || phase === 'question';
  const question = questions[currentQuestionIndex];
  const total = questions.length;
  const current = Math.min(currentQuestionIndex + 1, total);

  return (
    <AnimatePresence>
      {visible && question && (
        <motion.div
          key={`${currentQuestionIndex}-${phase}`}
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          style={{
            position: 'absolute', top: 10, left: 0, right: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none', padding: '0 12px',
          }}
        >
          {/* Etiqueta PREGUNTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 640, marginBottom: 10 }}>
            <span style={{
              background: 'linear-gradient(135deg, #F087A9, #D96B91)',
              color: '#fff', padding: '6px 18px', borderRadius: 999,
              fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(240,135,169,0.35)', fontFamily: 'var(--font-baloo)',
              whiteSpace: 'nowrap',
            }}>
              Pregunta {current}/{total}
            </span>
          </div>

          {/* Card de pregunta */}
          <div style={{
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
            borderRadius: 26, padding: '18px 28px', maxWidth: 640, width: '100%',
            border: '2px solid rgba(240,135,169,0.2)',
            boxShadow: '0 12px 40px rgba(30,42,58,0.18), 0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <p style={{
              color: '#1E2A3A', fontSize: 18, fontWeight: 700, textAlign: 'center',
              margin: 0, lineHeight: 1.35,
            }}>
              {question.statement}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

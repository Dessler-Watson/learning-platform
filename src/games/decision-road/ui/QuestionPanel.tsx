'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

export function QuestionPanel() {
  const phase = useGameStore((s) => s.phase);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const isMobile = useIsMobile();
  const visible = phase === 'playing' || phase === 'question';
  const question = questions[currentQuestionIndex];
  const total = questions.length;
  const current = Math.min(currentQuestionIndex + 1, total);

  return (
    <AnimatePresence>
      {visible && question && (
        <motion.div
          key={`${currentQuestionIndex}-${phase}`}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          style={{
            position: 'absolute', top: isMobile ? 48 : 8, left: 0, right: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none', padding: isMobile ? '0 8px' : '0 12px',
          }}
        >
          {/* Question counter badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', maxWidth: isMobile ? 380 : 680,
            marginBottom: isMobile ? 8 : 10,
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
              color: '#fff',
              padding: isMobile ? '6px 18px' : '8px 24px',
              borderRadius: 999,
              fontSize: isMobile ? 11 : 13,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(30,136,229,0.4), 0 0 30px rgba(30,136,229,0.15)',
              fontFamily: 'var(--font-baloo)',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              Pregunta {current}/{total}
            </div>
          </div>

          {/* Question card */}
          <div style={{
            position: 'relative',
            maxWidth: isMobile ? 380 : 680,
            width: '100%',
          }}>
            {/* Main card */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: isMobile ? 20 : 28,
              padding: isMobile ? '16px 20px' : '22px 36px',
              border: '1.5px solid rgba(255,255,255,0.7)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}>
              {/* Decorative circle top-right */}
              <div style={{
                position: 'absolute',
                top: -15,
                right: -15,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,213,79,0.25) 0%, rgba(255,183,77,0.15) 100%)',
                pointerEvents: 'none',
              }} />
              {/* Decorative circle bottom-left */}
              <div style={{
                position: 'absolute',
                bottom: -10,
                left: -10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(129,212,250,0.2) 0%, rgba(79,195,247,0.1) 100%)',
                pointerEvents: 'none',
              }} />

              <p style={{
                color: '#1a1a2e',
                fontSize: isMobile ? 15 : 20,
                fontWeight: 700,
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.4,
                fontFamily: 'var(--font-baloo)',
                position: 'relative',
                zIndex: 1,
              }}>
                {question.statement}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

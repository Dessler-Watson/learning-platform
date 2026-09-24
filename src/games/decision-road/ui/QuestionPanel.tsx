'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

/** Rumbo: nubes tenues solo en las esquinas superiores. */
const SoftCloudSVG = ({ flip = false }: { flip?: boolean }) => (
  <svg
    width="72"
    height="36"
    viewBox="0 0 72 36"
    fill="none"
    aria-hidden
    style={{
      position: 'absolute',
      top: -4,
      left: flip ? undefined : -8,
      right: flip ? -8 : undefined,
      opacity: 0.35,
      pointerEvents: 'none',
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  >
    <ellipse cx="28" cy="24" rx="26" ry="12" fill="#c8ddf5" />
    <ellipse cx="44" cy="18" rx="20" ry="13" fill="#dceaf9" />
    <ellipse cx="56" cy="24" rx="16" ry="10" fill="#b7d0ec" />
    <ellipse cx="36" cy="14" rx="14" ry="10" fill="#eef5fc" />
  </svg>
);

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
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0f1a30 100%)',
              color: 'rgba(255,255,255,0.92)',
              padding: isMobile ? '6px 18px' : '8px 24px',
              borderRadius: 999,
              fontSize: isMobile ? 11 : 13,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(100,180,255,0.1)',
              fontFamily: 'var(--font-baloo)',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(80,140,220,0.2)',
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
              background: 'linear-gradient(160deg, rgba(15,25,50,0.94) 0%, rgba(10,18,35,0.96) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: isMobile ? 18 : 26,
              padding: isMobile ? '18px 20px 16px' : '24px 36px 22px',
              border: '1px solid rgba(80,140,220,0.15)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(100,180,255,0.06)',
              overflow: 'hidden',
            }}>
              <SoftCloudSVG />
              <SoftCloudSVG flip />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(100,160,230,0.08) 0%, transparent 42%)',
                pointerEvents: 'none',
              }} />

              <p style={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: isMobile ? 15 : 20,
                fontWeight: 700,
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.4,
                fontFamily: 'var(--font-baloo)',
                position: 'relative',
                zIndex: 1,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                paddingTop: isMobile ? 2 : 4,
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

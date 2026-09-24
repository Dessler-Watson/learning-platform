'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTierrasStore } from '@/stores/tierras.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Check, X } from 'lucide-react';

function useAnimatedNumber(target: number, trigger: number, duration = 650) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const prevTriggerRef = useRef(0);
  useEffect(() => { displayRef.current = display; });
  useEffect(() => {
    const changed = trigger !== prevTriggerRef.current;
    prevTriggerRef.current = trigger;
    if (!changed) { setDisplay(target); displayRef.current = target; return; }
    const from = displayRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else displayRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, duration]);
  return display;
}

type FeedbackStage = 'idle' | 'text' | 'done';

const VineSVG = () => (
  <svg width="60" height="120" viewBox="0 0 60 120" fill="none" style={{ position: 'absolute', top: -10, left: -15, opacity: 0.25, pointerEvents: 'none' }}>
    <path d="M30 120 C10 100 5 80 15 60 C25 40 10 20 30 0" stroke="#4a8a6a" strokeWidth="1.5" fill="none" />
    <path d="M15 60 C5 55 2 45 8 38 C14 31 22 35 15 60Z" fill="#2a6a4a" />
    <path d="M20 85 C10 80 8 70 14 65 C20 60 28 64 20 85Z" fill="#2a6a4a" />
    <path d="M25 40 C15 35 12 25 18 20 C24 15 32 19 25 40Z" fill="#2a6a4a" />
    <circle cx="18" cy="48" r="2" fill="#4a8a6a" opacity="0.5" />
    <circle cx="12" cy="72" r="1.5" fill="#4a8a6a" opacity="0.4" />
  </svg>
);

const VineSVGRight = () => (
  <svg width="60" height="120" viewBox="0 0 60 120" fill="none" style={{ position: 'absolute', top: -10, right: -15, opacity: 0.25, pointerEvents: 'none', transform: 'scaleX(-1)' }}>
    <path d="M30 120 C10 100 5 80 15 60 C25 40 10 20 30 0" stroke="#4a8a6a" strokeWidth="1.5" fill="none" />
    <path d="M15 60 C5 55 2 45 8 38 C14 31 22 35 15 60Z" fill="#2a6a4a" />
    <path d="M20 85 C10 80 8 70 14 65 C20 60 28 64 20 85Z" fill="#2a6a4a" />
    <circle cx="18" cy="48" r="2" fill="#4a8a6a" opacity="0.5" />
  </svg>
);

export function TierrasHUD() {
  const phase = useTierrasStore((s) => s.phase);
  const questions = useTierrasStore((s) => s.questions);
  const qIndex = useTierrasStore((s) => s.currentQuestionIndex);
  const selectedPlatform = useTierrasStore((s) => s.selectedPlatform);
  const correctCount = useTierrasStore((s) => s.correctCount);
  const incorrectCount = useTierrasStore((s) => s.incorrectCount);
  const score = useTierrasStore((s) => s.score);
  const countTick = useTierrasStore((s) => s.countTick);
  const isMobile = useIsMobile();

  const isPractice = useRef(typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false).current;
  const animatedScore = useAnimatedNumber(score, countTick);

  const question = questions[qIndex];
  const show = phase === 'playing' || phase === 'correctFeedback' || phase === 'incorrectFeedback' || phase === 'sinking' || phase === 'falling';
  const total = questions.length;
  const current = Math.min(qIndex + 1, total);
  const scoreArrived = score === animatedScore;

  const [feedbackStage, setFeedbackStage] = useState<FeedbackStage>('idle');
  const isCorrectFeedback = phase === 'correctFeedback';
  const isIncorrectFeedback = phase === 'incorrectFeedback';
  const showFeedback = isCorrectFeedback || isIncorrectFeedback;

  useEffect(() => {
    if (!showFeedback) { setFeedbackStage('idle'); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      setFeedbackStage('text');
    }, 0));
    timers.push(setTimeout(() => setFeedbackStage('done'), 800));
    return () => timers.forEach(clearTimeout);
  }, [showFeedback, qIndex]);

  if (phase === 'loading' || phase === 'completed' || phase === 'results') return null;

  return (
    <>
      {/* === HUD BAR (bottom center) === */}
      {show && (
        <div style={{ position: 'absolute', bottom: isMobile ? 12 : 20, left: 0, right: 0, zIndex: 50, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 18,
              background: 'linear-gradient(160deg, rgba(15,30,50,0.92) 0%, rgba(20,40,60,0.88) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 999,
              padding: isMobile ? '8px 12px 8px 10px' : '14px 28px 14px 22px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(100,180,255,0.08)',
              border: '1px solid rgba(80,140,220,0.15)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: isMobile ? 11 : 16, fontWeight: 900, fontFamily: 'var(--font-baloo)', whiteSpace: 'nowrap' }}>
                {correctCount + incorrectCount}/{total}
              </span>
              <div style={{ width: 1, height: isMobile ? 16 : 28, background: 'rgba(255,255,255,0.1)' }} />
              <motion.div key={`correct-${correctCount}`} animate={correctCount > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 20 : 30, height: isMobile ? 20 : 30, borderRadius: 999, background: 'linear-gradient(135deg, rgba(76,175,80,0.35) 0%, rgba(102,187,106,0.2) 100%)', border: '1.5px solid rgba(76,175,80,0.4)' }}>
                  <Check size={isMobile ? 11 : 16} color="#66BB6A" strokeWidth={3} />
                </div>
                <span style={{ color: '#66BB6A', fontSize: isMobile ? 12 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{correctCount}</span>
              </motion.div>
              <motion.div key={`incorrect-${incorrectCount}`} animate={incorrectCount > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 20 : 30, height: isMobile ? 20 : 30, borderRadius: 999, background: 'linear-gradient(135deg, rgba(239,83,80,0.35) 0%, rgba(239,83,80,0.15) 100%)', border: '1.5px solid rgba(239,83,80,0.4)' }}>
                  <X size={isMobile ? 11 : 16} color="#EF5350" strokeWidth={3} />
                </div>
                <span style={{ color: '#EF5350', fontSize: isMobile ? 12 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{incorrectCount}</span>
              </motion.div>
              {!isPractice && <div style={{ width: 1, height: isMobile ? 16 : 28, background: 'rgba(255,255,255,0.1)' }} />}
              {!isPractice && (
                <motion.div key={countTick} animate={scoreArrived && countTick > 0 ? { scale: [1, 1.3, 0.95, 1.05, 1] } : { scale: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, minWidth: isMobile ? 36 : 60, justifyContent: 'center', position: 'relative', padding: '4px 8px', borderRadius: 999 }}>
                  <img src="/images/puntos.png" alt="Puntos" style={{ width: isMobile ? 14 : 24, height: isMobile ? 14 : 24, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(180,220,80,0.4))' }} />
                  <motion.span animate={scoreArrived && countTick > 0 ? { color: ['#66BB6A', '#B4DC50', '#66BB6A'] } : {}} transition={{ duration: 0.6 }}
                    style={{ fontSize: isMobile ? 14 : 22, fontWeight: 900, fontFamily: 'var(--font-baloo)', color: '#B4DC50', textShadow: '0 0 12px rgba(180,220,80,0.3)' }}>
                    {animatedScore}
                  </motion.span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* === QUESTION PANEL (bottom-right, dark glass-morphism) === */}
      <AnimatePresence>
        {show && question && (
          <motion.div
            key={qIndex}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 80 : 120,
              right: isMobile ? 8 : 16,
              zIndex: 50,
              maxWidth: isMobile ? 300 : 440,
              width: isMobile ? '78%' : '65%',
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: isMobile ? 4 : 8 }}>
              <span style={{
                background: 'linear-gradient(135deg, #1a2a4a 0%, #0f1a30 100%)',
                color: 'rgba(255,255,255,0.9)',
                padding: isMobile ? '4px 14px' : '6px 20px',
                borderRadius: 999,
                fontSize: isMobile ? 10 : 13,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(100,180,255,0.1)',
                border: '1px solid rgba(80,140,220,0.2)',
                fontFamily: 'var(--font-baloo)',
                whiteSpace: 'nowrap',
              }}>
                Pregunta {current}/{total}
              </span>
            </div>

            <div style={{
              position: 'relative',
              background: 'linear-gradient(160deg, rgba(15,25,50,0.92) 0%, rgba(10,18,35,0.95) 100%)',
              backdropFilter: 'blur(24px)',
              borderRadius: isMobile ? 16 : 24,
              padding: isMobile ? '12px 14px' : '20px 28px',
              border: '1px solid rgba(80,140,220,0.15)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(100,180,255,0.06)',
              overflow: 'hidden',
            }}>
              <VineSVG />
              <VineSVGRight />

              <p style={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: isMobile ? 13 : 19,
                fontWeight: 700,
                textAlign: 'center',
                margin: `0 0 ${isMobile ? 12 : 18}px`,
                lineHeight: 1.35,
                fontFamily: 'var(--font-baloo)',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {question.statement}
              </p>
              <div style={{ display: 'flex', gap: isMobile ? 8 : 14 }}>
                <AnswerCard label="A" text={question.optionA} color="#E53935" isMobile={isMobile} />
                <AnswerCard label="B" text={question.optionB} color="#42A5F5" isMobile={isMobile} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === FEEDBACK OVERLAY === */}
      <AnimatePresence>
        {showFeedback && feedbackStage !== 'idle' && (
          <>
            {feedbackStage === 'text' && (
              <div style={{ position: 'absolute', zIndex: 60, left: '50%', top: '40%', transform: 'translateX(-50%)' }}>
                <motion.div
                  key="feedback-text"
                  initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ scale: [0.05, 1.25, 0.95, 1.05, 1], opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }}
                  style={{
                    fontSize: isMobile ? 36 : 90, fontWeight: 900,
                    fontFamily: 'var(--font-baloo)', lineHeight: 1,
                    letterSpacing: '-2px', whiteSpace: 'nowrap',
                    ...(isCorrectFeedback ? {
                      color: '#2E9E4F',
                      textShadow: '0 0 24px rgba(110,224,138,0.8), 0 0 48px rgba(46,158,79,0.6), 0 6px 0 rgba(0,0,0,0.18)',
                    } : {
                      color: '#8B4513',
                      textShadow: '0 0 24px rgba(139,69,19,0.8), 0 0 48px rgba(139,69,19,0.5), 0 6px 0 rgba(0,0,0,0.18)',
                    }),
                  }}
                >
                  {isCorrectFeedback ? 'CORRECTO!' : 'INCORRECTO!'}
                </motion.div>
              </div>
            )}

            {isIncorrectFeedback && feedbackStage === 'text' && question && (
              <motion.div
                key="correct-answer-hint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                style={{
                  position: 'absolute', zIndex: 61, left: '50%', top: '55%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(160deg, rgba(15,25,50,0.95) 0%, rgba(10,18,35,0.98) 100%)',
                  border: '1px solid rgba(76,175,80,0.3)',
                  borderRadius: isMobile ? 12 : 16,
                  padding: isMobile ? '8px 12px' : '14px 22px',
                  maxWidth: isMobile ? 260 : 420,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                }}
              >
                <p style={{ margin: 0, fontSize: isMobile ? 10 : 15, fontWeight: 800, color: '#66BB6A', fontFamily: 'var(--font-baloo)', lineHeight: 1.4 }}>
                  Respuesta correcta:
                </p>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? 11 : 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-baloo)', lineHeight: 1.3 }}>
                  {question.correctAnswer === 'A' ? question.optionA : question.optionB}
                </p>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function AnswerCard({ label, text, color, isMobile }: { label: string; text: string; color: string; isMobile: boolean }) {
  return (
    <div style={{
      flex: 1,
      padding: isMobile ? '10px 8px' : '14px 14px',
      borderRadius: isMobile ? 12 : 16,
      background: 'rgba(255,255,255,0.04)',
      border: `2px solid ${color}44`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? 6 : 10,
      boxShadow: `inset 0 1px 0 ${color}11, 0 2px 8px rgba(0,0,0,0.2)`,
    }}>
      <span style={{
        width: isMobile ? 26 : 36, height: isMobile ? 26 : 36, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 12 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)',
        boxShadow: `0 2px 8px ${color}66, inset 0 -2px 0 rgba(0,0,0,0.2)`,
      }}>
        {label}
      </span>
      <span style={{ fontSize: isMobile ? 10 : 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.35, fontFamily: 'var(--font-baloo)' }}>
        {text}
      </span>
    </div>
  );
}

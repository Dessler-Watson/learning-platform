'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLavaStore } from '@/stores/lava.store';
import { Check, X } from 'lucide-react';
import { gameAudio } from '@/shared/lib/gameAudio';

const MAX_TICKS = 3;

function useScreenSize() {
  const [size, setSize] = useState<'phone' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w <= 640) setSize('phone');
      else if (w <= 1024) setSize('tablet');
      else setSize('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return size;
}

type FeedbackStage = 'idle' | 'text' | 'done';

/** Bajo Presión: brasa/ember tenue en esquinas + resplandor naranja inferior. */
const EmberCornerSVG = ({ flip = false }: { flip?: boolean }) => (
  <svg
    width="48"
    height="40"
    viewBox="0 0 48 40"
    fill="none"
    aria-hidden
    style={{
      position: 'absolute',
      bottom: -2,
      left: flip ? undefined : -4,
      right: flip ? -4 : undefined,
      opacity: 0.4,
      pointerEvents: 'none',
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  >
    <path d="M4 38 L10 22 L18 26 L22 14 L30 24 L36 18 L44 38 Z" fill="#4a3530" />
    <path d="M10 22 L14 28 L8 30 Z" fill="#5c4038" />
    <circle cx="16" cy="30" r="2.2" fill="#ff6b00" opacity="0.9" />
    <circle cx="16" cy="30" r="4.5" fill="#ff6b00" opacity="0.22" />
    <circle cx="30" cy="28" r="1.8" fill="#ffab40" opacity="0.85" />
    <circle cx="30" cy="28" r="3.5" fill="#ffab40" opacity="0.2" />
  </svg>
);

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

export function LavaHUD() {
  const phase = useLavaStore((s) => s.phase);
  const questions = useLavaStore((s) => s.questions);
  const qIndex = useLavaStore((s) => s.currentQuestionIndex);
  const localAnswer = useLavaStore((s) => s.localAnswer);
  const roundResults = useLavaStore((s) => s.roundResults);
  const ticks = useLavaStore((s) => s.ticks);
  const correctCount = useLavaStore((s) => s.correctCount);
  const incorrectCount = useLavaStore((s) => s.incorrectCount);
  const score = useLavaStore((s) => s.score);
  const countTick = useLavaStore((s) => s.countTick);
  const screen = useScreenSize();
  const isPhone = screen === 'phone';
  const isTablet = screen === 'tablet';

  const isPractice = typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false;
  const animatedScore = useAnimatedNumber(score, countTick);

  const question = questions[qIndex];
  const show = phase === 'roundActive' || phase === 'roundResult';
  const total = questions.length;
  const current = Math.min(qIndex + 1, total);
  const myResult = roundResults.find((r) => r.playerId === 0)?.correct;
  const scoreArrived = score === animatedScore;

  const [feedbackStage, setFeedbackStage] = useState<FeedbackStage>('idle');
  const isCorrectAnswer = myResult === true;
  const isIncorrectAnswer = myResult === false;
  const showFeedback = phase === 'roundResult' && (isCorrectAnswer || isIncorrectAnswer);

  useEffect(() => {
    if (!showFeedback) { setFeedbackStage('idle'); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      setFeedbackStage('text');
      if (isCorrectAnswer) gameAudio.lavaCorrect();
      else if (isIncorrectAnswer) gameAudio.lavaIncorrect();
    }, 0));
    timers.push(setTimeout(() => setFeedbackStage('done'), 1800));
    return () => timers.forEach(clearTimeout);
  }, [showFeedback, qIndex]);

  if (phase === 'loading' || phase === 'completed') return null;

  return (
    <>
      {/* === HUD BAR (bottom center) === */}
      {show && (
        <div style={{ position: 'absolute', bottom: isPhone ? 12 : 20, left: 0, right: 0, zIndex: 50, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: isPhone ? 8 : isTablet ? 14 : 18,
              background: 'linear-gradient(160deg, rgba(60,20,10,0.88) 0%, rgba(80,30,15,0.82) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 999,
              padding: isPhone ? '8px 12px 8px 10px' : isTablet ? '10px 18px 10px 14px' : '14px 28px 14px 22px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,120,0,0.2)',
            }}>
              <span style={{
                color: 'rgba(255,255,255,0.6)', fontSize: isPhone ? 11 : isTablet ? 14 : 16, fontWeight: 900,
                fontFamily: 'var(--font-baloo)', whiteSpace: 'nowrap',
              }}>
                {correctCount + incorrectCount}/{total}
              </span>

              <div style={{ width: 1, height: isPhone ? 16 : isTablet ? 22 : 28, background: 'rgba(255,255,255,0.1)' }} />

              <motion.div key={`correct-${correctCount}`} animate={correctCount > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: isPhone ? 3 : 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: isPhone ? 20 : isTablet ? 26 : 30, height: isPhone ? 20 : isTablet ? 26 : 30,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(76,175,80,0.35) 0%, rgba(102,187,106,0.2) 100%)',
                  border: '1.5px solid rgba(76,175,80,0.4)',
                }}>
                  <Check size={isPhone ? 11 : isTablet ? 14 : 16} color="#66BB6A" strokeWidth={3} />
                </div>
                <span style={{ color: '#66BB6A', fontSize: isPhone ? 12 : isTablet ? 16 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{correctCount}</span>
              </motion.div>

              <motion.div key={`incorrect-${incorrectCount}`} animate={incorrectCount > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: isPhone ? 3 : 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: isPhone ? 20 : isTablet ? 26 : 30, height: isPhone ? 20 : isTablet ? 26 : 30,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(239,83,80,0.35) 0%, rgba(239,83,80,0.15) 100%)',
                  border: '1.5px solid rgba(239,83,80,0.4)',
                }}>
                  <X size={isPhone ? 11 : isTablet ? 14 : 16} color="#EF5350" strokeWidth={3} />
                </div>
                <span style={{ color: '#EF5350', fontSize: isPhone ? 12 : isTablet ? 16 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{incorrectCount}</span>
              </motion.div>

              {!isPractice && <div style={{ width: 1, height: isPhone ? 16 : isTablet ? 22 : 28, background: 'rgba(255,255,255,0.1)' }} />}

              {!isPractice && (
                <motion.div key={countTick} animate={scoreArrived && countTick > 0 ? { scale: [1, 1.3, 0.95, 1.05, 1] } : { scale: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ display: 'flex', alignItems: 'center', gap: isPhone ? 4 : 8, minWidth: isPhone ? 36 : isTablet ? 50 : 60, justifyContent: 'center', position: 'relative', padding: '4px 8px', borderRadius: 999 }}>
                  <AnimatePresence>
                    {countTick > 0 && scoreArrived && (
                      <motion.div key={`flash-${countTick}`} initial={{ opacity: 0.8, scale: 0.5 }} animate={{ opacity: 0, scale: 2 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{ position: 'absolute', inset: -8, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)', pointerEvents: 'none' }} />
                    )}
                  </AnimatePresence>
                  <img src="/images/puntos.png" alt="Puntos" style={{ width: isPhone ? 14 : isTablet ? 20 : 24, height: isPhone ? 14 : isTablet ? 20 : 24, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(255,213,79,0.4))' }} />
                  <motion.span animate={scoreArrived && countTick > 0 ? { color: ['#66BB6A', '#FFD54F', '#66BB6A'] } : {}} transition={{ duration: 0.6 }}
                    style={{ fontSize: isPhone ? 14 : isTablet ? 18 : 22, fontWeight: 900, fontFamily: 'var(--font-baloo)', color: '#FFD54F', textShadow: '0 0 12px rgba(255,213,79,0.3)' }}>
                    {animatedScore}
                  </motion.span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* === TICKS INDICATOR (left side) === */}
      {show && (
        <div style={{
          position: 'absolute',
          left: isPhone ? 6 : 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          pointerEvents: 'none',
        }}>
          <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
            <div style={{
              background: 'linear-gradient(160deg, rgba(60,20,10,0.92) 0%, rgba(80,30,15,0.88) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: isPhone ? 14 : 20,
              padding: isPhone ? '8px 6px' : isTablet ? '12px 10px' : '16px 12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,120,0,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isPhone ? 3 : 6,
              minWidth: isPhone ? 38 : isTablet ? 48 : 56,
            }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ lineHeight: 0 }}
              >
                <svg width={isPhone ? 18 : isTablet ? 22 : 26} height={isPhone ? 22 : isTablet ? 26 : 30} viewBox="0 0 24 28" fill="none">
                  <path d="M12 2C12 2 5 10 5 16C5 20 8 24 12 24C16 24 19 20 19 16C19 10 12 2 12 2Z" fill="url(#fireGrad)" />
                  <path d="M12 10C12 10 9 14 9 17C9 19 10.5 21 12 21C13.5 21 15 19 15 17C15 14 12 10 12 10Z" fill="url(#fireInner)" />
                  <defs>
                    <linearGradient id="fireGrad" x1="12" y1="2" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF6B00" />
                      <stop offset="0.5" stopColor="#FF9800" />
                      <stop offset="1" stopColor="#FFD54F" />
                    </linearGradient>
                    <linearGradient id="fireInner" x1="12" y1="10" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFAB40" />
                      <stop offset="1" stopColor="#FFF176" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: isPhone ? 6 : isTablet ? 8 : 9, fontWeight: 800, fontFamily: 'var(--font-baloo)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Ticks
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isPhone ? 2 : 4 }}>
                {Array.from({ length: MAX_TICKS }, (_, i) => {
                  const tickLevel = MAX_TICKS - i;
                  const active = ticks >= tickLevel;
                  const isCurrent = ticks === tickLevel;
                  return (
                    <motion.div
                      key={tickLevel}
                      animate={active && isCurrent ? { scale: [1, 1.2, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                      transition={{ duration: 0.6, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
                      style={{ lineHeight: 0 }}
                    >
                      <svg width={isPhone ? 16 : isTablet ? 20 : 24} height={isPhone ? 20 : isTablet ? 24 : 28} viewBox="0 0 24 28" fill="none" style={{ opacity: active ? 1 : 0.2, filter: active ? `drop-shadow(0 0 6px ${tickLevel <= 1 ? 'rgba(233,73,48,0.6)' : 'rgba(255,152,0,0.5)'})` : 'none' }}>
                        <path
                          d="M12 2C12 2 5 10 5 16C5 20 8 24 12 24C16 24 19 20 19 16C19 10 12 2 12 2Z"
                          fill={active
                            ? tickLevel <= 1 ? 'url(#fireDanger)' : 'url(#fireActive)'
                            : 'rgba(255,255,255,0.15)'}
                        />
                        {active && (
                          <path
                            d="M12 10C12 10 9 14 9 17C9 19 10.5 21 12 21C13.5 21 15 19 15 17C15 14 12 10 12 10Z"
                            fill={tickLevel <= 1 ? 'url(#fireInnerDanger)' : 'url(#fireInnerActive)'}
                          />
                        )}
                        <defs>
                          <linearGradient id="fireActive" x1="12" y1="2" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FF6B00" /><stop offset="1" stopColor="#FFD54F" />
                          </linearGradient>
                          <linearGradient id="fireInnerActive" x1="12" y1="10" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FFAB40" /><stop offset="1" stopColor="#FFF176" />
                          </linearGradient>
                          <linearGradient id="fireDanger" x1="12" y1="2" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#D32F2F" /><stop offset="1" stopColor="#FF5252" />
                          </linearGradient>
                          <linearGradient id="fireInnerDanger" x1="12" y1="10" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FF5252" /><stop offset="1" stopColor="#FFCDD2" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </motion.div>
                  );
                })}
              </div>

              <motion.span
                key={ticks}
                initial={{ scale: 1.4, color: ticks <= 1 ? '#E94930' : '#FFCC00' }}
                animate={{ scale: 1 }}
                style={{ color: ticks <= 1 ? '#E94930' : ticks <= 2 ? '#FFA000' : '#FFCC00', fontSize: isPhone ? 16 : isTablet ? 20 : 24, fontWeight: 900, fontFamily: 'var(--font-baloo)', lineHeight: 1 }}
              >
                {ticks}
              </motion.span>
            </div>
          </motion.div>
        </div>
      )}

      {/* === QUESTION CARD (top center) === */}
      <AnimatePresence>
        {show && question && (
          <motion.div
            key={qIndex}
            initial={{ x: '-50%', y: -70, opacity: 0 }}
            animate={{ x: '-50%', y: 0, opacity: 1 }}
            exit={{ x: '-50%', y: -70, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              position: 'fixed', top: isPhone ? 8 : 12, left: '50%',
              zIndex: 50,
              maxWidth: isPhone ? 340 : isTablet ? 480 : 560,
              width: isPhone ? '88%' : isTablet ? '85%' : '92%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: isPhone ? 4 : isTablet ? 7 : 10 }}>
              <span style={{
                background: 'linear-gradient(135deg, #1a2a4a 0%, #0f1a30 100%)',
                color: 'rgba(255,255,255,0.92)', padding: isPhone ? '3px 10px' : isTablet ? '4px 14px' : '6px 18px', borderRadius: 999,
                fontSize: isPhone ? 8 : isTablet ? 10 : 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(100,180,255,0.1)', fontFamily: 'var(--font-baloo)',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(80,140,220,0.2)',
              }}>
                Pregunta {current}/{total}
              </span>
            </div>

            <div style={{
              position: 'relative',
              background: 'linear-gradient(160deg, rgba(15,25,50,0.94) 0%, rgba(10,18,35,0.96) 100%)',
              backdropFilter: 'blur(16px)',
              borderRadius: isPhone ? 14 : isTablet ? 20 : 26,
              padding: isPhone ? '14px 12px 12px' : isTablet ? '18px 20px 16px' : '22px 28px 20px',
              border: '1px solid rgba(255,120,0,0.14)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,160,80,0.05)',
              overflow: 'hidden',
            }}>
              <EmberCornerSVG />
              <EmberCornerSVG flip />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 55%, rgba(255,100,0,0.1) 100%)',
                pointerEvents: 'none',
              }} />

              <p style={{
                position: 'relative',
                zIndex: 1,
                color: 'rgba(255,255,255,0.95)',
                fontSize: isPhone ? 12 : isTablet ? 15 : 18,
                fontWeight: 700, textAlign: 'center', margin: `0 0 ${isPhone ? 10 : 16}px`, lineHeight: 1.35,
                fontFamily: 'var(--font-baloo)',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {question.statement}
              </p>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: isPhone ? 6 : isTablet ? 9 : 12 }}>
                <ABtn label="A" text={question.optionA} color="#E53935" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'A'} myCorrect={myResult} side="A" revealed={phase === 'roundResult'} actualCorrect={question.correctAnswer} isPhone={isPhone} isTablet={isTablet} />
                <ABtn label="B" text={question.optionB} color="#42A5F5" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'B'} myCorrect={myResult} side="B" revealed={phase === 'roundResult'} actualCorrect={question.correctAnswer} isPhone={isPhone} isTablet={isTablet} />
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
              <div
                style={{
                  position: 'absolute', zIndex: 60, left: '50%', top: '40%',
                  transform: 'translateX(-50%)',
                }}
              >
              <motion.div
                key="feedback-text"
                initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)' }}
                animate={isIncorrectAnswer
                  ? { scale: [0.05, 1.25, 0.95, 1.05, 1], opacity: 1, filter: 'blur(0px)' }
                  : { scale: [0.05, 1.25, 0.95, 1.05, 1], opacity: 1, filter: 'blur(0px)' }
                }
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }}
                style={{
                  fontSize: isPhone ? 36 : isTablet ? 60 : 90, fontWeight: 900,
                  fontFamily: 'var(--font-baloo)', lineHeight: 1,
                  letterSpacing: '-2px', whiteSpace: 'nowrap',
                  ...(isCorrectAnswer ? {
                    color: '#2E9E4F',
                    textShadow: '0 0 24px rgba(110,224,138,0.8), 0 0 48px rgba(46,158,79,0.6), 0 6px 0 rgba(0,0,0,0.18)',
                  } : {
                    color: '#E94930',
                    textShadow: '0 0 24px rgba(233,73,48,0.8), 0 0 48px rgba(233,73,48,0.5), 0 6px 0 rgba(0,0,0,0.18)',
                  }),
                }}
              >
                {isCorrectAnswer ? '¡CORRECTO!' : '¡INCORRECTO!'}
              </motion.div>
              </div>
            )}

            {isIncorrectAnswer && feedbackStage === 'text' && question && (
              <motion.div
                key="correct-answer-hint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                style={{
                  position: 'absolute', zIndex: 61, left: '50%', top: '55%',
                  x: '-50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: '2px solid rgba(46,158,79,0.4)',
                  borderRadius: isPhone ? 12 : 16,
                  padding: isPhone ? '8px 12px' : isTablet ? '10px 16px' : '14px 22px',
                  maxWidth: isPhone ? 260 : isTablet ? 360 : 420,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  pointerEvents: 'none',
                }}
              >
                <p style={{ margin: 0, fontSize: isPhone ? 10 : isTablet ? 13 : 15, fontWeight: 800, color: '#2E9E4F', fontFamily: 'var(--font-baloo)', lineHeight: 1.4 }}>
                  Respuesta correcta:
                </p>
                <p style={{ margin: '4px 0 0', fontSize: isPhone ? 11 : isTablet ? 14 : 16, fontWeight: 700, color: '#2A1E0E', fontFamily: 'var(--font-baloo)', lineHeight: 1.3 }}>
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

function ABtn({ label, text, color, disabled, selected, myCorrect, side, revealed, actualCorrect, isPhone, isTablet }: {
  label: string; text: string; color: string; disabled: boolean; selected: boolean;
  myCorrect: boolean | undefined; side: 'A' | 'B'; revealed: boolean; actualCorrect: 'A' | 'B'; isPhone: boolean; isTablet: boolean;
}) {
  const isActualCorrect = actualCorrect === side;
  const dimmed = revealed && !isActualCorrect;

  let bg = 'rgba(255,255,255,0.04)';
  let tx = 'rgba(255,255,255,0.9)';
  let border = `2px solid ${color}44`;
  let circleBg = `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`;
  let circleTx = '#fff';
  let shake = false;
  let celebrate = false;

  if (selected) {
    if (myCorrect === true) { bg = 'rgba(76,175,80,0.16)'; tx = '#C8E6C9'; border = '2px solid #4CAF50'; celebrate = true; circleBg = 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)'; }
    else if (myCorrect === false) { bg = 'rgba(229,57,53,0.16)'; tx = '#FFCDD2'; border = '2px solid #E53935'; shake = true; circleBg = 'linear-gradient(135deg, #E53935 0%, #C62828 100%)'; }
    else { bg = `${color}18`; tx = '#fff'; border = `2px solid ${color}`; }
  } else if (revealed && isActualCorrect) {
    bg = 'rgba(76,175,80,0.16)'; tx = '#C8E6C9'; border = '2px solid #4CAF50'; circleBg = 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)';
  }

  return (
    <motion.button
      animate={shake ? { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.4 } } : { x: 0 }}
      whileHover={!disabled && !revealed ? { scale: 1.03, y: -2 } : {}}
      whileTap={!disabled && !revealed ? { scale: 0.97 } : {}}
      onClick={() => { if (!disabled && !revealed) { gameAudio.lavaSelect(); useLavaStore.getState().setLocalAnswer(side); } }}
      disabled={disabled}
      style={{
        flex: 1,
        padding: isPhone ? '8px 6px' : isTablet ? '10px 8px' : '14px 12px',
        borderRadius: isPhone ? 12 : 16,
        cursor: disabled && !selected ? 'default' : 'pointer',
        background: bg, color: tx,
        fontSize: isPhone ? 10 : isTablet ? 12 : 14,
        fontWeight: 700,
        border,
        boxShadow: selected ? `0 4px 14px rgba(0,0,0,0.28)` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: isPhone ? 6 : isTablet ? 9 : 12,
        transition: 'background 0.2s, border-color 0.2s',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <span style={{
        width: isPhone ? 28 : isTablet ? 34 : 42, height: isPhone ? 28 : isTablet ? 34 : 42, borderRadius: '50%', flexShrink: 0,
        background: circleBg, color: circleTx,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isPhone ? 13 : isTablet ? 16 : 20, fontWeight: 900, fontFamily: 'var(--font-baloo)',
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)',
      }}>
        {label}
      </span>
      <span style={{ lineHeight: 1.3 }}>{text}</span>
      {celebrate && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 'auto', fontSize: isPhone ? 16 : isTablet ? 20 : 24 }}>&#10003;</motion.span>}
      {shake && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 'auto', fontSize: isPhone ? 16 : isTablet ? 20 : 24 }}>&#10007;</motion.span>}
    </motion.button>
  );
}

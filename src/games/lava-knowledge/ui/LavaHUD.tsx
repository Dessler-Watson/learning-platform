'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLavaStore } from '@/stores/lava.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Check, X, Flame } from 'lucide-react';

type FeedbackStage = 'idle' | 'text' | 'done';

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
  const isMobile = useIsMobile();

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
    timers.push(setTimeout(() => setFeedbackStage('text'), 0));
    timers.push(setTimeout(() => setFeedbackStage('done'), 1800));
    return () => timers.forEach(clearTimeout);
  }, [showFeedback, qIndex]);

  if (phase === 'loading' || phase === 'completed') return null;

  return (
    <>
      {/* === HUD BAR (bottom center) - matches DecisionRoad style === */}
      {show && (
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 50, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18,
              background: 'linear-gradient(160deg, rgba(60,20,10,0.88) 0%, rgba(80,30,15,0.82) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 999,
              padding: isMobile ? '10px 16px 10px 14px' : '14px 28px 14px 22px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,120,0,0.2)',
            }}>
              {/* Question counter */}
              <span style={{
                color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 13 : 16, fontWeight: 900,
                fontFamily: 'var(--font-baloo)', whiteSpace: 'nowrap',
              }}>
                {correctCount + incorrectCount}/{total}
              </span>

              {/* Divider */}
              <div style={{ width: 1, height: isMobile ? 20 : 28, background: 'rgba(255,255,255,0.1)' }} />

              {/* Correct count */}
              <motion.div key={`correct-${correctCount}`} animate={correctCount > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: isMobile ? 24 : 30, height: isMobile ? 24 : 30,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(76,175,80,0.35) 0%, rgba(102,187,106,0.2) 100%)',
                  border: '1.5px solid rgba(76,175,80,0.4)',
                }}>
                  <Check size={isMobile ? 13 : 16} color="#66BB6A" strokeWidth={3} />
                </div>
                <span style={{ color: '#66BB6A', fontSize: isMobile ? 14 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{correctCount}</span>
              </motion.div>

              {/* Incorrect count */}
              <motion.div key={`incorrect-${incorrectCount}`} animate={incorrectCount > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: isMobile ? 24 : 30, height: isMobile ? 24 : 30,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(239,83,80,0.35) 0%, rgba(239,83,80,0.15) 100%)',
                  border: '1.5px solid rgba(239,83,80,0.4)',
                }}>
                  <X size={isMobile ? 13 : 16} color="#EF5350" strokeWidth={3} />
                </div>
                <span style={{ color: '#EF5350', fontSize: isMobile ? 14 : 18, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{incorrectCount}</span>
              </motion.div>

              {/* Divider */}
              {!isPractice && <div style={{ width: 1, height: isMobile ? 20 : 28, background: 'rgba(255,255,255,0.1)' }} />}

              {/* Score */}
              {!isPractice && (
                <motion.div key={countTick} animate={scoreArrived && countTick > 0 ? { scale: [1, 1.3, 0.95, 1.05, 1] } : { scale: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, minWidth: isMobile ? 44 : 60, justifyContent: 'center', position: 'relative', padding: '4px 10px', borderRadius: 999 }}>
                  <AnimatePresence>
                    {countTick > 0 && scoreArrived && (
                      <motion.div key={`flash-${countTick}`} initial={{ opacity: 0.8, scale: 0.5 }} animate={{ opacity: 0, scale: 2 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{ position: 'absolute', inset: -10, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0.2) 50%, transparent 70%)', pointerEvents: 'none' }} />
                    )}
                  </AnimatePresence>
                  <img src="/images/puntos.png" alt="Puntos" style={{ width: isMobile ? 18 : 24, height: isMobile ? 18 : 24, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(255,213,79,0.4))' }} />
                  <motion.span animate={scoreArrived && countTick > 0 ? { color: ['#66BB6A', '#FFD54F', '#66BB6A'] } : {}} transition={{ duration: 0.6 }}
                    style={{ fontSize: isMobile ? 16 : 22, fontWeight: 900, fontFamily: 'var(--font-baloo)', color: '#FFD54F', textShadow: '0 0 12px rgba(255,213,79,0.3)' }}>
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
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 50, pointerEvents: 'none' }}>
          <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
            <div style={{
              background: 'linear-gradient(160deg, rgba(60,20,10,0.88) 0%, rgba(80,30,15,0.82) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 18,
              padding: isMobile ? '10px 8px' : '14px 10px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,120,0,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              minWidth: isMobile ? 44 : 52,
            }}>
              <Flame size={isMobile ? 18 : 22} color={ticks <= 1 ? '#E94930' : '#FFA000'} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 8 : 9, fontWeight: 800, fontFamily: 'var(--font-baloo)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Ticks
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                {Array.from({ length: 3 }, (_, i) => {
                  const tickLevel = 3 - i;
                  const active = ticks >= tickLevel;
                  const isCurrent = ticks === tickLevel;
                  return (
                    <motion.div
                      key={tickLevel}
                      animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{
                        width: isMobile ? 28 : 32, height: isMobile ? 8 : 10, borderRadius: 4,
                        background: active
                          ? tickLevel <= 1 ? 'linear-gradient(90deg, #E94930, #FF6B6B)'
                            : 'linear-gradient(90deg, #FF8F00, #FFB74D)'
                          : 'rgba(255,255,255,0.1)',
                        border: isCurrent ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                        boxShadow: active ? `0 0 8px ${tickLevel <= 1 ? 'rgba(233,73,48,0.5)' : 'rgba(255,143,0,0.5)'}` : 'none',
                        transition: 'background 0.3s, box-shadow 0.3s',
                      }}
                    />
                  );
                })}
              </div>
              <motion.span
                key={ticks}
                initial={{ scale: 1.4, color: ticks <= 1 ? '#E94930' : '#FFCC00' }}
                animate={{ scale: 1 }}
                style={{ color: ticks <= 1 ? '#E94930' : ticks <= 2 ? '#FFA000' : '#FFCC00', fontSize: isMobile ? 18 : 22, fontWeight: 900, fontFamily: 'var(--font-baloo)', lineHeight: 1 }}
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
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, maxWidth: 560, width: '92%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: isMobile ? 6 : 10 }}>
              <span style={{
                background: 'linear-gradient(135deg, #E94930, #EB5D70)',
                color: '#fff', padding: isMobile ? '4px 12px' : '6px 18px', borderRadius: 999,
                fontSize: isMobile ? 10 : 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(240,135,169,0.35)', fontFamily: 'var(--font-baloo)',
                whiteSpace: 'nowrap',
              }}>
                Pregunta {current}/{total}
              </span>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
              borderRadius: isMobile ? 18 : 26, padding: isMobile ? '12px 16px' : '18px 28px',
              border: '2px solid rgba(240,135,169,0.2)',
              boxShadow: '0 12px 40px rgba(30,42,58,0.18), 0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <p style={{ color: '#2A1E0E', fontSize: isMobile ? 14 : 18, fontWeight: 700, textAlign: 'center', margin: '0 0 16px', lineHeight: 1.35 }}>
                {question.statement}
              </p>
              <div style={{ display: 'flex', gap: isMobile ? 8 : 12 }}>
                <ABtn label="A" text={question.optionA} color="#E94930" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'A'} myCorrect={myResult} side="A" revealed={phase === 'roundResult'} actualCorrect={question.correctAnswer} isMobile={isMobile} />
                <ABtn label="B" text={question.optionB} color="#4CAF50" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'B'} myCorrect={myResult} side="B" revealed={phase === 'roundResult'} actualCorrect={question.correctAnswer} isMobile={isMobile} />
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
              <motion.div
                key="feedback-text"
                initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)', x: 0 }}
                animate={isIncorrectAnswer
                  ? { scale: [0.05, 1.25, 0.95, 1.05, 1], opacity: 1, filter: 'blur(0px)', x: [0, -10, 10, -7, 7, -4, 4, 0] }
                  : { scale: [0.05, 1.25, 0.95, 1.05, 1], opacity: 1, filter: 'blur(0px)', x: 0 }
                }
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }}
                style={{
                  position: 'absolute', zIndex: 60, left: '50%', top: '40%',
                  transform: 'translateX(-50%)',
                  fontSize: isMobile ? 48 : 90, fontWeight: 900,
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
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.95)',
                  border: '2px solid rgba(46,158,79,0.4)',
                  borderRadius: 16, padding: isMobile ? '10px 14px' : '14px 22px',
                  maxWidth: isMobile ? 300 : 420,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  pointerEvents: 'none',
                }}
              >
                <p style={{ margin: 0, fontSize: isMobile ? 12 : 15, fontWeight: 800, color: '#2E9E4F', fontFamily: 'var(--font-baloo)', lineHeight: 1.4 }}>
                  Respuesta correcta:
                </p>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#2A1E0E', fontFamily: 'var(--font-baloo)', lineHeight: 1.3 }}>
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

function ABtn({ label, text, color, disabled, selected, myCorrect, side, revealed, actualCorrect, isMobile }: {
  label: string; text: string; color: string; disabled: boolean; selected: boolean;
  myCorrect: boolean | undefined; side: 'A' | 'B'; revealed: boolean; actualCorrect: 'A' | 'B'; isMobile: boolean;
}) {
  const isActualCorrect = actualCorrect === side;
  const dimmed = revealed && !isActualCorrect;

  let bg = '#FFF7F2';
  let tx = '#4A3E32';
  let border = '2px solid rgba(0,0,0,0.06)';
  let circleBg = color;
  let circleTx = '#fff';
  let shake = false;
  let celebrate = false;

  if (selected) {
    if (myCorrect === true) { bg = '#D4EDDA'; tx = '#1B5E20'; border = '2px solid #4CAF50'; celebrate = true; circleBg = '#2E7D32'; }
    else if (myCorrect === false) { bg = '#FDE2E1'; tx = '#8B1A12'; border = '2px solid #E94930'; shake = true; circleBg = '#E94930'; }
    else { bg = color; tx = '#fff'; border = `2px solid ${color}`; circleBg = 'rgba(255,255,255,0.25)'; circleTx = '#fff'; }
  } else if (revealed && isActualCorrect) {
    bg = '#D4EDDA'; tx = '#1B5E20'; border = '2px solid #4CAF50'; circleBg = '#2E7D32';
  }

  return (
    <motion.button
      animate={shake ? { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.4 } } : { x: 0 }}
      whileHover={!disabled && !revealed ? { scale: 1.03, y: -2 } : {}}
      whileTap={!disabled && !revealed ? { scale: 0.97 } : {}}
      onClick={() => { if (!disabled && !revealed) useLavaStore.getState().setLocalAnswer(side); }}
      disabled={disabled}
      style={{
        flex: 1, padding: isMobile ? '10px 8px' : '14px 12px', borderRadius: 18,
        cursor: disabled && !selected ? 'default' : 'pointer',
        background: bg, color: tx, fontSize: isMobile ? 12 : 14, fontWeight: 700,
        border, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
        transition: 'background 0.2s, border-color 0.2s',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <span style={{
        width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: '50%', flexShrink: 0,
        background: circleBg, color: circleTx,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 16 : 20, fontWeight: 900, fontFamily: 'var(--font-baloo)',
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)',
      }}>
        {label}
      </span>
      <span style={{ lineHeight: 1.3 }}>{text}</span>
      {celebrate && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 'auto', fontSize: isMobile ? 20 : 24 }}>&#10003;</motion.span>}
      {shake && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 'auto', fontSize: isMobile ? 20 : 24 }}>&#10007;</motion.span>}
    </motion.button>
  );
}

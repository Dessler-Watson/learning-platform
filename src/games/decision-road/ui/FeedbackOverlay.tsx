'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

type Stage = 'idle' | 'impact' | 'text' | 'fly' | 'land' | 'done';

const ORBIT_STARS = [0, 60, 120, 180, 240, 300];
const TRAIL_DOTS = Array.from({ length: 12 }, (_, i) => i);

export function FeedbackOverlay() {
  const phase = useGameStore((s) => s.phase);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const questions = useGameStore((s) => s.questions);
  const streak = useGameStore((s) => s.streak);
  const isMobile = useIsMobile();

  const showCorrect = phase === 'correctFeedback';
  const showIncorrect = phase === 'incorrectFeedback';
  const question = questions[currentQuestionIndex];

  const correctAnswerText = question
    ? (question.correctAnswer === 'A' ? question.optionA : question.optionB)
    : null;

  const [stage, setStage] = useState<Stage>('idle');

  useEffect(() => {
    if (!showCorrect && !showIncorrect) { setStage('idle'); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage('impact'), 0));
    timers.push(setTimeout(() => setStage('text'), 120));
    timers.push(setTimeout(() => setStage('fly'), 1000));
    timers.push(setTimeout(() => setStage('land'), 2500));
    timers.push(setTimeout(() => setStage('done'), 2850));
    return () => timers.forEach(clearTimeout);
  }, [showCorrect, showIncorrect, currentQuestionIndex]);

  useEffect(() => {
    if (stage !== 'fly') return;
    const t = setTimeout(() => useGameStore.getState().triggerScoreCount(), 1200);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'done') return;
    const t = setTimeout(() => {
      const store = useGameStore.getState();
      const next = store.currentQuestionIndex + 1;
      if (next >= store.questions.length) { store.completeLevel(); store.setPhase('completed'); setTimeout(() => store.setPhase('results'), 800); }
      else { store.advanceQuestion(); store.setPhase('playing'); }
    }, 250);
    return () => clearTimeout(t);
  }, [stage]);

  const isCorrectFlow = showCorrect;
  const isIncorrectFlow = showIncorrect;

  return (
    <>
      {/* ===== RESPUESTA CORRECTA / INCORRECTA: texto grande + elemento vuela al contador ===== */}
      <AnimatePresence>
        {(isCorrectFlow || isIncorrectFlow) && (
          <>
            {/* (1) Flash de impacto */}
            {stage === 'impact' && (
              <motion.div
                key="flash"
                initial={{ opacity: 0.7, scale: 0.5 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  position: 'absolute', left: '50%', top: '45%',
                  width: 220, height: 220,
                  marginLeft: -110, marginTop: -110,
                  borderRadius: '50%',
                  background: isCorrectFlow
                    ? 'radial-gradient(circle, rgba(253,219,51,0.85) 0%, rgba(253,219,51,0.35) 40%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(233,73,48,0.85) 0%, rgba(233,73,48,0.35) 40%, transparent 70%)',
                  zIndex: 21, pointerEvents: 'none',
                }}
              />
            )}

            {/* (2) TEXTO: ¡CORRECTO! verde o ¡INCORRECTO! rojo */}
            {(stage === 'text' || stage === 'fly') && (
              <motion.div
                key={isCorrectFlow ? 'correcto-wrap' : 'incorrecto-wrap'}
                style={{ position: 'absolute', inset: 0, zIndex: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
              >
                {/* Glow detrás */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: stage === 'text' ? [0, 0.9, 0.6, 0] : 0, scale: stage === 'text' ? [0.5, 1.2, 1, 0.9] : 0.5 }}
                  transition={{ duration: 1.0 }}
                  style={{
                    position: 'absolute',
                    width: isMobile ? 200 : 360, height: isMobile ? 200 : 360, left: '50%', top: '50%',
                    marginLeft: isMobile ? -100 : -180, marginTop: isMobile ? -100 : -180,
                    borderRadius: '50%',
                    background: isCorrectFlow
                      ? 'radial-gradient(circle, rgba(46,158,79,0.35) 0%, rgba(46,158,79,0.1) 40%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(233,73,48,0.4) 0%, rgba(233,73,48,0.12) 40%, transparent 70%)',
                    filter: 'blur(8px)',
                  }}
                />

                {/* Estrellas orbitales */}
                {ORBIT_STARS.map((angle, i) => (
                  <motion.span
                    key={`orb-${i}`}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.2, 1, 0.4],
                      x: Math.cos((angle * Math.PI) / 180) * 180,
                      y: Math.sin((angle * Math.PI) / 180) * 80,
                    }}
                    transition={{ duration: 1.0, delay: 0.15 + i * 0.05, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', left: '50%', top: '46%',
                      marginLeft: -10, marginTop: -10,
                      fontSize: i % 2 === 0 ? 18 : 14,
                      color: isCorrectFlow
                        ? (i % 3 === 0 ? '#FDDB33' : '#6EE08A')
                        : (i % 3 === 0 ? '#E94930' : '#FCA5A5'),
                      filter: isCorrectFlow
                        ? 'drop-shadow(0 0 8px rgba(253,219,51,0.8))'
                        : 'drop-shadow(0 0 8px rgba(233,73,48,0.8))',
                    }}
                  >
                    {i % 2 === 0 ? '⭐' : '✦'}
                  </motion.span>
                ))}

                {/* Texto CORRECTO / INCORRECTO con rebote + shake */}
                {isCorrectFlow ? (
                  <motion.h1
                    initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)' }}
                    animate={{
                      scale: stage === 'text' ? [0.05, 1.25, 0.95, 1.05, 1] : [1, 1.05, 1],
                      opacity: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={stage === 'text' ? { duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' } : { duration: 0.3 }}
                    style={{
                      fontSize: isMobile ? 52 : 104, fontWeight: 900, color: '#2E9E4F',
                      fontFamily: 'var(--font-baloo)', margin: 0, lineHeight: 1,
                      textShadow: '0 0 24px rgba(110,224,138,0.8), 0 0 48px rgba(46,158,79,0.6), 0 6px 0 rgba(0,0,0,0.18)',
                      letterSpacing: '-2px',
                      zIndex: 2,
                    }}
                  >
                    ¡CORRECTO!
                  </motion.h1>
                ) : (
                  <motion.h1
                    initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)', x: 0 }}
                    animate={{
                      scale: stage === 'text' ? [0.05, 1.25, 0.95, 1.05, 1] : [1, 1.05, 1],
                      opacity: 1,
                      filter: 'blur(0px)',
                      x: stage === 'text' ? [0, -10, 10, -7, 7, -4, 4, 0] : 0,
                    }}
                    transition={stage === 'text' ? { scale: { duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }, x: { duration: 0.5 } } : { duration: 0.3 }}
                    style={{
                      fontSize: isMobile ? 52 : 104, fontWeight: 900, color: '#E94930',
                      fontFamily: 'var(--font-baloo)', margin: 0, lineHeight: 1,
                      textShadow: '0 0 24px rgba(233,73,48,0.8), 0 0 48px rgba(233,73,48,0.5), 0 6px 0 rgba(0,0,0,0.18)',
                      letterSpacing: '-2px',
                      zIndex: 2,
                    }}
                  >
                    ¡INCORRECTO!
                  </motion.h1>
                )}
              </motion.div>
            )}

            {/* (2b) Respuesta correcta cuando es incorrecto */}
            {isIncorrectFlow && correctAnswerText && (stage === 'fly' || stage === 'land' || stage === 'done') && (
              <motion.div
                key="correct-answer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute', zIndex: 23, left: '50%', top: '62%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.95)',
                  border: '2px solid rgba(46,158,79,0.4)',
                  borderRadius: 16,
                  padding: isMobile ? '10px 14px' : '14px 22px',
                  maxWidth: isMobile ? 300 : 420,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  pointerEvents: 'none',
                }}
              >
                <p style={{
                  margin: 0, fontSize: isMobile ? 12 : 15, fontWeight: 800, color: '#2E9E4F',
                  fontFamily: 'var(--font-baloo)', lineHeight: 1.4,
                }}>
                  Respuesta correcta:
                </p>
                <p style={{
                  margin: '4px 0 0', fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#2A1E0E',
                  fontFamily: 'var(--font-baloo)', lineHeight: 1.3,
                }}>
                  {correctAnswerText}
                </p>
              </motion.div>
            )}

            {/* (3) VIAJE: elemento volando hacia el contador */}
            {stage === 'fly' && (
              <>
                {isCorrectFlow ? (
                  <motion.div
                    key="fly-main"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                    animate={{
                      x: [0, -20, 80, 110],
                      y: [0, '15vh', '32vh', '38vh'],
                      opacity: [0, 1, 1, 1, 0],
                      scale: [0.3, 1.2, 0.95, 0.75],
                    }}
                    transition={{ duration: 1.5, times: [0, 0.25, 0.7, 1], ease: [0.45, 0.05, 0.25, 1] }}
                    style={{
                      position: 'absolute', zIndex: 26, left: '50%', top: '45%',
                      width: 'fit-content', margin: '0 auto',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, -8, 8, -4, 0], y: [0, -4, 0, -2, 0] }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <img src="/images/puntos.png" alt="" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'drop-shadow(0 0 16px rgba(253,219,51,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.7))' }} />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="fly-main-neg"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                    animate={{
                      x: [0, -20, 80, 110],
                      y: [0, '15vh', '32vh', '38vh'],
                      opacity: [0, 1, 1, 1, 0],
                      scale: [0.3, 1.2, 0.95, 0.75],
                    }}
                    transition={{ duration: 1.5, times: [0, 0.25, 0.7, 1], ease: [0.45, 0.05, 0.25, 1] }}
                    style={{
                      position: 'absolute', zIndex: 26, left: '50%', top: '45%',
                      width: 'fit-content', margin: '0 auto',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 8, -8, 4, 0], y: [0, -4, 0, -2, 0] }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span style={{
                        fontSize: 64, fontWeight: 900, color: '#E94930',
                        fontFamily: 'var(--font-baloo)', lineHeight: 1,
                        textShadow: '0 0 20px rgba(233,73,48,0.95), 0 0 8px rgba(255,255,255,0.5), 0 4px 0 rgba(0,0,0,0.2)',
                      }}>
                        ✗
                      </span>
                    </motion.div>
                  </motion.div>
                )}

                {/* Estela de partículas durante el viaje */}
                {TRAIL_DOTS.map((i) => (
                  <motion.span
                    key={`trail-${i}`}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
                    animate={{
                      x: [0, -10, 50, 70],
                      y: [0, '8vh', '18vh', '22vh'],
                      opacity: [0, 1, 0.8, 0],
                      scale: [0.8, 0.5, 0.3],
                    }}
                    transition={{ duration: 1.5, delay: 0.1 + i * 0.07, ease: [0.45, 0.05, 0.25, 1] }}
                    style={{
                      position: 'absolute', zIndex: 25, left: '50%', top: '45%',
                      marginLeft: -3, marginTop: -3,
                      width: 6, height: 6, borderRadius: '50%',
                      background: isCorrectFlow
                        ? 'radial-gradient(circle, #FDF293 0%, #FDDB33 60%, transparent 100%)'
                        : 'radial-gradient(circle, #FCA5A5 0%, #E94930 60%, transparent 100%)',
                      boxShadow: isCorrectFlow
                        ? '0 0 10px rgba(253,219,51,0.9)'
                        : '0 0 10px rgba(233,73,48,0.9)',
                    }}
                  />
                ))}
              </>
            )}

            {/* (4) Flash en el HUD al aterrizar */}
            {stage === 'land' && (
              <motion.div
                key="land-flash"
                initial={{ opacity: 0.85, scale: 0.4 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute', zIndex: 24, left: '62%', bottom: 26,
                  width: 110, height: 110, marginLeft: -55,
                  borderRadius: '50%',
                  background: isCorrectFlow
                    ? 'radial-gradient(circle, rgba(253,219,51,0.9) 0%, rgba(253,219,51,0.35) 45%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(233,73,48,0.9) 0%, rgba(233,73,48,0.35) 45%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Check, X } from 'lucide-react';
import { getTargetCenter, hudTargets } from '@/shared/refs/hudRefs';

type Stage = 'idle' | 'impact' | 'text' | 'fly' | 'land' | 'done';

const ORBIT_STARS = [0, 60, 120, 180, 240, 300];

function calcFlyDelta(
  target: { x: number; y: number } | null,
  startPct: { x: string; y: string },
  viewW: number,
  viewH: number,
): { dx: number; dy: number } {
  if (!target) return { dx: 0, dy: 0 };
  const sx = (parseFloat(startPct.x) / 100) * viewW;
  const sy = (parseFloat(startPct.y) / 100) * viewH;
  return { dx: target.x - sx, dy: target.y - sy };
}

export function FeedbackOverlay() {
  const phase = useGameStore((s) => s.phase);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const questions = useGameStore((s) => s.questions);
  const isMobile = useIsMobile();

  const showCorrect = phase === 'correctFeedback';
  const showIncorrect = phase === 'incorrectFeedback';
  const question = questions[currentQuestionIndex];

  const correctAnswerText = question
    ? (question.correctAnswer === 'A' ? question.optionA : question.optionB)
    : null;

  const isPractice = typeof window !== 'undefined' ? !!sessionStorage.getItem('eduplay_practice') : false;

  const [stage, setStage] = useState<Stage>('idle');
  const [flyTargets, setFlyTargets] = useState<{ check: { x: number; y: number } | null; cross: { x: number; y: number } | null; star: { x: number; y: number } | null }>({ check: null, cross: null, star: null });

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
    const check = getTargetCenter(hudTargets.checkRef);
    const cross = getTargetCenter(hudTargets.crossRef);
    const star = getTargetCenter(hudTargets.starRef);
    setFlyTargets({ check, cross, star });
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

  const viewW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 768;

  const checkDelta = calcFlyDelta(flyTargets.check, { x: '50', y: '45' }, viewW, viewH);
  const crossDelta = calcFlyDelta(flyTargets.cross, { x: '50', y: '45' }, viewW, viewH);
  const starDelta = calcFlyDelta(flyTargets.star, { x: '50', y: '45' }, viewW, viewH);

  const starTargetScreen = flyTargets.star;

  return (
    <>
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
                  width: 220, height: 220, marginLeft: -110, marginTop: -110,
                  borderRadius: '50%',
                  background: isCorrectFlow
                    ? 'radial-gradient(circle, rgba(253,219,51,0.85) 0%, rgba(253,219,51,0.35) 40%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(233,73,48,0.85) 0%, rgba(233,73,48,0.35) 40%, transparent 70%)',
                  zIndex: 21, pointerEvents: 'none',
                }}
              />
            )}

            {/* (2) TEXTO: ¡CORRECTO! o ¡INCORRECTO! */}
            {(stage === 'text' || stage === 'fly') && (
              <motion.div
                key={isCorrectFlow ? 'correcto-wrap' : 'incorrecto-wrap'}
                style={{ position: 'absolute', inset: 0, zIndex: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
              >
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

                {isCorrectFlow ? (
                  <motion.h1
                    initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)' }}
                    animate={{
                      scale: stage === 'text' ? [0.05, 1.25, 0.95, 1.05, 1] : [1, 1.05, 1],
                      opacity: 1, filter: 'blur(0px)',
                    }}
                    transition={stage === 'text' ? { duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' } : { duration: 0.3 }}
                    style={{
                      fontSize: isMobile ? 52 : 104, fontWeight: 900, color: '#2E9E4F',
                      fontFamily: 'var(--font-baloo)', margin: 0, lineHeight: 1,
                      textShadow: '0 0 24px rgba(110,224,138,0.8), 0 0 48px rgba(46,158,79,0.6), 0 6px 0 rgba(0,0,0,0.18)',
                      letterSpacing: '-2px', zIndex: 2,
                    }}
                  >
                    ¡CORRECTO!
                  </motion.h1>
                ) : (
                  <motion.h1
                    initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)', x: 0 }}
                    animate={{
                      scale: stage === 'text' ? [0.05, 1.25, 0.95, 1.05, 1] : [1, 1.05, 1],
                      opacity: 1, filter: 'blur(0px)',
                      x: stage === 'text' ? [0, -10, 10, -7, 7, -4, 4, 0] : 0,
                    }}
                    transition={stage === 'text' ? { scale: { duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }, x: { duration: 0.5 } } : { duration: 0.3 }}
                    style={{
                      fontSize: isMobile ? 52 : 104, fontWeight: 900, color: '#E94930',
                      fontFamily: 'var(--font-baloo)', margin: 0, lineHeight: 1,
                      textShadow: '0 0 24px rgba(233,73,48,0.8), 0 0 48px rgba(233,73,48,0.5), 0 6px 0 rgba(0,0,0,0.18)',
                      letterSpacing: '-2px', zIndex: 2,
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
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(76,175,80,0.35)',
                    borderRadius: 20,
                    padding: isMobile ? '12px 18px' : '16px 26px',
                    maxWidth: isMobile ? 320 : 440,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                    pointerEvents: 'none',
                  }}
              >
                <p style={{ margin: 0, fontSize: isMobile ? 13 : 16, fontWeight: 800, color: '#2E9E4F', fontFamily: 'var(--font-baloo)', lineHeight: 1.4 }}>
                  Respuesta correcta:
                </p>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? 14 : 17, fontWeight: 700, color: '#1a1a2e', fontFamily: 'var(--font-baloo)', lineHeight: 1.3 }}>
                  {correctAnswerText}
                </p>
              </motion.div>
            )}

            {/* (3) VIAJE: elementos volando hacia el HUD */}
            {stage === 'fly' && (
              <>
                {/* ✓ vuela al HUD (correcta) */}
                {isCorrectFlow && (
                  <motion.div
                    key="fly-check"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{
                      x: [0, checkDelta.dx * 0.3, checkDelta.dx],
                      y: [0, checkDelta.dy * 0.4, checkDelta.dy],
                      opacity: [0, 1, 1, 1, 0],
                      scale: [0.4, 1.1, 0.7],
                    }}
                    transition={{ duration: 1.4, times: [0, 0.2, 0.7, 1], ease: [0.33, 0, 0.2, 1] }}
                    style={{
                      position: 'absolute', zIndex: 28, left: '50%', top: '45%',
                      marginLeft: -14, marginTop: -14,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{
                      width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: 999,
                      background: 'rgba(46,158,79,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(46,158,79,0.8), 0 0 8px rgba(255,255,255,0.5)',
                    }}>
                      <Check size={isMobile ? 18 : 24} color="#4CAF50" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}

                {/* ★ estrella vuela al HUD (solo modo sala, correcta) */}
                {isCorrectFlow && !isPractice && (
                  <motion.div
                    key="fly-star"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                    animate={{
                      x: [0, starDelta.dx * 0.3, starDelta.dx],
                      y: [0, starDelta.dy * 0.4, starDelta.dy],
                      opacity: [0, 1, 1, 1, 0],
                      scale: [0.3, 1.2, 0.6],
                      rotate: [0, -12, 0],
                    }}
                    transition={{ duration: 1.5, times: [0, 0.2, 0.7, 1], ease: [0.33, 0, 0.2, 1] }}
                    style={{
                      position: 'absolute', zIndex: 26, left: '50%', top: '45%',
                      marginLeft: -18, marginTop: -18,
                      pointerEvents: 'none',
                    }}
                  >
                    <img src="/images/puntos.png" alt="" style={{
                      width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, objectFit: 'contain',
                      filter: 'drop-shadow(0 0 16px rgba(253,219,51,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.7))',
                    }} />
                  </motion.div>
                )}

                {/* ✗ vuela al HUD (incorrecta) */}
                {isIncorrectFlow && (
                  <motion.div
                    key="fly-cross"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{
                      x: [0, crossDelta.dx * 0.3, crossDelta.dx],
                      y: [0, crossDelta.dy * 0.4, crossDelta.dy],
                      opacity: [0, 1, 1, 1, 0],
                      scale: [0.4, 1.1, 0.7],
                    }}
                    transition={{ duration: 1.4, times: [0, 0.2, 0.7, 1], ease: [0.33, 0, 0.2, 1] }}
                    style={{
                      position: 'absolute', zIndex: 28, left: '50%', top: '45%',
                      marginLeft: -14, marginTop: -14,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{
                      width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: 999,
                      background: 'rgba(233,73,48,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(233,73,48,0.8), 0 0 8px rgba(255,255,255,0.5)',
                    }}>
                      <X size={isMobile ? 18 : 24} color="#E94930" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}

                {/* ★ estrella flota hacia arriba desde el HUD y desaparece (solo modo sala, incorrecta) */}
                {isIncorrectFlow && !isPractice && starTargetScreen && (
                  <motion.div
                    key="star-loss"
                    initial={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    animate={{
                      y: [0, -30, -70, -120],
                      opacity: [1, 1, 0.6, 0],
                      scale: [1, 0.9, 0.6, 0.3],
                      x: [0, 6, -4, 2],
                    }}
                    transition={{ duration: 1.6, times: [0, 0.25, 0.6, 1], ease: [0.25, 0.1, 0.25, 1] }}
                    style={{
                      position: 'absolute', zIndex: 27,
                      left: starTargetScreen.x, top: starTargetScreen.y,
                      marginLeft: -12, marginTop: -12,
                      pointerEvents: 'none',
                    }}
                  >
                    <img src="/images/puntos.png" alt="" style={{
                      width: isMobile ? 18 : 24, height: isMobile ? 18 : 24, objectFit: 'contain',
                      filter: 'drop-shadow(0 0 10px rgba(233,73,48,0.8))',
                    }} />
                  </motion.div>
                )}

                {/* Estela de partículas */}
                {Array.from({ length: 8 }, (_, i) => {
                  const target = isCorrectFlow ? checkDelta : crossDelta;
                  return (
                    <motion.span
                      key={`trail-${i}`}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
                      animate={{
                        x: [0, target.dx * 0.2, target.dx * 0.6],
                        y: [0, target.dy * 0.3, target.dy * 0.7],
                        opacity: [0, 0.7, 0],
                        scale: [0.7, 0.4, 0.15],
                      }}
                      transition={{ duration: 1.3, delay: 0.08 + i * 0.09, ease: [0.33, 0, 0.2, 1] }}
                      style={{
                        position: 'absolute', zIndex: 25, left: '50%', top: '45%',
                        marginLeft: -3, marginTop: -3,
                        width: 5, height: 5, borderRadius: '50%',
                        background: isCorrectFlow
                          ? 'radial-gradient(circle, #FDF293 0%, #FDDB33 60%, transparent 100%)'
                          : 'radial-gradient(circle, #FCA5A5 0%, #E94930 60%, transparent 100%)',
                        boxShadow: isCorrectFlow
                          ? '0 0 8px rgba(253,219,51,0.9)'
                          : '0 0 8px rgba(233,73,48,0.9)',
                      }}
                    />
                  );
                })}
              </>
            )}

            {/* (4) Flash en el HUD al aterrizar */}
            {stage === 'land' && (
              <>
                {isCorrectFlow && flyTargets.check && (
                  <motion.div
                    key="land-flash-check"
                    initial={{ opacity: 0.9, scale: 0.3 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', zIndex: 24,
                      left: flyTargets.check.x, top: flyTargets.check.y,
                      width: 50, height: 50, marginLeft: -25, marginTop: -25,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(76,175,80,0.9) 0%, rgba(76,175,80,0.3) 45%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {isCorrectFlow && !isPractice && flyTargets.star && (
                  <motion.div
                    key="land-flash-star"
                    initial={{ opacity: 0.9, scale: 0.3 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', zIndex: 24,
                      left: flyTargets.star.x, top: flyTargets.star.y,
                      width: 50, height: 50, marginLeft: -25, marginTop: -25,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(253,219,51,0.9) 0%, rgba(253,219,51,0.3) 45%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {isIncorrectFlow && flyTargets.cross && (
                  <motion.div
                    key="land-flash-cross"
                    initial={{ opacity: 0.9, scale: 0.3 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', zIndex: 24,
                      left: flyTargets.cross.x, top: flyTargets.cross.y,
                      width: 50, height: 50, marginLeft: -25, marginTop: -25,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(233,73,48,0.9) 0%, rgba(233,73,48,0.3) 45%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

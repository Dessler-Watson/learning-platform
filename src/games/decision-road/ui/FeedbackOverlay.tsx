'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, PENALTY } from '@/stores/game.store';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { DECISION_ROAD_CONFIG as CFG } from '@/games/decision-road/config';

type Stage = 'idle' | 'impact' | 'text' | 'fly' | 'land' | 'modal' | 'done';

const ORBIT_STARS = [0, 60, 120, 180, 240, 300];
const TRAIL_DOTS = Array.from({ length: 12 }, (_, i) => i);

export function FeedbackOverlay() {
  const phase = useGameStore((s) => s.phase);
  const explanation = useGameStore((s) => s.explanation);
  const retryCount = useGameStore((s) => s.retryCount);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const questions = useGameStore((s) => s.questions);
  const streak = useGameStore((s) => s.streak);
  const prevScore = useGameStore((s) => s.prevScore);

  const showCorrect = phase === 'correctFeedback';
  const showIncorrect = phase === 'incorrectFeedback' && !!explanation;
  const maxRetriesReached = retryCount >= CFG.maxRetries;
  const question = questions[currentQuestionIndex];

  const pointsEarned = 25 + Math.floor(streak * 5);
  const didDeduct = showIncorrect && prevScore > PENALTY;

  const [stage, setStage] = useState<Stage>('idle');

  useEffect(() => {
    if (!showCorrect && !showIncorrect) { setStage('idle'); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage('impact'), 0));
    timers.push(setTimeout(() => setStage('text'), 120));
    if (showIncorrect && !didDeduct) {
      // Sin deducción: saltar directo al modal tras mostrar el texto.
      timers.push(setTimeout(() => setStage('modal'), 1100));
    } else {
      timers.push(setTimeout(() => setStage('fly'), 1000));
      timers.push(setTimeout(() => setStage('land'), 2500));
      if (showCorrect) {
        timers.push(setTimeout(() => setStage('done'), 2850));
      } else {
        timers.push(setTimeout(() => setStage('modal'), 2900));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [showCorrect, showIncorrect, currentQuestionIndex, didDeduct]);

  // Cuando el elemento llega al contador, dispara el conteo animado.
  useEffect(() => {
    if (stage !== 'fly') return;
    const t = setTimeout(() => useGameStore.getState().triggerScoreCount(), 1200);
    return () => clearTimeout(t);
  }, [stage]);

  // Auto-avance al completar (correct o retry confirmado).
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

  const handleRetry = () => {
    const store = useGameStore.getState();
    const idx = maxRetriesReached ? store.currentQuestionIndex + 1 : store.currentQuestionIndex;
    const rb = characterRigidBody.current;
    if (rb) {
      const doorZ = 12 - idx * 25;
      rb.setTranslation({ x: 0, y: 2, z: doorZ + 8 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    if (maxRetriesReached) { store.resetRetry(); store.advanceQuestion(); store.setPhase('playing'); }
    else { store.resetRetry(); store.setExplanation(null); store.setPhase('playing'); }
  };

  const correctAnswer = question && maxRetriesReached ? (question.correctAnswer === 'A' ? question.optionA : question.optionB) : null;

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
                style={{ position: 'absolute', inset: 0, zIndex: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
              >
                {/* Glow detrás */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: stage === 'text' ? [0, 0.9, 0.6, 0] : 0, scale: stage === 'text' ? [0.5, 1.2, 1, 0.9] : 0.5 }}
                  transition={{ duration: 1.0 }}
                  style={{
                    position: 'absolute',
                    width: 360, height: 360, left: '50%', top: '50%',
                    marginLeft: -180, marginTop: -180,
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
                      fontSize: 104, fontWeight: 900, color: '#2E9E4F',
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
                      fontSize: 104, fontWeight: 900, color: '#E94930',
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
                ) : didDeduct ? (
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
                        −{PENALTY}
                      </span>
                    </motion.div>
                  </motion.div>
                ) : null}

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

      {/* ===== MODAL INCORRECTO: explicación + botón de reintentar/continuar ===== */}
      <AnimatePresence>
        {isIncorrectFlow && stage === 'modal' && explanation && (
          <motion.div
            key="incorrect-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, zIndex: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,10,8,0.55)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{ background: 'rgba(255,255,255,0.97)', border: '2px solid rgba(233,73,48,0.4)', borderRadius: 28, padding: '26px 26px 22px', maxWidth: 440, width: '88%', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
            >
              {maxRetriesReached && correctAnswer && (
                <div style={{ background: 'rgba(253,219,51,0.18)', border: '1px solid rgba(253,219,51,0.4)', borderRadius: 14, padding: '12px 16px', margin: '14px 0', color: '#B7791F', fontSize: 15, fontWeight: 800 }}>
                  ✅ {correctAnswer}
                </div>
              )}

              <p style={{ color: '#4A5770', fontSize: 14, lineHeight: 1.6, margin: '0 0 18px' }}>{explanation}</p>

              {!maxRetriesReached && (
                <p style={{ color: '#A0ADC4', fontSize: 11, marginBottom: 14 }}>Intento {retryCount} de {CFG.maxRetries}</p>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                style={{
                  width: '100%', padding: '16px', borderRadius: 18, border: 'none',
                  background: 'linear-gradient(135deg, #F087A9, #D96B91)',
                  color: '#fff', fontSize: 17, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(240,135,169,0.35)', fontFamily: 'var(--font-baloo)',
                }}
              >
                {maxRetriesReached ? 'Continuar ▶' : 'Intentar nuevamente'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

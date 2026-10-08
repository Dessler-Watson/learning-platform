'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/game.store';
import { getChaosTiming } from '@/lib/chaos/timing';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { gameAudio } from '@/shared/lib/gameAudio';
import { localSurvivalDeath } from '@/lib/chaos/survival';

type Stage = 'idle' | 'impact' | 'text' | 'fly' | 'land' | 'done';

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

  const [stage, setStage] = useState<Stage>('idle');

  useEffect(() => {
    if (!showCorrect && !showIncorrect) { setStage('idle'); return; }
    // 'ritmo_expres' (Caos): la timeline de feedback completa va a ×0.6; sin
    // el modificador, las MISMAS duraciones de siempre. Los modificadores ya
    // están en el store (boot de la partida), sin fetch.
    const mods = useGameStore.getState().modifiers;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage('impact'), 0));
    timers.push(setTimeout(() => setStage('text'), getChaosTiming(120, mods)));
    timers.push(setTimeout(() => setStage('fly'), getChaosTiming(1000, mods)));
    timers.push(setTimeout(() => setStage('land'), getChaosTiming(2500, mods)));
    timers.push(setTimeout(() => setStage('done'), getChaosTiming(2850, mods)));
    return () => timers.forEach(clearTimeout);
  }, [showCorrect, showIncorrect, currentQuestionIndex]);

  useEffect(() => {
    if (stage !== 'fly') return;
    const t = setTimeout(
      () => useGameStore.getState().triggerScoreCount(),
      getChaosTiming(1200, useGameStore.getState().modifiers)
    );
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'done') return;
    const t = setTimeout(() => {
      const store = useGameStore.getState();
      // Carrera con finalización de sala: si la fase cambió (→ 'results'),
      // no se avanza ni se cruza la meta; los Resultados ya están en pantalla.
      if (store.phase !== 'correctFeedback' && store.phase !== 'incorrectFeedback') return;
      // Grupo 3 (supervivencia): el feedback de la respuesta YA se mostró;
      // si esta respuesta eliminó al jugador (instakill /3ª vida /2º error de
      // ultima_oportunidad, con escudo del primer error) se entra al flujo de
      // derrota en vez de avanzar a la siguiente pregunta.
      const totalErr = store.answers.reduce((n, a) => (a.correct ? n : n + 1), 0);
      const death = store.defeated || localSurvivalDeath(store.modifiers, totalErr, store.answers[store.answers.length - 1]?.correct ?? true);
      if (death) {
        store.enterDefeat();
        return;
      }
      const next = store.currentQuestionIndex + 1;
      if (next >= store.questions.length) { gameAudio.decisionVictory(); store.setPhase('finishing'); }
      else { gameAudio.decisionAdvance(); store.advanceQuestion(); store.setPhase('playing'); }
    }, getChaosTiming(250, useGameStore.getState().modifiers));
    return () => clearTimeout(t);
  }, [stage]);

  const isCorrectFlow = showCorrect;
  const isIncorrectFlow = showIncorrect;

  return (
    <>
      <AnimatePresence>
        {(isCorrectFlow || isIncorrectFlow) && (
          <>
            {/* TEXTO: ¡CORRECTO! o ¡INCORRECTO! */}
            {(stage === 'text' || stage === 'fly' || stage === 'land' || stage === 'done') && (
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
                  }}
                />

                {isCorrectFlow ? (
                  <motion.h1
                    initial={{ scale: 0.05, opacity: 0 }}
                    animate={{
                      scale: stage === 'text' ? [0.05, 1.25, 0.95, 1.05, 1] : [1, 1.05, 1],
                      opacity: 1,
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
                    initial={{ scale: 0.05, opacity: 0, x: 0 }}
                    animate={{
                      scale: stage === 'text' ? [0.05, 1.25, 0.95, 1.05, 1] : [1, 1.05, 1],
                      opacity: 1,
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

            {/* Respuesta correcta cuando es incorrecto */}
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}

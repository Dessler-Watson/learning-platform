'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAbismosStore } from '@/stores/abismos.store';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { gameAudio } from '@/shared/lib/gameAudio';

function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef(target);
  const startTimeRef = useRef(0);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startRef.current + (target - startRef.current) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [target, duration]);

  return display;
}

function useIsPractice() {
  const [isPractice, setIsPractice] = useState(false);
  useEffect(() => {
    setIsPractice(!!sessionStorage.getItem('eduplay_practice'));
  }, []);
  return isPractice;
}

type FeedbackStage = 'idle' | 'text' | 'done';

/** Entre Abismos: picos montañosos tenues abajo + cristal púrpura arriba. */
const SubtlePeakSVG = ({ flip = false }: { flip?: boolean }) => (
  <svg
    width="56"
    height="40"
    viewBox="0 0 56 40"
    fill="none"
    aria-hidden
    style={{
      position: 'absolute',
      bottom: -2,
      left: flip ? undefined : -6,
      right: flip ? -6 : undefined,
      opacity: 0.28,
      pointerEvents: 'none',
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  >
    <path d="M2 38 L18 8 L28 22 L36 12 L54 38 Z" fill="#6b7c94" />
    <path d="M18 8 L22 16 L14 18 Z" fill="#d8e4f0" />
    <path d="M36 12 L39 18 L33 19 Z" fill="#c5d4e6" />
  </svg>
);

const CrystalSparkSVG = ({ flip = false }: { flip?: boolean }) => (
  <svg
    width="28"
    height="36"
    viewBox="0 0 28 36"
    fill="none"
    aria-hidden
    style={{
      position: 'absolute',
      top: 6,
      left: flip ? undefined : 8,
      right: flip ? 8 : undefined,
      opacity: 0.32,
      pointerEvents: 'none',
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  >
    <path d="M14 2 L22 14 L14 34 L6 14 Z" fill="#a78bfa" />
    <path d="M14 2 L18 14 L14 34 Z" fill="#c4b5fd" opacity="0.7" />
    <path d="M14 6 L16 14 L14 20 L12 14 Z" fill="#ede9fe" opacity="0.55" />
  </svg>
);

export function AbismosHUD() {
  const phase = useAbismosStore((s) => s.phase);
  const questions = useAbismosStore((s) => s.questions);
  const currentQuestionIndex = useAbismosStore((s) => s.currentQuestionIndex);
  const correctCount = useAbismosStore((s) => s.correctCount);
  const incorrectCount = useAbismosStore((s) => s.incorrectCount);
  const score = useAbismosStore((s) => s.score);
  const platforms = useAbismosStore((s) => s.platforms);
  const selectedPlatform = useAbismosStore((s) => s.selectedPlatform);
  const submitAnswer = useAbismosStore((s) => s.submitAnswer);

  const isPractice = useIsPractice();
  const animatedScore = useAnimatedNumber(score);
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const showQuestion = phase === 'questions' && currentQuestion;
  const showFeedback = phase === 'correctFeedback' || phase === 'incorrectFeedback';

  const [feedbackStage, setFeedbackStage] = useState<FeedbackStage>('idle');
  const isCorrectFeedback = phase === 'correctFeedback';

  useEffect(() => {
    if (!showFeedback) { setFeedbackStage('idle'); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      setFeedbackStage('text');
      if (isCorrectFeedback) gameAudio.decisionCorrect();
      else gameAudio.decisionIncorrect();
    }, 0));
    timers.push(setTimeout(() => setFeedbackStage('done'), 1800));
    return () => timers.forEach(clearTimeout);
  }, [showFeedback, currentQuestionIndex]);

  const handleAnswer = (choice: 'A' | 'B') => {
    if (selectedPlatform !== null) return;
    gameAudio.decisionSelect();
    void submitAnswer(choice);
  };

  if (phase === 'loading' || phase === 'completed' || phase === 'defeat' || phase === 'results') return null;

  return (
    <>
      {/* === QUESTION PANEL (top center, interactive) === */}
      <AnimatePresence>
        {showQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              maxWidth: 520,
              width: '90%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 8 }}>
              <span style={{
                background: 'linear-gradient(135deg, #1a2a4a 0%, #0f1a30 100%)',
                color: 'rgba(255,255,255,0.92)',
                padding: '5px 20px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(100,180,255,0.12)',
                border: '1px solid rgba(80,140,220,0.22)',
                fontFamily: 'var(--font-baloo)',
                whiteSpace: 'nowrap',
              }}>
                Pregunta {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            </div>

            <div style={{
              position: 'relative',
              background: 'linear-gradient(160deg, rgba(15,25,50,0.94) 0%, rgba(10,18,35,0.96) 100%)',
              backdropFilter: 'blur(24px)',
              borderRadius: 20,
              padding: '18px 24px',
              border: '1px solid rgba(80,140,220,0.15)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(100,180,255,0.06)',
              overflow: 'hidden',
            }}>
              <CrystalSparkSVG />
              <CrystalSparkSVG flip />
              <SubtlePeakSVG />
              <SubtlePeakSVG flip />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(140,110,220,0.07) 0%, transparent 40%, rgba(80,100,150,0.06) 100%)',
                pointerEvents: 'none',
              }} />

              <p style={{
                position: 'relative',
                zIndex: 1,
                color: 'rgba(255,255,255,0.95)',
                fontSize: 16,
                fontWeight: 700,
                textAlign: 'center',
                margin: '0 0 14px',
                lineHeight: 1.4,
                fontFamily: 'var(--font-baloo)',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {currentQuestion.statement}
              </p>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12 }}>
                <AnswerCard
                  label="A"
                  text={currentQuestion.optionA}
                  color="#E53935"
                  onClick={() => handleAnswer('A')}
                  disabled={selectedPlatform !== null}
                  selected={selectedPlatform === 'A'}
                />
                <AnswerCard
                  label="B"
                  text={currentQuestion.optionB}
                  color="#42A5F5"
                  onClick={() => handleAnswer('B')}
                  disabled={selectedPlatform !== null}
                  selected={selectedPlatform === 'B'}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === FEEDBACK OVERLAY === */}
      <AnimatePresence>
        {showFeedback && feedbackStage !== 'idle' && (
          <div style={{ position: 'fixed', zIndex: 60, left: '50%', top: '35%', transform: 'translateX(-50%)' }}>
            <motion.div
              key="feedback-text"
              initial={{ scale: 0.05, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: [0.05, 1.25, 0.95, 1.05, 1], opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.85, times: [0, 0.4, 0.6, 0.8, 1], ease: 'easeOut' }}
              style={{
                fontSize: 60,
                fontWeight: 900,
                fontFamily: 'var(--font-baloo)',
                lineHeight: 1,
                letterSpacing: '-2px',
                whiteSpace: 'nowrap',
                textAlign: 'center',
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'var(--font-baloo)',
                color: isCorrectFeedback ? '#4CAF50' : '#EF5350',
                marginTop: 4,
              }}
            >
              {isCorrectFeedback ? '+1 plataforma' : '-1 plataforma'}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === PLATFORM COUNTER (center-left, like TICKS) === */}
      <PlatformCounter platforms={platforms} maxPlatforms={CFG.maxPlatforms} phase={phase} />

      {/* === HUD BAR (bottom center) === */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: 'linear-gradient(160deg, rgba(18,28,48,0.92) 0%, rgba(12,20,38,0.88) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 999,
            padding: '8px 22px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(80,120,180,0.2)',
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
              fontWeight: 900,
              fontFamily: 'var(--font-baloo)',
              whiteSpace: 'nowrap',
              minWidth: 48,
              textAlign: 'center',
            }}>
              {phase === 'freeMove' || phase === 'crossing' ? '¡Cruza!' : `${currentQuestionIndex + 1}/${totalQuestions}`}
            </span>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(76,175,80,0.2)',
                border: '2px solid #4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ color: '#4CAF50', fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{correctCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(244,67,54,0.2)',
                border: '2px solid #F44336',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="3.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <span style={{ color: '#F44336', fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-baloo)' }}>{incorrectCount}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function RockIcon({ filled }: { filled: boolean }) {
  const fill = filled ? 'url(#rockGrad)' : 'rgba(255,255,255,0.05)';
  const stroke = filled ? '#8a7a5c' : 'rgba(255,255,255,0.12)';
  return (
    <svg width="24" height="24" viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="rockGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4c4a0" />
          <stop offset="55%" stopColor="#b8a882" />
          <stop offset="100%" stopColor="#8a7a5c" />
        </linearGradient>
      </defs>
      <path
        d="M8 14 L14 7 L26 6 L34 13 L33 26 L27 34 L14 35 L7 27 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={filled ? 2 : 1.5}
        strokeLinejoin="round"
      />
      {filled && (
        <>
          <path d="M14 7 L18 16 L8 14" fill="rgba(255,255,255,0.18)" />
          <path d="M18 16 L33 26 L34 13" fill="rgba(0,0,0,0.12)" />
          <path d="M18 16 L14 35" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" fill="none" />
          <path d="M22 20 L26 18 M24 28 L28 26" stroke="rgba(70,55,35,0.35)" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function PlatformCounter({ platforms, maxPlatforms, phase }: {
  platforms: number;
  maxPlatforms: number;
  phase: string;
}) {
  if (phase === 'loading' || phase === 'completed' || phase === 'defeat' || phase === 'results') return null;

  const slots = Array.from({ length: maxPlatforms }, (_, i) => i < platforms);

  return (
    <div style={{
      position: 'fixed',
      left: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.2 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(165deg, rgba(48,42,32,0.94) 0%, rgba(28,24,18,0.9) 55%, rgba(20,17,12,0.92) 100%)',
          backdropFilter: 'blur(16px)',
          borderRadius: 18,
          padding: '16px 14px 12px',
          boxShadow: '0 14px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,230,180,0.08), inset 0 -2px 0 rgba(0,0,0,0.35)',
          border: '1px solid rgba(180,150,100,0.22)',
          minWidth: 58,
        }}
      >
        <span style={{
          color: 'rgba(232,210,170,0.72)',
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          fontFamily: 'var(--font-baloo)',
        }}>
          Rocas
        </span>

        <div style={{
          width: 34,
          height: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, transparent, rgba(200,170,110,0.45), transparent)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {slots.map((filled, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: filled ? 1 : 0.78,
                opacity: filled ? 1 : 0.35,
                rotate: filled ? 0 : -8,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: filled
                  ? 'radial-gradient(circle at 35% 30%, rgba(255,230,180,0.18), rgba(0,0,0,0.25))'
                  : 'rgba(255,255,255,0.03)',
                border: filled
                  ? '1px solid rgba(200,170,110,0.35)'
                  : '1px dashed rgba(255,255,255,0.08)',
                boxShadow: filled
                  ? '0 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,240,200,0.15)'
                  : 'inset 0 1px 3px rgba(0,0,0,0.25)',
              }}
            >
              <RockIcon filled={filled} />
            </motion.div>
          ))}
        </div>

        <div style={{
          marginTop: 2,
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'var(--font-baloo)',
          color: platforms >= maxPlatforms ? '#FFD54F' : '#E8C87A',
          textShadow: platforms >= maxPlatforms
            ? '0 0 12px rgba(255,213,79,0.5)'
            : '0 0 8px rgba(232,200,122,0.3)',
        }}>
          {platforms}
        </div>
      </motion.div>
    </div>
  );
}

function AnswerCard({ label, text, color, onClick, disabled, selected }: {
  label: string;
  text: string;
  color: string;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        flex: 1,
        padding: '12px 10px',
        borderRadius: 14,
        background: selected ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `2px solid ${selected ? color : `${color}44`}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !selected ? 0.5 : 1,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.15s ease',
        outline: 'none',
        boxShadow: selected ? `0 0 12px ${color}33` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <span style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        flexShrink: 0,
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 900,
        fontFamily: 'var(--font-baloo)',
        boxShadow: `0 2px 8px ${color}55, inset 0 -2px 0 rgba(0,0,0,0.18)`,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 1.4,
        fontFamily: 'var(--font-baloo)',
        textAlign: 'left',
      }}>
        {text}
      </span>
    </button>
  );
}

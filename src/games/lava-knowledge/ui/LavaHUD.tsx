'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';

const PLAYER_COLORS = ['#E94930', '#EB5D70', '#FDDB33', '#4CAF50'];

export function LavaHUD() {
  const phase = useLavaStore((s) => s.phase);
  const questions = useLavaStore((s) => s.questions);
  const qIndex = useLavaStore((s) => s.currentQuestionIndex);
  const timer = useLavaStore((s) => s.timer);
  const localAnswer = useLavaStore((s) => s.localAnswer);
  const players = useLavaStore((s) => s.players);
  const roundResults = useLavaStore((s) => s.roundResults);
  const question = questions[qIndex];
  const show = phase === 'roundActive' || phase === 'roundResult';
  const timerPct = (timer / C.timerDuration) * 100;
  const total = questions.length;
  const current = Math.min(qIndex + 1, total);
  const myResult = roundResults.find((r) => r.playerId === 0)?.correct;

  if (phase === 'loading' || phase === 'completed') return null;

  return (
    <>
      {/* HUD superior: pregunta */}
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
            {/* Cabecera: PREGUNTA + barra de progreso */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{
                background: 'linear-gradient(135deg, #E94930, #EB5D70)',
                color: '#fff', padding: '6px 16px', borderRadius: 999,
                fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(233,73,48,0.3)', fontFamily: 'var(--font-baloo)',
                whiteSpace: 'nowrap',
              }}>
                Pregunta {current}/{total}
              </span>
              <div style={{
                flex: 1, height: 9, background: 'rgba(30,42,58,0.14)', borderRadius: 999,
                overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.12)',
              }}>
                <motion.div
                  animate={{ width: `${(current / total) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #EB5D70, #FDDB33)' }}
                />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '4px 12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 52, justifyContent: 'center',
              }}>
                <motion.span
                  key={Math.ceil(timer)}
                  initial={{ scale: 1.4, color: '#E94930' }}
                  animate={{ scale: 1 }}
                  style={{
                    color: timerPct > 30 ? '#4A3E32' : timerPct > 15 ? '#B7791F' : '#E94930',
                    fontSize: 16, fontWeight: 800, minWidth: 22, textAlign: 'center',
                  }}
                >
                  {Math.ceil(timer)}
                </motion.span>
              </div>
            </div>

            {/* Card de pregunta */}
            <div style={{
              background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)',
              borderRadius: 26,
              padding: '20px 20px 18px',
              border: '2px solid rgba(233,73,48,0.18)',
              boxShadow: '0 12px 40px rgba(30,42,58,0.18), 0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                color: '#2A1E0E', fontSize: 17, fontWeight: 700, textAlign: 'center',
                margin: '0 0 18px', lineHeight: 1.35,
              }}>
                {question.statement}
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <ABtn label="A" text={question.optionA} color="#E94930" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'A'} myCorrect={myResult} side="A" revealed={phase === 'roundResult'} actualCorrect={question.correctAnswer} />
                <ABtn label="B" text={question.optionB} color="#4CAF50" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'B'} myCorrect={myResult} side="B" revealed={phase === 'roundResult'} actualCorrect={question.correctAnswer} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jugadores (esquina inferior derecha) */}
      <div style={{
        position: 'fixed', bottom: 14, right: 12, zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: 6, width: 130,
      }}>
        {players.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(30,42,58,0.55)', backdropFilter: 'blur(8px)',
            borderRadius: 12, padding: '5px 10px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[p.id], flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, flex: 1 }}>{p.id === 0 ? 'Tú' : `P${p.id + 1}`}</span>
            <span style={{ color: '#FDF293', fontSize: 12, fontWeight: 800 }}>{p.blocks} ▓</span>
            {p.eliminated && <span style={{ color: '#F08090', fontSize: 11 }}>❌</span>}
          </div>
        ))}
      </div>
    </>
  );
}

function ABtn({ label, text, color, disabled, selected, myCorrect, side, revealed, actualCorrect }: {
  label: string; text: string; color: string; disabled: boolean; selected: boolean;
  myCorrect: boolean | undefined; side: 'A' | 'B'; revealed: boolean; actualCorrect: 'A' | 'B';
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
        flex: 1, padding: '14px 12px', borderRadius: 18,
        cursor: disabled && !selected ? 'default' : 'pointer',
        background: bg, color: tx, fontSize: 14, fontWeight: 700,
        border, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.2s, border-color 0.2s',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <span style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: circleBg, color: circleTx,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-baloo)',
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)',
      }}>
        {label}
      </span>
      <span style={{ lineHeight: 1.3 }}>{text}</span>
      {celebrate && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 'auto', fontSize: 24 }}>✅</motion.span>}
      {shake && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: 'auto', fontSize: 24 }}>❌</motion.span>}
    </motion.button>
  );
}

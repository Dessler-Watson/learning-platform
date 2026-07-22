'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
export function LavaHUD() {
  const phase = useLavaStore((s) => s.phase); const questions = useLavaStore((s) => s.questions); const qIndex = useLavaStore((s) => s.currentQuestionIndex);
  const timer = useLavaStore((s) => s.timer); const localAnswer = useLavaStore((s) => s.localAnswer); const players = useLavaStore((s) => s.players); const roundResults = useLavaStore((s) => s.roundResults);
  const question = questions[qIndex]; const show = phase === 'roundActive' || phase === 'roundResult'; const timerPct = (timer / C.timerDuration) * 100;
  if (phase === 'loading' || phase === 'completed') return null;
  return (
    <>
      <AnimatePresence>{show && (<motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'fixed', top: 10, left: 10, right: 10, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}><div style={{ flex: 1, maxWidth: 400, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}><motion.div animate={{ width: `${timerPct}%` }} transition={{ duration: 0.1 }} style={{ height: '100%', borderRadius: 3, background: timerPct > 30 ? '#4BC94B' : timerPct > 15 ? '#FFD93D' : '#FF4B4B' }} /></div><span style={{ color: '#fff', fontSize: 14, fontWeight: 700, minWidth: 30 }}>{Math.ceil(timer)}</span></motion.div>)}</AnimatePresence>
      <AnimatePresence>{show && question && (<motion.div key={qIndex} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, maxWidth: 500, width: '92%' }}><div style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px)', borderRadius: 20, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}><p style={{ color: '#fff', fontSize: 16, fontWeight: 700, textAlign: 'center', margin: '0 0 14px' }}>{question.statement}</p><div style={{ display: 'flex', gap: 10 }}><ABtn label="A" text={question.optionA} color="#FF4B4B" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'A'} correct={roundResults.find((r) => r.playerId === 0)?.correct} side="A" /><ABtn label="B" text={question.optionB} color="#4BC94B" disabled={localAnswer !== null || phase !== 'roundActive'} selected={localAnswer === 'B'} correct={roundResults.find((r) => r.playerId === 0)?.correct} side="B" /></div></div></motion.div>)}</AnimatePresence>
      <div style={{ position: 'fixed', top: 28, right: 14, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 6 }}>{players.map((p) => (<div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '4px 10px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#4FC3F7','#FF6B9D','#FFD93D','#4BC94B'][p.id] }} /><span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{p.id === 0 ? 'Tú' : `P${p.id+1}`} ▓ {p.blocks}</span>{p.eliminated && <span style={{ color: '#FF4B4B', fontSize: 11 }}>❌</span>}</div>))}</div>
    </>
  );
}
function ABtn({ label, text, color, disabled, selected, correct, side }: { label: string; text: string; color: string; disabled: boolean; selected: boolean; correct: boolean | undefined; side: string }) {
  const bg = selected ? (correct === true ? '#4CAF50' : correct === false ? '#FF4B4B' : color) : 'rgba(255,255,255,0.06)';
  return (<motion.button whileHover={!disabled ? { scale: 1.03 } : {}} whileTap={!disabled ? { scale: 0.97 } : {}} onClick={() => { if (!disabled) useLavaStore.getState().setLocalAnswer(side as 'A' | 'B'); }} disabled={disabled} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, border: 'none', background: bg, color: '#fff', fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', textAlign: 'left', opacity: disabled && !selected ? 0.5 : 1 }}><span style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 3 }}>{label}</span>{text}</motion.button>);
}

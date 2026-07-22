'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
export function RoundManager() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useFrame((_, dt) => {
    const store = useLavaStore.getState(); if (store.phase !== 'roundActive') return;
    const next = Math.max(0, store.timer - dt); useLavaStore.setState({ timer: next });
    const simPlayers = store.players.filter((p) => p.id !== 0 && !p.eliminated && p.answer === null);
    for (const sp of simPlayers) { if (next < C.timerDuration * (0.3 + Math.random() * 0.6)) { const q = store.questions[store.currentQuestionIndex]; useLavaStore.setState({ players: store.players.map((p) => p.id === sp.id ? { ...p, answer: (Math.random() > 0.55 ? q?.correctAnswer : (q?.correctAnswer === 'A' ? 'B' : 'A')) as 'A' | 'B' } : p) }); } }
    const localAns = store.localAnswer; const activePlayers = store.players.filter((p) => !p.eliminated);
    const allAnswered = activePlayers.every((p) => (p.id === 0 ? localAns !== null : p.answer !== null));
    const allDone = allAnswered || next <= 0;
    if (allDone && !timerRef.current) { const q = store.questions[store.currentQuestionIndex]; const results = activePlayers.map((p) => { const ans = p.id === 0 ? localAns : p.answer; return { playerId: p.id, correct: ans === q?.correctAnswer }; }); useLavaStore.getState().applyResults(results); useLavaStore.setState({ phase: 'roundResult' }); timerRef.current = setTimeout(() => { timerRef.current = null; const st = useLavaStore.getState(); const alive = st.players.filter((p) => !p.eliminated); if (alive.length <= 1 || st.currentQuestionIndex + 1 >= st.questions.length) { st.completeGame(); } else { st.advanceQuestion(); st.startRound(); } }, C.resultDisplayTime * 1000); }
  });
  return null;
}

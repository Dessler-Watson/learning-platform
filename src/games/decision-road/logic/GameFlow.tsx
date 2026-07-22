'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game.store';
import { DECISION_ROAD_CONFIG as CFG } from '@/games/decision-road/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';
const START_Z = 12; const SPACING = 25;
export function GameFlow() {
  const phase = useGameStore((s) => s.phase);
  const currentIndex = useGameStore((s) => s.currentQuestionIndex);
  const questions = useGameStore((s) => s.questions);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, CFG.questionsPerLevel);
    useGameStore.getState().setQuestions(pool);
    setTimeout(() => useGameStore.getState().setPhase('playing'), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (phase === 'correctFeedback') {
      timerRef.current = setTimeout(() => {
        const store = useGameStore.getState();
        const next = store.currentQuestionIndex + 1;
        if (next >= store.questions.length) { store.completeLevel(); store.setPhase('completed'); setTimeout(() => store.setPhase('results'), 800); }
        else { store.advanceQuestion(); store.setPhase('playing'); }
      }, CFG.feedbackDuration * 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, currentIndex, questions.length]);
  return null;
}

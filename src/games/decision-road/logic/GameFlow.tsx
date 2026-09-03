'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game.store';
import { DECISION_ROAD_CONFIG as CFG } from '@/games/decision-road/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';
const START_Z = 12; const SPACING = 25;
export function GameFlow() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, CFG.questionsPerLevel);
    useGameStore.getState().setQuestions(pool);
    setTimeout(() => useGameStore.getState().setPhase('playing'), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);
  return null;
}

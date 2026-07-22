'use client';
import { useEffect } from 'react';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';
export function LavaGameFlow() {
  useEffect(() => {
    const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, C.questionsPerGame);
    useLavaStore.getState().setQuestions(pool);
    setTimeout(() => useLavaStore.getState().setPhase('playing'), 400);
    setTimeout(() => useLavaStore.getState().startRound(), 800);
  }, []);
  return null;
}

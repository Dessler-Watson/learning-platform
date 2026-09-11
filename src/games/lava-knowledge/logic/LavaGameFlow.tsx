'use client';
import { useEffect } from 'react';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';

export function LavaGameFlow() {
  const phase = useLavaStore((s) => s.phase);

  useEffect(() => {
    const existing = useLavaStore.getState().questions;
    if (existing.length === 0) {
      const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, C.questionsPerGame);
      useLavaStore.getState().setQuestions(pool);
    }
    setTimeout(() => useLavaStore.getState().setPhase('playing'), 400);
    setTimeout(() => useLavaStore.getState().startRound(), 800);
  }, []);

  useEffect(() => {
    if (phase === 'completed') {
      const isPractice = !!sessionStorage.getItem('eduplay_practice');
      if (isPractice) {
        setTimeout(() => { window.location.href = '/practica/resultados'; }, 1500);
      }
    }
  }, [phase]);

  return null;
}

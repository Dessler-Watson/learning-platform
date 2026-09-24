'use client';
import { useEffect } from 'react';
import { useTierrasStore } from '@/stores/tierras.store';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';

export function TierrasGameFlow() {
  useEffect(() => {
    const existing = useTierrasStore.getState().questions;
    if (existing.length === 0) {
      const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, CFG.questionsPerGame);
      useTierrasStore.getState().setQuestions(pool);
    }
    const t = setTimeout(() => useTierrasStore.getState().setPhase('playing'), 800);
    return () => clearTimeout(t);
  }, []);

  return null;
}

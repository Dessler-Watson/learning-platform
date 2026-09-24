'use client';
import { useEffect, useRef } from 'react';
import { useAbismosStore } from '@/stores/abismos.store';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';

export function AbismosGameFlow() {
  const questions = useAbismosStore((s) => s.questions);
  const setQuestions = useAbismosStore((s) => s.setQuestions);
  const setPhase = useAbismosStore((s) => s.setPhase);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      if (questions.length > 0) {
        timerRef.current = setTimeout(() => setPhase('questions'), 400);
        return;
      }
      try {
        const { dignidadMujerQuestions } = await import('@/education/question-bank/dignidad-mujer');
        const shuffled = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, CFG.questionsPerGame);
        setQuestions(selected);
        timerRef.current = setTimeout(() => setPhase('questions'), 400);
      } catch (e) {
        console.error('Failed to load questions:', e);
      }
    };
    load();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [setQuestions, setPhase]);

  return null;
}

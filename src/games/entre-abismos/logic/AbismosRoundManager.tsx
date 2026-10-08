'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAbismosStore } from '@/stores/abismos.store';
import { ABISMOS_CONFIG as C } from '@/games/entre-abismos/config';
import { getChaosTiming } from '@/lib/chaos/timing';

export function AbismosRoundManager() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedRef = useRef<number>(-1);

  useFrame(() => {
    const store = useAbismosStore.getState();
    if (store.phase !== 'questions') return;

    const selected = store.selectedPlatform;
    // Timeout de contrarreloj: la respuesta se registró sin elegir plataforma
    // (localTimeout) y también debe procesarse como feedback.
    if (selected === null && !store.localTimeout) {
      processedRef.current = -1;
      return;
    }

    const answerIndex = store.answers.length;
    if (answerIndex === 0) return; // Paso 4: la respuesta aún viaja al servidor.
    if (answerIndex === processedRef.current) return;
    processedRef.current = answerIndex;

    if (timerRef.current) return;

    const lastAnswer = store.answers[answerIndex - 1];
    const isCorrect = lastAnswer?.correct ?? false;
    const lastQuestion = store.currentQuestionIndex >= store.questions.length - 1;

    if (isCorrect) {
      useAbismosStore.setState({ phase: 'correctFeedback' });
    } else {
      useAbismosStore.setState({ phase: 'incorrectFeedback' });
    }

    // 'ritmo_expres' (Caos): la pausa de feedback va a ×0.6; sin el
    // modificador, feedbackDuration intacto (1.5 s). Modificadores del
    // store (boot de la partida), sin fetch.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const st = useAbismosStore.getState();
      if (lastQuestion) {
        st.completeQuestions();
      } else {
        st.advanceQuestion();
        st.setPhase('questions');
      }
    }, getChaosTiming(C.feedbackDuration * 1000, useAbismosStore.getState().modifiers));
  });

  return null;
}

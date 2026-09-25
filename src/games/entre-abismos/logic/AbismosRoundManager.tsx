'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAbismosStore } from '@/stores/abismos.store';
import { ABISMOS_CONFIG as C } from '@/games/entre-abismos/config';

export function AbismosRoundManager() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedRef = useRef<number>(-1);

  useFrame(() => {
    const store = useAbismosStore.getState();
    if (store.phase !== 'questions') return;

    const selected = store.selectedPlatform;
    if (selected === null) {
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

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const st = useAbismosStore.getState();
      if (lastQuestion) {
        st.completeQuestions();
      } else {
        st.advanceQuestion();
        st.setPhase('questions');
      }
    }, C.feedbackDuration * 1000);
  });

  return null;
}

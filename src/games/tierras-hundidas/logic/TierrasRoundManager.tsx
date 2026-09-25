'use client';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTierrasStore } from '@/stores/tierras.store';
import { TIERRAS_CONFIG as C } from '@/games/tierras-hundidas/config';
import { gameAudio } from '@/shared/lib/gameAudio';

function clearPendingTimers(ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (ref.current !== null) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

export function TierrasRoundManager() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    return () => { clearPendingTimers(timerRef); };
  }, []);

  useFrame(() => {
    const store = useTierrasStore.getState();
    if (store.phase !== 'playing') {
      processedRef.current = false;
      return;
    }

    const selected = store.selectedPlatform;
    if (selected === null) return;
    if (processedRef.current) return;
    processedRef.current = true;

    void (async () => {
      // Paso 4: en modo sala el servidor valida y puntúa la respuesta.
      const res = await store.submitAnswer(selected);
      if (res === null) {
        processedRef.current = false;
        return;
      }
      const isCorrect = res.correct;

      if (isCorrect) {
      gameAudio.decisionCorrect();
      useTierrasStore.setState({ phase: 'correctFeedback' });

      clearPendingTimers(timerRef);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        useTierrasStore.getState().advanceToPlaying();
      }, C.feedbackDuration * 1000);
    } else {
      gameAudio.decisionIncorrect();
      const wrongPlatform = selected;
      useTierrasStore.setState({ sinkingPlatform: wrongPlatform, phase: 'sinking' });

      clearPendingTimers(timerRef);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        useTierrasStore.setState({ phase: 'falling' });

        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          gameAudio.lavaDefeat();
          useTierrasStore.getState().triggerFall();
        }, 1200);
        }, C.platformSinkingDuration * 1000);
      }
    })();
  });

  return null;
}

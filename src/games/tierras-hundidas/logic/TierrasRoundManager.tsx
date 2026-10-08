'use client';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTierrasStore } from '@/stores/tierras.store';
import { TIERRAS_CONFIG as C } from '@/games/tierras-hundidas/config';
import { getChaosTiming } from '@/lib/chaos/timing';
import { gameAudio } from '@/shared/lib/gameAudio';
import { localSurvivalShielded } from '@/lib/chaos/survival';

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
    // Timeout de contrarreloj: respuesta registrada sin elegir plataforma
    // (localTimeout); submitAnswer(null) ya la registró y solo falta procesarla.
    if (selected === null && !store.localTimeout) return;
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
      // 'ritmo_expres' (Caos): feedback y hundimiento van a ×0.6; sin el
      // modificador, duraciones intactas (0.8 s / 2.0 s). Modificadores del
      // store (boot de la partida), sin fetch.
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        useTierrasStore.getState().advanceToPlaying();
      }, getChaosTiming(C.feedbackDuration * 1000, useTierrasStore.getState().modifiers));
    } else {
      gameAudio.decisionIncorrect();
      const wrongPlatform = selected;

      // 'ultima_oportunidad' (Grupo 3): el PRIMER error de la partida no
      // elimina (el servidor lo mantiene 'playing'), así que NO se hunde la
      // plataforma ni se cae; se muestra el feedback de incorrecta y se
      // continúa. El resto de errores conserva la caída del modo tierras.
      const stNow = useTierrasStore.getState();
      if (localSurvivalShielded(stNow.modifiers, stNow.incorrectCount)) {
        useTierrasStore.setState({ phase: 'incorrectFeedback' });
        clearPendingTimers(timerRef);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          useTierrasStore.getState().advanceToPlaying();
        }, getChaosTiming(C.feedbackDuration * 1000, useTierrasStore.getState().modifiers));
        return;
      }

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
        }, getChaosTiming(C.platformSinkingDuration * 1000, useTierrasStore.getState().modifiers));
      }
    })();
  });

  return null;
}

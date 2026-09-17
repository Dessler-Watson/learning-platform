'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { gameAudio } from '@/shared/lib/gameAudio';

export function RoundManager() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTicksRef = useRef<number>(2);

  useFrame(() => {
    const store = useLavaStore.getState();
    if (store.phase !== 'roundActive') return;

    const localAns = store.localAnswer;
    if (localAns === null) return;

    const q = store.questions[store.currentQuestionIndex];
    if (!q) return;

    const prevTicks = prevTicksRef.current;
    const results = [{ playerId: 0, correct: localAns === q.correctAnswer }];
    useLavaStore.getState().applyResults(results);
    useLavaStore.setState({ phase: 'roundResult' });

    const newTicks = useLavaStore.getState().ticks;
    if (newTicks < prevTicks) {
      gameAudio.lavaRise();
      gameAudio.lavaTickChange();
    } else if (newTicks > prevTicks) {
      gameAudio.lavaTickChange();
    }
    prevTicksRef.current = newTicks;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const st = useLavaStore.getState();

      if (st.ticks <= 0) {
        gameAudio.lavaDefeat();
        gameAudio.stopHeartbeat();
        st.completeGame(true);
        return;
      }

      const next = st.currentQuestionIndex + 1;
      if (next >= st.questions.length) {
        st.completeGame();
      } else {
        st.advanceQuestion();
        st.startRound();
      }
    }, C.resultDisplayTime * 1000);
  });

  return null;
}

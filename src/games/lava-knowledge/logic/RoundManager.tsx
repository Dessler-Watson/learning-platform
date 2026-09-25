'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { gameAudio } from '@/shared/lib/gameAudio';
import { getMatchRoomId, submitMatchAnswer } from '@/lib/partida-client';

export function RoundManager() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTicksRef = useRef<number>(2);
  const processingRef = useRef<boolean>(false);

  useFrame(() => {
    const store = useLavaStore.getState();
    if (store.phase !== 'roundActive') {
      processingRef.current = false;
      return;
    }

    const localAns = store.localAnswer;
    if (localAns === null) return;
    if (processingRef.current) return;

    const q = store.questions[store.currentQuestionIndex];
    if (!q) return;
    processingRef.current = true;

    const prevTicks = prevTicksRef.current;
    void (async () => {
      let correct: boolean;
      let override: { score?: number; ticks?: number } | undefined;

      const roomId = getMatchRoomId();
      const ids = q.optionIds;
      if (roomId && ids && ids[0] && ids[1]) {
        // Paso 4: el servidor calcula correcto/puntos/ticks.
        const res = await submitMatchAnswer({ roomId, questionId: q.id, optionId: ids[localAns === 'A' ? 0 : 1] });
        if (!res) {
          processingRef.current = false;
          return;
        }
        correct = res.correct;
        override = {
          score: res.score,
          ticks: res.state?.ticks !== undefined ? res.state.ticks : undefined,
        };
        if (res.correct_option_id) {
          const correctAnswer = ids[0] === res.correct_option_id ? 'A' : 'B';
          useLavaStore.setState((st) => ({
            questions: st.questions.map((qq, i) => (i === st.currentQuestionIndex ? { ...qq, correctAnswer } : qq)),
          }));
        }
      } else {
        correct = localAns === q.correctAnswer;
      }

      useLavaStore.getState().applyResults([{ playerId: 0, correct }], override);
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
    })();
  });

  return null;
}

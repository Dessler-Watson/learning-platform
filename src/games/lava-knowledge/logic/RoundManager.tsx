'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { gameAudio } from '@/shared/lib/gameAudio';
import { getMatchRoomId, submitMatchAnswer, isRoomFinished } from '@/lib/partida-client';

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
    // Sala finalizada: no se procesa la respuesta (el juego sale a Resultados).
    if (isRoomFinished()) return;
    processingRef.current = true;

    const prevTicks = prevTicksRef.current;
    const questionIndex = store.currentQuestionIndex;
    const localAnsResolved = localAns;
    const isCorrect = localAnsResolved === q.correctAnswer;

    // Feedback inmediato: resultado, sonidos y avance no esperan a la red. En
    // modo sala, el POST /api/partida corre en segundo plano y reconcilia el
    // estado si difiere del cálculo local.
    useLavaStore.getState().applyResults([{ playerId: 0, correct: isCorrect }]);
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

    const roomId = getMatchRoomId();
    const ids = q.optionIds;
    if (roomId && ids && ids[0] && ids[1]) {
      void (async () => {
        try {
          const res = await submitMatchAnswer({
            roomId,
            questionId: q.id,
            optionId: ids[localAnsResolved === 'A' ? 0 : 1],
          });
          if (!res) return;
          let serverCorrectAnswer: 'A' | 'B' | null = null;
          if (res.correct_option_id) serverCorrectAnswer = ids[0] === res.correct_option_id ? 'A' : 'B';
          useLavaStore.getState().reconcileAnswer({
            questionIndex,
            localCorrect: isCorrect,
            serverCorrect: res.correct,
            score: res.score,
            ticks: res.state?.ticks,
            serverCorrectAnswer,
          });
        } catch {
          // Sin red: se mantiene el cálculo local (mismo fallback que antes).
        }
      })();
    }
  });

  return null;
}

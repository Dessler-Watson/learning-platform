'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { getChaosTiming } from '@/lib/chaos/timing';
import { gameAudio } from '@/shared/lib/gameAudio';
import { getMatchRoomId, submitMatchAnswer, isRoomFinished } from '@/lib/partida-client';
import { localSurvivalDeath } from '@/lib/chaos/survival';
import { useSurvivalStore } from '@/stores/survival.store';

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
    // Timeout de contrarreloj: respuesta registrada sin elegir opción
    // (localTimeout); también procesa la ronda como incorrecta.
    if (localAns === null && !store.localTimeout) return;
    if (processingRef.current) return;

    const q = store.questions[store.currentQuestionIndex];
    if (!q) return;
    // Sala finalizada: no se procesa la respuesta (el juego sale a Resultados).
    if (isRoomFinished()) return;
    processingRef.current = true;

    const prevTicks = prevTicksRef.current;
    const questionIndex = store.currentQuestionIndex;
    const localAnsResolved = localAns;
    const isCorrect = localAnsResolved != null && localAnsResolved === q.correctAnswer;

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

    // 'ritmo_expres' (Caos): la pausa de feedback va a ×0.6; sin el
    // modificador, resultDisplayTime intacto (2 s). Modificadores leídos del
    // store (ya cargados en el boot), sin fetch.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const st = useLavaStore.getState();

      // Grupo 3 (supervivencia): además del fin por recursos del modo
      // (ticks≤0), esta respuesta pudo eliminar al jugador por instakill /
      //3ª vida /2º error de ultima_oportunidad (escudo del primer error
      // incluido). Cálculo local determinista, espejo del servidor.
      const survivalDeath =
        localSurvivalDeath(st.modifiers, st.incorrectCount, isCorrect) ||
        useSurvivalStore.getState().eliminated;
      if (st.ticks <= 0 || survivalDeath) {
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
    }, getChaosTiming(C.resultDisplayTime * 1000, useLavaStore.getState().modifiers));

    const roomId = getMatchRoomId();
    const ids = q.optionIds;
    if (roomId && ids && ids[0] && ids[1]) {
      void (async () => {
        try {
          const res = await submitMatchAnswer({
            roomId,
            questionId: q.id,
            ...(localAnsResolved == null ? {} : { optionId: ids[localAnsResolved === 'A' ? 0 : 1] }),
            timedOut: localAnsResolved == null,
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

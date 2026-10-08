'use client';
import { create } from 'zustand';
import type { GamePhase, GameQuestion, DoorChoice, GameResult } from '@/games/decision-road/types';
import { recordAchievementEvent, bestStreakOf } from '@/shared/lib/achievement-service';
import { gameAudio } from '@/shared/lib/gameAudio';
import { getMatchRoomId, submitMatchAnswer, replaceLastAnswer, trailingStreak, isRoomFinished, isMatchRoom, postGameRoute } from '@/lib/partida-client';
import { localSurvivalDeath } from '@/lib/chaos/survival';

interface GameStore {
  phase: GamePhase; currentQuestionIndex: number; questions: GameQuestion[];
  answers: { questionId: string; choice: DoorChoice | null; correct: boolean }[];
  correctCount: number; incorrectCount: number; score: number; xp: number; streak: number;
  result: GameResult | null; explanation: string | null; selectedDoor: DoorChoice | null; countTick: number;
  starsEarned: number;
  /** Modificadores de la partida (Caos) para reflejar el HUD/feedback local.
   * Solo lectura visual: la puntuación real la decide el servidor. */
  modifiers: string[];
  /** 'memoria' (Caos): oculta las OPCIONES (texto de las puertas, 3D) al
   * cumplirse los 5 s. Solo visual: la elección sigue siendo posible. */
  chaosHideOptions: boolean;
  /** Grupo 3 (supervivencia): el servidor eliminó al jugador (o la muerte
   * local de Grupo 3 ya se calculó); activa el flujo de derrota. */
  defeated: boolean;
  setPhase: (phase: GamePhase) => void; setQuestions: (questions: GameQuestion[]) => void;
  setModifiers: (modifiers: string[]) => void;
  setChaosHideOptions: (hidden: boolean) => void;
  /** Entra al flujo de derrota (idempotente): fija 'defeated' y cierra el juego. */
  enterDefeat: () => void;
  /** `null` = tiempo agotado (contrarreloj): se registra como respuesta
   * incorrecta con timed_out en el servidor (penalización normal del modo). */
  submitAnswer: (choice: DoorChoice | null) => Promise<{ correct: boolean } | null>;
  /** Timeout local (contrarreloj): responde null y fuerza el feedback de
   * incorrecta si la partida sigue en fase de pregunta. */
  timeoutAnswer: () => Promise<{ correct: boolean } | null>;
  setExplanation: (text: string | null) => void; advanceQuestion: () => void; completeLevel: () => void; reset: () => void;
  triggerScoreCount: () => void;
  finishByRoom: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'loading', currentQuestionIndex: 0, questions: [], answers: [], correctCount: 0, incorrectCount: 0,
  score: 0, xp: 0, streak: 0, result: null, explanation: null, selectedDoor: null, countTick: 0, starsEarned: 0,
  modifiers: [],
  chaosHideOptions: false,
  defeated: false,
  setPhase: (phase) => set({ phase }),
  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0, answers: [], correctCount: 0, incorrectCount: 0, score: 0, xp: 0, streak: 0, result: null, explanation: null, selectedDoor: null, starsEarned: 0, modifiers: [], chaosHideOptions: false, defeated: false }),
  setModifiers: (modifiers) => set({ modifiers: Array.isArray(modifiers) ? modifiers : [] }),
  setChaosHideOptions: (hidden) => set({ chaosHideOptions: hidden }),
  // Grupo 3 (supervivencia): derrota por eliminación del servidor (instakill,
  //3ª vida,2º error de ultima). Idempotente; registra el mismo logro
  // 'game_defeated' que usan lava/tierras/abismos. Sin modificadores del
  // Grupo 3 nunca se invoca (el flujo normal sigue intacto).
  enterDefeat: () => {
    if (get().defeated) return;
    const { correctCount, score, xp, answers, questions } = get();
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    set({ defeated: true, phase: 'completed', explanation: null, selectedDoor: null });
    recordAchievementEvent({
      type: 'game_defeated',
      mode: 'decisiones',
      metadata: {
        accuracy,
        score,
        xp,
        defeated: true,
        correct: correctCount,
        total,
        bestStreak: bestStreakOf(answers),
        hadError: correctCount < total,
      },
    });
  },
  submitAnswer: async (choice) => {
    // Sala finalizada: no se responde ni se avanza localmente.
    if (isRoomFinished()) return null;
    const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak, starsEarned, modifiers } = get();
    const question = questions[currentQuestionIndex];
    if (!question) return null;
    // Idempotencia: una pregunta solo se registra una vez (evita doble
    // penalización si el timeout local choca con una respuesta normal).
    const existing = answers.find((a) => a.questionId === question.id);
    if (existing) return { correct: existing.correct };

    // Feedback inmediato: la respuesta correcta ya viene en el boot, así que el
    // resultado se calcula y muestra ya. En modo sala, el POST /api/partida se
    // lanza en segundo plano y su respuesta reconcilia el estado si difiere
    // (el servidor sigue validando y puntuando).
    const roomId = getMatchRoomId();
    const ids = question.optionIds;
    const isSala = !!(roomId && ids && ids[0] && ids[1]);
    const idx = currentQuestionIndex;

    const isCorrect = choice === question.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    // 'doble_puntos' (Caos): solo DOBLA el acierto en el cálculo local; la
    // penalización no se multiplica. El POST reconcilia con res.score del
    // servidor (autoridad) en modo sala.
    const doubleMult = isCorrect && modifiers.includes('doble_puntos') ? 2 : 1;
    const pointsEarned = isCorrect ? 10 * doubleMult : -5;
    const isPractice = typeof window !== 'undefined' && !!sessionStorage.getItem('eduplay_practice');
    // Paridad con el flujo anterior: en sala las estrellas no se acumulan aquí.
    const starsEarnedNow = !isSala && isCorrect && !isPractice ? 10 : 0;
    const provisionalScore = score + pointsEarned;

    set({
      selectedDoor: choice,
      answers: [...answers, { questionId: question.id, choice, correct: isCorrect }],
      correctCount: correctCount + (isCorrect ? 1 : 0),
      incorrectCount: incorrectCount + (isCorrect ? 0 : 1),
      score: provisionalScore,
      xp: xp + (isCorrect ? 15 : 0),
      streak: newStreak,
      starsEarned: starsEarned + starsEarnedNow,
    });
    if (isCorrect) { recordAchievementEvent({ type: 'correct_answer', mode: 'decisiones', metadata: { streak: newStreak } }); } else { recordAchievementEvent({ type: 'incorrect_answer', mode: 'decisiones' }); }
    if (newStreak > 0) { recordAchievementEvent({ type: 'streak', mode: 'decisiones', metadata: { streak: newStreak } }); }
    if (isCorrect) { recordAchievementEvent({ type: 'xp', mode: 'decisiones', metadata: { xp: 15 } }); }
    recordAchievementEvent({ type: 'score', mode: 'decisiones', metadata: { score: provisionalScore } });

    if (isSala) {
      // Sincronización en segundo plano: no bloquea el feedback ni el avance.
      void (async () => {
        try {
          const res = await submitMatchAnswer({
            roomId: roomId!,
            questionId: question.id,
            ...(choice == null ? {} : { optionId: ids[choice === 'A' ? 0 : 1] }),
            timedOut: choice == null,
          });
          if (!res) return;
          const st = get();
          const patch: Partial<ReturnType<typeof get>> = {};
          const fixedAnswers = replaceLastAnswer(st.answers, question.id, res.correct);
          if (fixedAnswers !== st.answers) {
            patch.answers = fixedAnswers;
            patch.correctCount = st.correctCount + (res.correct ? 1 : -1);
            patch.incorrectCount = st.incorrectCount + (res.correct ? -1 : 1);
            patch.streak = trailingStreak(fixedAnswers);
          }
          if (st.score !== res.score) patch.score = res.score;
          if (st.xp !== res.xp) patch.xp = res.xp;
          // Grupo 3: el servidor decidió la eliminación → preparar derrota.
          if (res.eliminated === true || res.status === 'eliminated') patch.defeated = true;
          if (res.correct_option_id) {
            const correctAnswer: DoorChoice = ids[0] === res.correct_option_id ? 'A' : 'B';
            if (correctAnswer !== question.correctAnswer) {
              patch.questions = st.questions.map((q, i) => (i === idx ? { ...q, correctAnswer } : q));
            }
          }
          if (Object.keys(patch).length > 0) set(patch);
        } catch {
          // Sin red: se mantiene el cálculo local (mismo fallback que antes).
        }
      })();
    }

    return { correct: isCorrect };
  },
  timeoutAnswer: async () => {
    const s = get();
    if (s.phase !== 'playing' && s.phase !== 'question') return null;
    // Carrera con un click a punto de 10 s: si la pregunta ya está registrada,
    // NO se toca el feedback (el flujo normal de DoorSystem la muestra).
    const q0 = s.questions[s.currentQuestionIndex];
    if (q0 && s.answers.some((a) => a.questionId === q0.id)) return null;
    const res = await get().submitAnswer(null);
    if (!res) return null;
    // Si la respuesta ya había avanzado de fase (carrera con un click), no
    // pisa el feedback existente.
    const st = get();
    if (st.phase === 'playing' || st.phase === 'question') {
      st.setPhase('incorrectFeedback');
      gameAudio.decisionIncorrect();
      const q = st.questions[st.currentQuestionIndex];
      if (q) st.setExplanation(q.explanation);
    }
    return res;
  },
  setExplanation: (text) => set({ explanation: text }),
  advanceQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1, selectedDoor: null, explanation: null })),
  completeLevel: () => { const { questions, correctCount, score, xp, answers } = get(); const total = questions.length; const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0; const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= 70 ? 1 : 0; set({ result: { totalQuestions: total, correctAnswers: correctCount, incorrectAnswers: total - correctCount, score, xp, stars, accuracy, completedAt: Date.now() } }); recordAchievementEvent({ type: 'game_completed', mode: 'decisiones', metadata: { accuracy, score, xp, defeated: false, correct: correctCount, total, bestStreak: bestStreakOf(answers), hadError: correctCount < total } }); },
  // Finalización de sala detectada en el cliente (autoridad: backend). En modo
  // sala sale de inmediato a la pantalla compartida de Resultados (igual que
  // lava/tierras/abismos). En modo local sintetiza el resultado con el estado
  // local al momento de finalizar y muestra los Resultados en la partida.
  // Idempotente: si ya hay resultado (completado normalmente) se conserva; si
  // ya está en 'results' no hace nada. No dispara logros (el servidor los
  // evalúa de forma autoritativa).
  finishByRoom: () => {
    if (isMatchRoom()) {
      window.location.href = postGameRoute();
      return;
    }
    const s = get();
    if (s.result === null) {
      const total = s.questions.length;
      const accuracy = total > 0 ? Math.round((s.correctCount / total) * 100) : 0;
      const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= 70 ? 1 : 0;
      set({ result: { totalQuestions: total, correctAnswers: s.correctCount, incorrectAnswers: total - s.correctCount, score: s.score, xp: s.xp, stars, accuracy, completedAt: Date.now() } });
    }
    if (get().phase !== 'results') set({ phase: 'results', explanation: null, selectedDoor: null });
  },
  reset: () => set({ phase: 'loading', currentQuestionIndex: 0, questions: [], answers: [], correctCount: 0, incorrectCount: 0, score: 0, xp: 0, streak: 0, result: null, explanation: null, selectedDoor: null, countTick: 0, starsEarned: 0, modifiers: [], defeated: false }),
  triggerScoreCount: () => set((s) => ({ countTick: s.countTick + 1 })),
}));

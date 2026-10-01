'use client';
import { create } from 'zustand';
import type { GamePhase, GameQuestion, DoorChoice, GameResult } from '@/games/decision-road/types';
import { recordAchievementEvent, bestStreakOf } from '@/shared/lib/achievement-service';
import { getMatchRoomId, submitMatchAnswer, replaceLastAnswer, trailingStreak } from '@/lib/partida-client';

interface GameStore {
  phase: GamePhase; currentQuestionIndex: number; questions: GameQuestion[];
  answers: { questionId: string; choice: DoorChoice | null; correct: boolean }[];
  correctCount: number; incorrectCount: number; score: number; xp: number; streak: number;
  result: GameResult | null; explanation: string | null; selectedDoor: DoorChoice | null; countTick: number;
  starsEarned: number;
  setPhase: (phase: GamePhase) => void; setQuestions: (questions: GameQuestion[]) => void;
  submitAnswer: (choice: DoorChoice) => Promise<{ correct: boolean } | null>;
  setExplanation: (text: string | null) => void; advanceQuestion: () => void; completeLevel: () => void; reset: () => void;
  triggerScoreCount: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'loading', currentQuestionIndex: 0, questions: [], answers: [], correctCount: 0, incorrectCount: 0,
  score: 0, xp: 0, streak: 0, result: null, explanation: null, selectedDoor: null, countTick: 0, starsEarned: 0,
  setPhase: (phase) => set({ phase }),
  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0, answers: [], correctCount: 0, incorrectCount: 0, score: 0, xp: 0, streak: 0, result: null, explanation: null, selectedDoor: null, starsEarned: 0 }),
  submitAnswer: async (choice) => {
    const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak, starsEarned } = get();
    const question = questions[currentQuestionIndex];
    if (!question) return null;

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
    const pointsEarned = isCorrect ? 10 : -5;
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
          const res = await submitMatchAnswer({ roomId: roomId!, questionId: question.id, optionId: ids[choice === 'A' ? 0 : 1] });
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
  setExplanation: (text) => set({ explanation: text }),
  advanceQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1, selectedDoor: null, explanation: null })),
  completeLevel: () => { const { questions, correctCount, score, xp, answers } = get(); const total = questions.length; const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0; const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= 70 ? 1 : 0; set({ result: { totalQuestions: total, correctAnswers: correctCount, incorrectAnswers: total - correctCount, score, xp, stars, accuracy, completedAt: Date.now() } }); recordAchievementEvent({ type: 'game_completed', mode: 'decisiones', metadata: { accuracy, score, xp, defeated: false, correct: correctCount, total, bestStreak: bestStreakOf(answers), hadError: correctCount < total } }); },
  reset: () => set({ phase: 'loading', currentQuestionIndex: 0, questions: [], answers: [], correctCount: 0, incorrectCount: 0, score: 0, xp: 0, streak: 0, result: null, explanation: null, selectedDoor: null, countTick: 0, starsEarned: 0 }),
  triggerScoreCount: () => set((s) => ({ countTick: s.countTick + 1 })),
}));

'use client';
import { create } from 'zustand';
import type { TierrasPhase, TierrasQuestion, PlatformChoice, TierrasResult } from '@/games/tierras-hundidas/types';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';
import { recordAchievementEvent, bestStreakOf } from '@/shared/lib/achievement-service';
import { getMatchRoomId, submitMatchAnswer, replaceLastAnswer, trailingStreak, isRoomFinished, reportMatchElimination } from '@/lib/partida-client';

interface TierrasStore {
  phase: TierrasPhase;
  currentQuestionIndex: number;
  questions: TierrasQuestion[];
  answers: { questionId: string; choice: PlatformChoice | null; correct: boolean }[];
  correctCount: number;
  incorrectCount: number;
  score: number;
  xp: number;
  streak: number;
  result: TierrasResult | null;
  explanation: string | null;
  selectedPlatform: PlatformChoice | null;
  sinkingPlatform: PlatformChoice | null;
  countTick: number;
  starsEarned: number;
  reachedFinish: boolean;
  fallenInWater: boolean;
  setPhase: (phase: TierrasPhase) => void;
  setQuestions: (questions: TierrasQuestion[]) => void;
  submitAnswer: (choice: PlatformChoice) => Promise<{ correct: boolean } | null>;
  setExplanation: (text: string | null) => void;
  advanceQuestion: () => void;
  advanceToPlaying: () => void;
  completeLevel: () => void;
  triggerFall: () => void;
  triggerSink: (platform: PlatformChoice) => void;
  reset: () => void;
  triggerScoreCount: () => void;
}

export const useTierrasStore = create<TierrasStore>((set, get) => ({
  phase: 'loading',
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  correctCount: 0,
  incorrectCount: 0,
  score: 0,
  xp: 0,
  streak: 0,
  result: null,
  explanation: null,
  selectedPlatform: null,
  sinkingPlatform: null,
  countTick: 0,
  starsEarned: 0,
  reachedFinish: false,
  fallenInWater: false,

  setPhase: (phase) => set({ phase }),

  setQuestions: (questions) => set({
    questions,
    currentQuestionIndex: 0,
    answers: [],
    correctCount: 0,
    incorrectCount: 0,
    score: 0,
    xp: 0,
    streak: 0,
    result: null,
    explanation: null,
    selectedPlatform: null,
    sinkingPlatform: null,
    countTick: 0,
    starsEarned: 0,
    reachedFinish: false,
    fallenInWater: false,
    phase: 'loading',
  }),

  submitAnswer: async (choice) => {
    // Sala finalizada: no se responde ni se avanza localmente.
    if (isRoomFinished()) return null;
    const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak, starsEarned } = get();
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    // Feedback inmediato: el resultado se calcula y muestra ya (la respuesta
    // correcta viene en el boot). En modo sala, el POST /api/partida se lanza
    // en segundo plano y su respuesta reconcilia el estado si difiere.
    const roomId = getMatchRoomId();
    const ids = question.optionIds;
    const isSala = !!(roomId && ids && ids[0] && ids[1]);
    const idx = currentQuestionIndex;

    const isCorrect = choice === question.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    const pointsEarned = isCorrect ? CFG.correctPoints : 0;
    const isPractice = typeof window !== 'undefined' && !!sessionStorage.getItem('eduplay_practice');
    // Paridad con el flujo anterior: en sala las estrellas no se acumulan aquí.
    const starsEarnedNow = !isSala && isCorrect && !isPractice ? 20 : 0;
    const provisionalScore = score + pointsEarned;

    set({
      selectedPlatform: choice,
      answers: [...answers, { questionId: question.id, choice, correct: isCorrect }],
      correctCount: correctCount + (isCorrect ? 1 : 0),
      incorrectCount: incorrectCount + (isCorrect ? 0 : 1),
      score: provisionalScore,
      xp: xp + (isCorrect ? 20 : 0),
      streak: newStreak,
      starsEarned: starsEarned + starsEarnedNow,
    });

    // Defer achievement work so it never blocks the answer/feedback frame.
    setTimeout(() => {
      if (isCorrect) {
        recordAchievementEvent({ type: 'correct_answer', mode: 'tierras', metadata: { streak: newStreak } });
      } else {
        recordAchievementEvent({ type: 'incorrect_answer', mode: 'tierras' });
      }
      if (newStreak > 1) {
        recordAchievementEvent({ type: 'streak', mode: 'tierras', metadata: { streak: newStreak } });
      }
      if (isCorrect) {
        recordAchievementEvent({ type: 'xp', mode: 'tierras', metadata: { xp: 20 } });
      }
      recordAchievementEvent({ type: 'score', mode: 'tierras', metadata: { score: provisionalScore } });
    }, 80);

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
            const correctAnswer: PlatformChoice = ids[0] === res.correct_option_id ? 'A' : 'B';
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

  advanceQuestion: () => set((s) => ({
    currentQuestionIndex: s.currentQuestionIndex + 1,
    selectedPlatform: null,
    sinkingPlatform: null,
    explanation: null,
  })),

  advanceToPlaying: () => set((s) => ({
    currentQuestionIndex: s.currentQuestionIndex + 1,
    selectedPlatform: null,
    sinkingPlatform: null,
    explanation: null,
    phase: 'playing' as const,
  })),

  completeLevel: () => {
    const { questions, correctCount, score, xp, answers } = get();
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= 70 ? 1 : 0;
    set({
      result: {
        totalQuestions: total,
        correctAnswers: correctCount,
        incorrectAnswers: total - correctCount,
        score,
        xp,
        stars,
        accuracy,
        completedAt: Date.now(),
      },
      phase: 'completed',
      reachedFinish: true,
    });
    recordAchievementEvent({
      type: 'game_completed',
      mode: 'tierras',
      metadata: {
        accuracy,
        score,
        xp,
        defeated: false,
        hadError: get().incorrectCount > 0,
        incorrectCount: get().incorrectCount,
        correct: correctCount,
        total,
        bestStreak: bestStreakOf(answers),
      },
    });
  },

  triggerFall: () => {
    // Causa de la caída: (a) respuesta incorrecta → el servidor ya marcó
    // 'eliminated' con la respuesta; (b) salto fallido o caída al costado →
    // sin respuesta, hay que reportarla aquí para que el panel docente muestre
    // la calavera. Idempotente en el servidor (solo si sigue 'playing').
    if (getMatchRoomId() && !isRoomFinished()) {
      void reportMatchElimination();
    }
    const state = get();
    const total = state.questions.length;
    const accuracy = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
    set({
      phase: 'completed',
      fallenInWater: true,
      result: {
        totalQuestions: total,
        correctAnswers: state.correctCount,
        incorrectAnswers: total - state.correctCount,
        score: state.score,
        xp: state.xp,
        stars: 0,
        accuracy,
        completedAt: Date.now(),
      },
    });
    recordAchievementEvent({
      type: 'elimination',
      mode: 'tierras',
      metadata: { fallenInWater: true },
    });
    recordAchievementEvent({
      type: 'game_defeated',
      mode: 'tierras',
      metadata: {
        accuracy,
        score: state.score,
        defeated: true,
        fallenInWater: true,
        hadError: state.incorrectCount > 0,
        incorrectCount: state.incorrectCount,
        correct: state.correctCount,
        total,
        bestStreak: bestStreakOf(state.answers),
      },
    });
  },

  triggerSink: (platform) => set({ sinkingPlatform: platform }),

  reset: () => set({
    phase: 'loading',
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    correctCount: 0,
    incorrectCount: 0,
    score: 0,
    xp: 0,
    streak: 0,
    result: null,
    explanation: null,
    selectedPlatform: null,
    sinkingPlatform: null,
    countTick: 0,
    starsEarned: 0,
    reachedFinish: false,
    fallenInWater: false,
  }),

  triggerScoreCount: () => set((s) => ({ countTick: s.countTick + 1 })),
}));

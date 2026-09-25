'use client';
import { create } from 'zustand';
import type { TierrasPhase, TierrasQuestion, PlatformChoice, TierrasResult } from '@/games/tierras-hundidas/types';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';
import { recordAchievementEvent } from '@/shared/lib/achievement-service';
import { getMatchRoomId, submitMatchAnswer } from '@/lib/partida-client';

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
    const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak, starsEarned } = get();
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    // Modo sala (Paso 4): servidor fuente de verdad.
    const roomId = getMatchRoomId();
    const ids = question.optionIds;
    if (roomId && ids && ids[0] && ids[1]) {
      try {
        const res = await submitMatchAnswer({ roomId, questionId: question.id, optionId: ids[choice === 'A' ? 0 : 1] });
        if (res) {
          const isCorrect = res.correct;
          const newStreak = isCorrect ? streak + 1 : 0;
          if (res.correct_option_id) {
            const correctAnswer: PlatformChoice = ids[0] === res.correct_option_id ? 'A' : 'B';
            set({ questions: questions.map((q, i) => (i === currentQuestionIndex ? { ...q, correctAnswer } : q)) });
          }
          set({
            selectedPlatform: choice,
            answers: [...answers, { questionId: question.id, choice, correct: isCorrect }],
            correctCount: correctCount + (isCorrect ? 1 : 0),
            incorrectCount: incorrectCount + (isCorrect ? 0 : 1),
            score: res.score,
            xp: res.xp,
            streak: newStreak,
          });
          setTimeout(() => {
            if (isCorrect) {
              recordAchievementEvent({ type: 'correct_answer', mode: 'tierras', metadata: { streak: newStreak } });
              recordAchievementEvent({ type: 'xp', mode: 'tierras', metadata: { xp: 20 } });
            } else {
              recordAchievementEvent({ type: 'incorrect_answer', mode: 'tierras' });
            }
            if (newStreak > 1) {
              recordAchievementEvent({ type: 'streak', mode: 'tierras', metadata: { streak: newStreak } });
            }
            recordAchievementEvent({ type: 'score', mode: 'tierras', metadata: { score: res.score } });
          }, 80);
          return { correct: isCorrect };
        }
      } catch {
        // fallback local
      }
    }

    const isCorrect = choice === question.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    const pointsEarned = isCorrect ? CFG.correctPoints : 0;
    const isPractice = typeof window !== 'undefined' && !!sessionStorage.getItem('eduplay_practice');
    const starsEarnedNow = isCorrect && !isPractice ? 20 : 0;

    set({
      selectedPlatform: choice,
      answers: [...answers, { questionId: question.id, choice, correct: isCorrect }],
      correctCount: correctCount + (isCorrect ? 1 : 0),
      incorrectCount: incorrectCount + (isCorrect ? 0 : 1),
      score: score + pointsEarned,
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
      recordAchievementEvent({ type: 'score', mode: 'tierras', metadata: { score: score + pointsEarned } });
    }, 80);
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
    const { questions, correctCount, score, xp } = get();
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
      },
    });
  },

  triggerFall: () => {
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

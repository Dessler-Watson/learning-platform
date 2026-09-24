import { create } from 'zustand';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { AbismosPhase, AbismosQuestion, AbismosResult, PlatformChoice } from '@/games/entre-abismos/types';
import { recordAchievementEvent } from '@/shared/lib/achievement-service';

interface AbismosStore {
  phase: AbismosPhase;
  currentQuestionIndex: number;
  questions: AbismosQuestion[];
  answers: { questionId: string; choice: PlatformChoice; correct: boolean }[];
  correctCount: number;
  incorrectCount: number;
  score: number;
  xp: number;
  streak: number;
  platforms: number;
  result: AbismosResult | null;
  explanation: string | null;
  selectedPlatform: PlatformChoice | null;
  starsEarned: number;
  fellInAbyss: boolean;
  reachedFinish: boolean;

  setPhase: (phase: AbismosPhase) => void;
  setQuestions: (questions: AbismosQuestion[]) => void;
  submitAnswer: (choice: PlatformChoice) => void;
  setExplanation: (text: string | null) => void;
  advanceQuestion: () => void;
  completeQuestions: () => void;
  triggerFall: () => void;
  triggerVictory: () => void;
  reset: () => void;
}

export const useAbismosStore = create<AbismosStore>((set, get) => ({
  phase: 'loading',
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  correctCount: 0,
  incorrectCount: 0,
  score: 0,
  xp: 0,
  streak: 0,
  platforms: 0,
  result: null,
  explanation: null,
  selectedPlatform: null,
  starsEarned: 0,
  fellInAbyss: false,
  reachedFinish: false,

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
    platforms: 0,
    result: null,
    explanation: null,
    selectedPlatform: null,
    fellInAbyss: false,
    reachedFinish: false,
    phase: 'questions',
  }),

  submitAnswer: (choice) => {
    const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak, starsEarned, platforms } = get();
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const isCorrect = choice === question.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    const pointsEarned = isCorrect ? CFG.correctPoints : 0;
    const isPractice = typeof window !== 'undefined' && !!sessionStorage.getItem('eduplay_practice');
    const starsEarnedNow = isCorrect && !isPractice ? 20 : 0;
    const newPlatforms = Math.max(0, Math.min(CFG.maxPlatforms, platforms + (isCorrect ? 1 : -1)));

    set({
      selectedPlatform: choice,
      answers: [...answers, { questionId: question.id, choice, correct: isCorrect }],
      correctCount: correctCount + (isCorrect ? 1 : 0),
      incorrectCount: incorrectCount + (isCorrect ? 0 : 1),
      score: score + pointsEarned,
      xp: xp + (isCorrect ? 20 : 0),
      streak: newStreak,
      starsEarned: starsEarned + starsEarnedNow,
      platforms: newPlatforms,
    });

    if (isCorrect) {
      recordAchievementEvent({ type: 'correct_answer', mode: 'abismos', metadata: { streak: newStreak } });
    } else {
      recordAchievementEvent({ type: 'incorrect_answer', mode: 'abismos' });
    }
    if (newStreak > 1) {
      recordAchievementEvent({ type: 'streak', mode: 'abismos', metadata: { streak: newStreak } });
    }
    if (isCorrect) {
      recordAchievementEvent({ type: 'xp', mode: 'abismos', metadata: { xp: 20 } });
    }
    recordAchievementEvent({ type: 'score', mode: 'abismos', metadata: { score: score + pointsEarned } });
  },

  setExplanation: (text) => set({ explanation: text }),

  advanceQuestion: () => set((s) => ({
    currentQuestionIndex: s.currentQuestionIndex + 1,
    selectedPlatform: null,
    explanation: null,
  })),

  completeQuestions: () => {
    const { questions, correctCount, incorrectCount, score, xp, platforms, phase, fellInAbyss } = get();
    if (phase === 'defeat' || fellInAbyss) return;
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    if (platforms <= 0) {
      set({
        fellInAbyss: true,
        reachedFinish: false,
        phase: 'defeat',
        score: 0,
        result: {
          totalQuestions: total,
          correctAnswers: correctCount,
          incorrectAnswers: total - correctCount,
          finalPlatforms: 0,
          score: 0,
          xp: 0,
          stars: 0,
          accuracy,
          fellInAbyss: true,
          reachedFinish: false,
          completedAt: Date.now(),
        },
      });
      recordAchievementEvent({
        type: 'game_defeated',
        mode: 'abismos',
        metadata: {
          accuracy,
          score: 0,
          defeated: true,
          fellInAbyss: true,
          platforms: 0,
          hadError: incorrectCount > 0,
          incorrectCount,
        },
      });
      return;
    }

    set({
      phase: 'freeMove',
    });
  },

  triggerFall: () => {
    const { phase, fellInAbyss } = get();
    if (phase === 'defeat' || phase === 'completed' || fellInAbyss) return;

    const { questions, correctCount, incorrectCount, platforms } = get();
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    set({
      fellInAbyss: true,
      reachedFinish: false,
      phase: 'defeat',
      score: 0,
      result: {
        totalQuestions: total,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        finalPlatforms: platforms,
        score: 0,
        xp: 0,
        stars: 0,
        accuracy,
        fellInAbyss: true,
        reachedFinish: false,
        completedAt: Date.now(),
      },
    });

    recordAchievementEvent({
      type: 'game_defeated',
      mode: 'abismos',
      metadata: {
        accuracy,
        score: 0,
        defeated: true,
        fellInAbyss: true,
        platforms,
        hadError: incorrectCount > 0,
        incorrectCount,
      },
    });
  },

  triggerVictory: () => {
    const { questions, correctCount, incorrectCount, score, xp, platforms, starsEarned } = get();
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= 70 ? 1 : 0;

    set({
      reachedFinish: true,
      fellInAbyss: false,
      phase: 'completed',
      result: {
        totalQuestions: total,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        finalPlatforms: platforms,
        score,
        xp,
        stars,
        accuracy,
        fellInAbyss: false,
        reachedFinish: true,
        completedAt: Date.now(),
      },
    });

    recordAchievementEvent({
      type: 'game_completed',
      mode: 'abismos',
      metadata: {
        score,
        accuracy,
        xp,
        defeated: false,
        platforms,
        hadError: incorrectCount > 0,
        incorrectCount,
      },
    });
  },

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
    platforms: 0,
    result: null,
    explanation: null,
    selectedPlatform: null,
    starsEarned: 0,
    fellInAbyss: false,
    reachedFinish: false,
  }),
}));

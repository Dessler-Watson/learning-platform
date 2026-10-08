import { create } from 'zustand';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { AbismosPhase, AbismosQuestion, AbismosResult, PlatformChoice } from '@/games/entre-abismos/types';
import { recordAchievementEvent, bestStreakOf } from '@/shared/lib/achievement-service';
import { getMatchRoomId, submitMatchAnswer, replaceLastAnswer, trailingStreak, isRoomFinished, reportMatchElimination } from '@/lib/partida-client';
import { localSurvivalShielded } from '@/lib/chaos/survival';

interface AbismosStore {
  phase: AbismosPhase;
  currentQuestionIndex: number;
  questions: AbismosQuestion[];
  answers: { questionId: string; choice: PlatformChoice | null; correct: boolean }[];
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
  /** Timeout local (contrarreloj): respuesta registrada sin elegir plataforma;
   * permite que el RoundManager procese el resultado con choice null. */
  localTimeout: boolean;
  /** Modificadores de la partida (Caos) para reflejar el HUD/feedback local.
   * Solo lectura visual: la puntuación real la decide el servidor. */
  modifiers: string[];

  setPhase: (phase: AbismosPhase) => void;
  setQuestions: (questions: AbismosQuestion[]) => void;
  setModifiers: (modifiers: string[]) => void;
  /** `null` = tiempo agotado (contrarreloj): respuesta incorrecta con timed_out. */
  submitAnswer: (choice: PlatformChoice | null) => Promise<{ correct: boolean } | null>;
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
  localTimeout: false,
  modifiers: [],

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
    localTimeout: false,
    modifiers: [],
    phase: 'questions',
  }),

  setModifiers: (modifiers) => set({ modifiers: Array.isArray(modifiers) ? modifiers : [] }),

  submitAnswer: async (choice) => {
    // Sala finalizada: no se responde ni se avanza localmente.
    if (isRoomFinished()) return null;
    const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak, starsEarned, platforms, modifiers } = get();
    const question = questions[currentQuestionIndex];
    if (!question) return null;
    // Idempotencia: una pregunta solo se registra una vez.
    const existing = answers.find((a) => a.questionId === question.id);
    if (existing) return { correct: existing.correct };

    // Feedback inmediato: el resultado se calcula y muestra ya (la respuesta
    // correcta viene en el boot). En modo sala, el POST /api/partida se lanza
    // en segundo plano y su respuesta reconcilia el estado si difiere.
    const roomId = getMatchRoomId();
    const ids = question.optionIds;
    const isSala = !!(roomId && ids && ids[0] && ids[1]);
    const idx = currentQuestionIndex;

    const isCorrect = choice === question.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    // 'doble_puntos' (Caos): solo DOBLA el acierto en el cálculo local; la
    // penalización no se multiplica. El POST reconcilia con res.score.
    const doubleMult = isCorrect && modifiers.includes('doble_puntos') ? 2 : 1;
    const pointsEarned = isCorrect ? CFG.correctPoints * doubleMult : -CFG.wrongPoints;
    const isPractice = typeof window !== 'undefined' && !!sessionStorage.getItem('eduplay_practice');
    // Paridad con el flujo anterior: en sala las estrellas no se acumulan aquí.
    const starsEarnedNow = !isSala && isCorrect && !isPractice ? 20 : 0;
    const provisionalScore = score + pointsEarned;
    const provisionalPlatforms = Math.max(0, Math.min(CFG.maxPlatforms, platforms + (isCorrect ? 1 : -1)));

    set({
      selectedPlatform: choice,
      ...(choice == null ? { localTimeout: true } : {}),
      answers: [...answers, { questionId: question.id, choice, correct: isCorrect }],
      correctCount: correctCount + (isCorrect ? 1 : 0),
      incorrectCount: incorrectCount + (isCorrect ? 0 : 1),
      score: provisionalScore,
      xp: xp + (isCorrect ? 20 : 0),
      streak: newStreak,
      starsEarned: starsEarned + starsEarnedNow,
      platforms: provisionalPlatforms,
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
    recordAchievementEvent({ type: 'score', mode: 'abismos', metadata: { score: provisionalScore } });

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
            if (res.correct) {
              patch.platforms = Math.max(0, Math.min(CFG.maxPlatforms, st.platforms + 2));
            } else {
              patch.platforms = Math.max(0, Math.min(CFG.maxPlatforms, st.platforms - 2));
            }
          }
          if (res.state?.platforms !== undefined) {
            const serverPlatforms = Math.max(0, Math.min(CFG.maxPlatforms, res.state.platforms));
            if (serverPlatforms !== st.platforms) patch.platforms = serverPlatforms;
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
    explanation: null,
    localTimeout: false,
  })),

  completeQuestions: () => {
    const { questions, correctCount, incorrectCount, score, xp, platforms, phase, fellInAbyss, answers, modifiers } = get();
    if (phase === 'defeat' || fellInAbyss) return;
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // 'ultima_oportunidad' (Grupo 3): el PRIMER error quedó protegido por el
    // escudo del servidor (sigue 'playing'), aunque las plataformas estén a0.
    // Sin ese escudo el cero de plataformas sigue siendo caída al vacío.
    const shieldedAlive = localSurvivalShielded(modifiers, incorrectCount);

    if (platforms <= 0 && !shieldedAlive) {
      // Se acabaron las plataformas → cayó al vacío: reporta la eliminación
      // y hace perder todas las estrellas de liga de la partida (servidor).
      if (getMatchRoomId() && !isRoomFinished()) {
        void reportMatchElimination({ forfeitStars: true });
      }
      set({
        fellInAbyss: true,
        reachedFinish: false,
        phase: 'defeat',
        score,
        result: {
          totalQuestions: total,
          correctAnswers: correctCount,
          incorrectAnswers: total - correctCount,
          finalPlatforms: 0,
          score,
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
          score,
          defeated: true,
          fellInAbyss: true,
          platforms: 0,
          hadError: incorrectCount > 0,
          incorrectCount,
          correct: correctCount,
          total,
          bestStreak: bestStreakOf(answers),
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

    // Cayó al vacío en el mundo 3D: reporta la eliminación al servidor (para
    // la calavera del panel docente) y hace perder TODAS las estrellas de
    // liga ganadas en esta partida. Idempotente (solo si sigue 'playing').
    if (getMatchRoomId() && !isRoomFinished()) {
      void reportMatchElimination({ forfeitStars: true });
    }

    const { questions, correctCount, incorrectCount, platforms, answers, score } = get();
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    set({
      fellInAbyss: true,
      reachedFinish: false,
      phase: 'defeat',
      score,
      result: {
        totalQuestions: total,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        finalPlatforms: platforms,
        score,
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
        score,
        defeated: true,
        fellInAbyss: true,
        platforms,
        hadError: incorrectCount > 0,
        incorrectCount,
        correct: correctCount,
        total,
        bestStreak: bestStreakOf(answers),
      },
    });
  },

  triggerVictory: () => {
    const { questions, correctCount, incorrectCount, score, xp, platforms, starsEarned, answers } = get();
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
        correct: correctCount,
        total,
        bestStreak: bestStreakOf(answers),
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
    localTimeout: false,
    modifiers: [],
  }),
}));

'use client';
import { create } from 'zustand';
import type { LavaPhase, LavaPlayer } from '@/games/lava-knowledge/types';
import type { GameQuestion } from '@/games/decision-road/types';
import { recordAchievementEvent } from '@/shared/lib/achievement-service';

interface LavaStore {
  phase: LavaPhase; questions: GameQuestion[]; currentQuestionIndex: number;
  players: LavaPlayer[];
  localAnswer: 'A' | 'B' | null; roundResults: { playerId: number; correct: boolean }[];
  answerHistory: { questionIndex: number; correct: boolean; choice: 'A' | 'B' }[];
  ticks: number; correctCount: number; incorrectCount: number; score: number; countTick: number;
  defeated: boolean;
  starsEarned: number;
  setPhase: (p: LavaPhase) => void; setQuestions: (q: GameQuestion[]) => void;
  setLocalAnswer: (a: 'A' | 'B') => void;
  applyResults: (results: { playerId: number; correct: boolean }[], override?: { score?: number; ticks?: number }) => void;
  advanceQuestion: () => void; startRound: () => void; completeGame: (defeated?: boolean) => void;
  reset: () => void;
}

const MAX_TICKS = 3;
const START_TICKS = 2;
const BLOCK_HEIGHT = 0.5;
const BASE_Y = 0.3;
const AVATAR_FOOT_OFFSET = 1.35;

function getTowerTop(blocks: number): number { return BASE_Y + blocks * BLOCK_HEIGHT; }
function getPlayerY(blocks: number): number { return getTowerTop(blocks) + AVATAR_FOOT_OFFSET; }

function createPlayers(): LavaPlayer[] {
  const footY = getPlayerY(START_TICKS);
  return [{ id: 0, towerY: footY, targetY: footY, answer: null, correct: null, eliminated: false, blocks: START_TICKS }];
}

export const useLavaStore = create<LavaStore>((set, get) => ({
  phase: 'loading', questions: [], currentQuestionIndex: 0,
  players: createPlayers(),
  localAnswer: null, roundResults: [], answerHistory: [],
  ticks: START_TICKS, correctCount: 0, incorrectCount: 0, score: 0, countTick: 0, defeated: false, starsEarned: 0,

  setPhase: (p) => set({ phase: p }),

  setQuestions: (q) => set({
    questions: q, currentQuestionIndex: 0,
    players: createPlayers(),
    localAnswer: null, roundResults: [], answerHistory: [],
    ticks: START_TICKS, correctCount: 0, incorrectCount: 0, score: 0, countTick: 0,
    phase: 'playing', defeated: false, starsEarned: 0,
  }),

  setLocalAnswer: (a) => set({ localAnswer: a }),

  applyResults: (results, override) => set((s) => {
    const r = results.find((rr) => rr.playerId === 0);
    if (!r) return {};
    const isCorrect = r.correct;
    let newTicks = s.ticks;
    if (override?.ticks !== undefined) {
      newTicks = Math.max(0, Math.min(MAX_TICKS, override.ticks));
    } else if (isCorrect) {
      newTicks = Math.min(MAX_TICKS, s.ticks + 1);
    } else {
      newTicks = Math.max(0, s.ticks - 1);
    }
    const newScore = override?.score !== undefined ? override.score : isCorrect ? s.score + 15 : Math.max(0, s.score - 5);
    const newCorrect = s.correctCount + (isCorrect ? 1 : 0);
    const newIncorrect = s.incorrectCount + (isCorrect ? 0 : 1);
    const eliminated = newTicks <= 0;
    const ty = eliminated ? -0.5 : getPlayerY(newTicks);
    const nextPlayer = { ...s.players[0], correct: isCorrect, targetY: ty, blocks: newTicks, eliminated };
    const isPractice = typeof window !== 'undefined' && !!sessionStorage.getItem('eduplay_practice');
    const starsNow = isCorrect && !isPractice ? 15 : 0;
    if (isCorrect) {
      recordAchievementEvent({ type: 'correct_answer', mode: 'lava' });
    } else {
      recordAchievementEvent({ type: 'incorrect_answer', mode: 'lava' });
    }
    recordAchievementEvent({ type: 'score', mode: 'lava', metadata: { score: newScore } });
    if (isCorrect) {
      recordAchievementEvent({ type: 'xp', mode: 'lava', metadata: { xp: 15 } });
    }
    return {
      players: [nextPlayer],
      roundResults: results,
      answerHistory: [...s.answerHistory, { questionIndex: s.currentQuestionIndex, correct: isCorrect, choice: s.localAnswer as 'A' | 'B' }],
      ticks: newTicks,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      score: newScore,
      countTick: s.countTick + (isCorrect ? 1 : 0),
      starsEarned: s.starsEarned + starsNow,
    };
  }),

  advanceQuestion: () => set((s) => ({
    currentQuestionIndex: s.currentQuestionIndex + 1,
    localAnswer: null, roundResults: [],
    players: s.players.map((p) => ({ ...p, answer: null, correct: null, towerY: p.targetY })),
  })),

  startRound: () => set({ roundResults: [], phase: 'roundActive' }),

  completeGame: (defeated = false) => {
    set({ phase: 'completed', defeated });
    const state = get();
    const total = state.questions.length;
    const accuracy = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
    if (defeated) {
      recordAchievementEvent({ type: 'elimination', mode: 'lava' });
      recordAchievementEvent({ type: 'game_defeated', mode: 'lava', metadata: { accuracy, defeated: true, ticks: state.ticks } });
    } else {
      recordAchievementEvent({ type: 'game_completed', mode: 'lava', metadata: { accuracy, score: state.score, defeated: false, ticks: state.ticks } });
    }
  },

  reset: () => set({
    phase: 'loading', questions: [], currentQuestionIndex: 0,
    players: createPlayers(),
    localAnswer: null, roundResults: [], answerHistory: [],
    ticks: START_TICKS, correctCount: 0, incorrectCount: 0, score: 0, countTick: 0, defeated: false, starsEarned: 0,
  }),
}));

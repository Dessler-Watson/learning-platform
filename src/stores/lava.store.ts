'use client';
import { create } from 'zustand';
import type { LavaPhase, LavaPlayer } from '@/games/lava-knowledge/types';
import type { GameQuestion } from '@/games/decision-road/types';

interface LavaStore {
  phase: LavaPhase; questions: GameQuestion[]; currentQuestionIndex: number;
  players: LavaPlayer[];
  localAnswer: 'A' | 'B' | null; roundResults: { playerId: number; correct: boolean }[];
  ticks: number; correctCount: number; incorrectCount: number; score: number; countTick: number;
  setPhase: (p: LavaPhase) => void; setQuestions: (q: GameQuestion[]) => void;
  setLocalAnswer: (a: 'A' | 'B') => void;
  applyResults: (results: { playerId: number; correct: boolean }[]) => void;
  advanceQuestion: () => void; startRound: () => void; completeGame: () => void;
  reset: () => void;
}

const MAX_TICKS = 5;
const START_TICKS = 3;
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
  localAnswer: null, roundResults: [],
  ticks: START_TICKS, correctCount: 0, incorrectCount: 0, score: 0, countTick: 0,

  setPhase: (p) => set({ phase: p }),

  setQuestions: (q) => set({
    questions: q, currentQuestionIndex: 0,
    players: createPlayers(),
    localAnswer: null, roundResults: [],
    ticks: START_TICKS, correctCount: 0, incorrectCount: 0, score: 0, countTick: 0,
    phase: 'playing'
  }),

  setLocalAnswer: (a) => set({ localAnswer: a }),

  applyResults: (results) => set((s) => {
    const r = results.find((rr) => rr.playerId === 0);
    if (!r) return {};
    const isCorrect = r.correct;
    let newTicks = s.ticks;
    if (isCorrect) {
      newTicks = Math.min(MAX_TICKS, s.ticks + 1);
    } else {
      newTicks = Math.max(0, s.ticks - 1);
    }
    const newScore = isCorrect ? s.score + 15 : Math.max(0, s.score - 5);
    const newCorrect = s.correctCount + (isCorrect ? 1 : 0);
    const newIncorrect = s.incorrectCount + (isCorrect ? 0 : 1);
    const eliminated = newTicks <= 0;
    const ty = eliminated ? -0.5 : getPlayerY(newTicks);
    const nextPlayer = { ...s.players[0], correct: isCorrect, targetY: ty, blocks: newTicks, eliminated };
    return {
      players: [nextPlayer],
      roundResults: results,
      ticks: newTicks,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      score: newScore,
      countTick: s.countTick + (isCorrect ? 1 : 0),
    };
  }),

  advanceQuestion: () => set((s) => ({
    currentQuestionIndex: s.currentQuestionIndex + 1,
    localAnswer: null, roundResults: [],
    players: s.players.map((p) => ({ ...p, answer: null, correct: null, towerY: p.targetY })),
  })),

  startRound: () => set({ roundResults: [], phase: 'roundActive' }),

  completeGame: () => set({ phase: 'completed' }),

  reset: () => set({
    phase: 'loading', questions: [], currentQuestionIndex: 0,
    players: createPlayers(),
    localAnswer: null, roundResults: [],
    ticks: START_TICKS, correctCount: 0, incorrectCount: 0, score: 0, countTick: 0,
  }),
}));

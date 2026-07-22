'use client';
import { create } from 'zustand';
import type { LavaPhase, LavaPlayer } from '@/games/lava-knowledge/types';
import type { GameQuestion } from '@/games/decision-road/types';

interface LavaStore {
  phase: LavaPhase; questions: GameQuestion[]; currentQuestionIndex: number;
  players: LavaPlayer[]; timer: number; timerMax: number;
  localAnswer: 'A' | 'B' | null; roundResults: { playerId: number; correct: boolean }[];
  setPhase: (p: LavaPhase) => void; setQuestions: (q: GameQuestion[]) => void;
  setLocalAnswer: (a: 'A' | 'B') => void; tickTimer: (dt: number) => void;
  applyResults: (results: { playerId: number; correct: boolean }[]) => void;
  advanceQuestion: () => void; startRound: () => void; completeGame: () => void;
}

function createPlayers(): LavaPlayer[] {
  const footY = 0.3 + 3 * 0.5 + 1.35;
  return [0, 1, 2, 3].map((id) => ({ id, towerY: footY, targetY: footY, answer: null, correct: null, eliminated: false, blocks: 3 }));
}

export const useLavaStore = create<LavaStore>((set, get) => ({
  phase: 'loading', questions: [], currentQuestionIndex: 0, players: createPlayers(), timer: 15, timerMax: 15, localAnswer: null, roundResults: [],
  setPhase: (p) => set({ phase: p }),
  setQuestions: (q) => set({ questions: q, currentQuestionIndex: 0, players: createPlayers(), timer: 15, timerMax: 15, localAnswer: null, roundResults: [], phase: 'playing' }),
  setLocalAnswer: (a) => set({ localAnswer: a }),
  tickTimer: (dt) => set((s) => { if (s.phase !== 'roundActive') return {}; const next = Math.max(0, s.timer - dt); return { timer: next }; }),
  applyResults: (results) => set((s) => { const next = s.players.map((p) => { const r = results.find((rr) => rr.playerId === p.id); if (!r || p.eliminated) return p; const nb = r.correct ? p.blocks + 1 : Math.max(0, p.blocks - 1); const elim = nb <= 0; const ty = elim ? -0.5 : 0.3 + nb * 0.5 + 1.35; return { ...p, correct: r.correct, targetY: ty, blocks: nb, eliminated: elim }; }); return { players: next, roundResults: results }; }),
  advanceQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1, localAnswer: null, roundResults: [], players: s.players.map((p) => ({ ...p, answer: null, correct: null, towerY: p.targetY })) })),
  startRound: () => set((s) => ({ timer: s.timerMax, roundResults: [], phase: 'roundActive' })),
  completeGame: () => set({ phase: 'completed' }),
}));

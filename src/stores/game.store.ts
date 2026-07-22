'use client';
import { create } from 'zustand';
import type { GamePhase, GameQuestion, DoorChoice, GameResult } from '@/games/decision-road/types';

interface GameStore {
  phase: GamePhase; currentQuestionIndex: number; questions: GameQuestion[];
  answers: { questionId: string; choice: DoorChoice | null; correct: boolean }[];
  correctCount: number; incorrectCount: number; score: number; xp: number; retryCount: number; streak: number;
  result: GameResult | null; explanation: string | null; selectedDoor: DoorChoice | null;
  setPhase: (phase: GamePhase) => void; setQuestions: (questions: GameQuestion[]) => void;
  submitAnswer: (choice: DoorChoice) => void; addRetry: () => void; resetRetry: () => void;
  setExplanation: (text: string | null) => void; advanceQuestion: () => void; completeLevel: () => void; reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'loading', currentQuestionIndex: 0, questions: [], answers: [], correctCount: 0, incorrectCount: 0,
  score: 0, xp: 0, retryCount: 0, streak: 0, result: null, explanation: null, selectedDoor: null,
  setPhase: (phase) => set({ phase }),
  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0, answers: [], correctCount: 0, incorrectCount: 0, score: 0, xp: 0, retryCount: 0, streak: 0, result: null, explanation: null, selectedDoor: null }),
  submitAnswer: (choice) => { const { currentQuestionIndex, questions, answers, correctCount, incorrectCount, score, xp, streak } = get(); const question = questions[currentQuestionIndex]; if (!question) return; const isCorrect = choice === question.correctAnswer; const newStreak = isCorrect ? streak + 1 : 0; const pointsEarned = isCorrect ? 25 + Math.floor(newStreak * 5) : 0; set({ selectedDoor: choice, answers: [...answers, { questionId: question.id, choice, correct: isCorrect }], correctCount: correctCount + (isCorrect ? 1 : 0), incorrectCount: incorrectCount + (isCorrect ? 0 : 1), score: score + pointsEarned, xp: xp + (isCorrect ? 15 : 0), streak: newStreak }); },
  addRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })), resetRetry: () => set({ retryCount: 0 }),
  setExplanation: (text) => set({ explanation: text }),
  advanceQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1, retryCount: 0, selectedDoor: null, explanation: null })),
  completeLevel: () => { const { questions, correctCount, score, xp } = get(); const total = questions.length; const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0; const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= 70 ? 1 : 0; set({ result: { totalQuestions: total, correctAnswers: correctCount, incorrectAnswers: total - correctCount, score, xp, stars, accuracy, completedAt: Date.now() } }); },
  reset: () => set({ phase: 'loading', currentQuestionIndex: 0, questions: [], answers: [], correctCount: 0, incorrectCount: 0, score: 0, xp: 0, retryCount: 0, streak: 0, result: null, explanation: null, selectedDoor: null }),
}));

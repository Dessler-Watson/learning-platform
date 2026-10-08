export type GamePhase = 'loading' | 'intro' | 'playing' | 'question' | 'correctFeedback' | 'incorrectFeedback' | 'finishing' | 'completed' | 'results';
export type DoorChoice = 'A' | 'B';
import type { ChaosSurpriseEffect } from '@/lib/chaos/sorpresa';
export interface GameQuestion { id: string; statement: string; optionA: string; optionB: string; correctAnswer: DoorChoice; explanation: string; difficulty: 'basic' | 'intermediate' | 'advanced'; optionIds?: [string, string]; /** 'pregunta_sorpresa': efecto determinista del servidor para ESTA pregunta (null = normal). */ sorpresa?: ChaosSurpriseEffect | null; }
export interface GameResult { totalQuestions: number; correctAnswers: number; incorrectAnswers: number; score: number; xp: number; stars: number; accuracy: number; completedAt: number; }

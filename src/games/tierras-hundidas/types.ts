export type TierrasPhase = 'loading' | 'intro' | 'playing' | 'correctFeedback' | 'incorrectFeedback' | 'sinking' | 'falling' | 'completed' | 'results';
export type PlatformChoice = 'A' | 'B';
import type { ChaosSurpriseEffect } from '@/lib/chaos/sorpresa';
export interface TierrasQuestion { id: string; statement: string; optionA: string; optionB: string; correctAnswer: PlatformChoice; explanation: string; difficulty: 'basic' | 'intermediate' | 'advanced'; optionIds?: [string, string]; /** 'pregunta_sorpresa': efecto determinista del servidor para ESTA pregunta (null = normal). */ sorpresa?: ChaosSurpriseEffect | null; }
export interface TierrasResult { totalQuestions: number; correctAnswers: number; incorrectAnswers: number; score: number; xp: number; stars: number; accuracy: number; completedAt: number; }

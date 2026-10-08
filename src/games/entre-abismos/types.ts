import type { ChaosSurpriseEffect } from '@/lib/chaos/sorpresa';

export type AbismosPhase =
  | 'loading'
  | 'intro'
  | 'questions'
  | 'correctFeedback'
  | 'incorrectFeedback'
  | 'building'
  | 'freeMove'
  | 'crossing'
  | 'completed'
  | 'defeat'
  | 'results';

export type PlatformChoice = 'A' | 'B';

export interface AbismosQuestion {
  id: string;
  statement: string;
  optionA: string;
  optionB: string;
  correctAnswer: PlatformChoice;
  explanation?: string;
  difficulty?: string;
  optionIds?: [string, string];
  /** 'pregunta_sorpresa': efecto determinista del servidor para ESTA pregunta (null = normal). */
  sorpresa?: ChaosSurpriseEffect | null;
}

export interface AbismosResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  finalPlatforms: number;
  score: number;
  xp: number;
  stars: number;
  accuracy: number;
  fellInAbyss: boolean;
  reachedFinish: boolean;
  completedAt: number;
}

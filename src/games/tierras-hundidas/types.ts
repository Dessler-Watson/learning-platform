export type TierrasPhase = 'loading' | 'intro' | 'playing' | 'correctFeedback' | 'incorrectFeedback' | 'sinking' | 'falling' | 'completed' | 'results';
export type PlatformChoice = 'A' | 'B';
export interface TierrasQuestion { id: string; statement: string; optionA: string; optionB: string; correctAnswer: PlatformChoice; explanation: string; difficulty: 'basic' | 'intermediate' | 'advanced'; }
export interface TierrasResult { totalQuestions: number; correctAnswers: number; incorrectAnswers: number; score: number; xp: number; stars: number; accuracy: number; completedAt: number; }

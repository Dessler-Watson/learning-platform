export type GamePhase = 'loading' | 'intro' | 'playing' | 'question' | 'correctFeedback' | 'incorrectFeedback' | 'completed' | 'results';
export type DoorChoice = 'A' | 'B';
export interface GameQuestion { id: string; statement: string; optionA: string; optionB: string; correctAnswer: DoorChoice; explanation: string; difficulty: 'basic' | 'intermediate' | 'advanced'; }
export interface GameResult { totalQuestions: number; correctAnswers: number; incorrectAnswers: number; score: number; xp: number; stars: number; accuracy: number; completedAt: number; }

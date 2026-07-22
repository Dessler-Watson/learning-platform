export interface LavaPlayer { id: number; towerY: number; targetY: number; answer: 'A' | 'B' | null; correct: boolean | null; eliminated: boolean; blocks: number; }
export type LavaPhase = 'loading' | 'playing' | 'roundActive' | 'roundResult' | 'completed';

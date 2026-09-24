export type AchievementMode = 'decisiones' | 'lava' | 'tierras' | 'abismos';
export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  mode: AchievementMode;
  icon: string;
  difficulty: AchievementDifficulty;
  goal: number;
  statKey: string;
}

export interface AchievementProgress {
  id: string;
  progress: number;
  completed: boolean;
  unlockedAt: number | null;
  isNew: boolean;
}

export interface AchievementEvent {
  type: 'correct_answer' | 'incorrect_answer' | 'game_completed' | 'game_defeated' | 'streak' | 'score' | 'xp' | 'accuracy' | 'perfect_streak' | 'elimination';
  mode: 'decisiones' | 'lava' | 'tierras' | 'abismos';
  value?: number;
  metadata?: {
    accuracy?: number;
    score?: number;
    xp?: number;
    streak?: number;
    defeated?: boolean;
    isPractice?: boolean;
    ticks?: number;
    fallenInWater?: boolean;
    fellInAbyss?: boolean;
    hadError?: boolean;
    incorrectCount?: number;
    platforms?: number;
  };
}

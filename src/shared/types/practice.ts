import type { GeneratedQuestion } from '@/app/panel/lib/aiGenerator';

export type PracticeMode = 'decisiones' | 'lava' | 'tierras' | 'abismos';

export interface Practice {
  id: string;
  code: string;
  creatorId: number;
  creatorName: string;
  title: string;
  description: string;
  mode: PracticeMode;
  topic: string;
  questions: GeneratedQuestion[];
  questionCount: number;
  createdAt: number;
  lastPlayedAt: number | null;
  isPublic: boolean;
  playCount: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface PracticeResult {
  practiceId: string;
  userId: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  playedAt: number;
  mode: PracticeMode;
}

export interface StoredUser {
  id_usuario: number;
  nombre: string;
  avatar_id: number;
  correo?: string;
  modo: 'registrado' | 'invitado';
}

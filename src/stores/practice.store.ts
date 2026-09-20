'use client';

import { create } from 'zustand';
import type { Practice, PracticeMode, PracticeResult, StoredUser } from '@/shared/types/practice';
import type { GeneratedQuestion } from '@/app/panel/lib/aiGenerator';

const PRACTICES_KEY = 'eduplay_practices';
const RESULTS_KEY = 'eduplay_practice_results';
const USER_KEY = 'eduplay_user';

function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRegistered(): boolean {
  const user = getUser();
  return user !== null && user.modo === 'registrado';
}

function loadPractices(): Practice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRACTICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePractices(practices: Practice[]) {
  localStorage.setItem(PRACTICES_KEY, JSON.stringify(practices));
}

function loadResults(): PracticeResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveResults(results: PracticeResult[]) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface PracticeStore {
  practices: Practice[];
  results: PracticeResult[];
  initialized: boolean;

  init: () => void;
  addPractice: (title: string, topic: string, mode: PracticeMode, questions: GeneratedQuestion[]) => Practice | null;
  deletePractice: (id: string) => void;
  publishPractice: (id: string) => boolean;
  unpublishPractice: (id: string) => boolean;
  getUserPractices: () => Practice[];
  getPublicPractices: () => Practice[];
  searchPublicPractices: (query: string, mode: PracticeMode | 'all') => Practice[];
  getPracticeById: (id: string) => Practice | undefined;
  recordPlayResult: (practiceId: string, correctAnswers: number, incorrectAnswers: number) => void;
  getUserResults: () => PracticeResult[];
  getPracticeResults: (practiceId: string) => PracticeResult[];
  canAccessHistory: () => boolean;
  canPublish: () => boolean;
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practices: [],
  results: [],
  initialized: false,

  init: () => {
    if (get().initialized) return;
    set({
      practices: loadPractices(),
      results: loadResults(),
      initialized: true,
    });
  },

  addPractice: (title, topic, mode, questions) => {
    const user = getUser();
    const practice: Practice = {
      id: `practice_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      code: generateCode(),
      creatorId: user?.id_usuario ?? 0,
      creatorName: user?.nombre ?? 'Invitado',
      title,
      description: '',
      mode,
      topic,
      questions,
      questionCount: questions.length,
      createdAt: Date.now(),
      lastPlayedAt: null,
      isPublic: false,
      playCount: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
    };

    const updated = [practice, ...get().practices];
    savePractices(updated);
    set({ practices: updated });
    return practice;
  },

  deletePractice: (id) => {
    const updated = get().practices.filter((p) => p.id !== id);
    savePractices(updated);
    set({ practices: updated });
  },

  publishPractice: (id) => {
    if (!isRegistered()) return false;
    const updated = get().practices.map((p) =>
      p.id === id ? { ...p, isPublic: true, code: p.code || generateCode() } : p
    );
    savePractices(updated);
    set({ practices: updated });
    return true;
  },

  unpublishPractice: (id) => {
    if (!isRegistered()) return false;
    const updated = get().practices.map((p) =>
      p.id === id ? { ...p, isPublic: false } : p
    );
    savePractices(updated);
    set({ practices: updated });
    return true;
  },

  getUserPractices: () => {
    const user = getUser();
    if (!user) return [];
    return get().practices.filter((p) => p.creatorId === user.id_usuario);
  },

  getPublicPractices: () => {
    return get().practices.filter((p) => p.isPublic);
  },

  searchPublicPractices: (query, mode) => {
    const allPublic = get().getPublicPractices();
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    return allPublic.filter((p) => {
      const matchesMode = mode === 'all' || p.mode === mode;
      if (!normalizedQuery) return matchesMode;

      const normalizedTitle = p.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedTopic = p.topic.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedCreator = p.creatorName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const codeMatch = p.code && p.code.includes(normalizedQuery.replace('#', ''));

      const matchesQuery =
        normalizedTitle.includes(normalizedQuery) ||
        normalizedTopic.includes(normalizedQuery) ||
        normalizedCreator.includes(normalizedQuery) ||
        !!codeMatch;

      return matchesMode && matchesQuery;
    });
  },

  getPracticeById: (id) => {
    return get().practices.find((p) => p.id === id);
  },

  recordPlayResult: (practiceId, correctAnswers, incorrectAnswers) => {
    const user = getUser();
    const practice = get().practices.find((p) => p.id === practiceId);
    if (!practice) return;

    const result: PracticeResult = {
      practiceId,
      userId: user?.id_usuario ?? 0,
      correctAnswers,
      incorrectAnswers,
      totalQuestions: practice.questionCount,
      playedAt: Date.now(),
      mode: practice.mode,
    };

    const updatedResults = [result, ...get().results];
    saveResults(updatedResults);

    const updatedPractices = get().practices.map((p) =>
      p.id === practiceId
        ? {
            ...p,
            lastPlayedAt: Date.now(),
            playCount: p.playCount + 1,
            correctAnswers: p.correctAnswers + correctAnswers,
            incorrectAnswers: p.incorrectAnswers + incorrectAnswers,
          }
        : p
    );
    savePractices(updatedPractices);

    set({
      results: updatedResults,
      practices: updatedPractices,
    });
  },

  getUserResults: () => {
    const user = getUser();
    if (!user) return [];
    return get().results.filter((r) => r.userId === user.id_usuario);
  },

  getPracticeResults: (practiceId) => {
    return get().results.filter((r) => r.practiceId === practiceId);
  },

  canAccessHistory: () => {
    return isRegistered();
  },

  canPublish: () => {
    return isRegistered();
  },
}));

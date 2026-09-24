'use client';

import { create } from 'zustand';
import type { Practice, PracticeMode, PracticeResult } from '@/shared/types/practice';
import type { GeneratedQuestion } from '@/app/panel/lib/aiGenerator';
import { isRegisteredUser } from '@/shared/lib/userStorage';

interface PracticeStore {
  practices: Practice[];
  publicPractices: Practice[];
  results: PracticeResult[];
  initialized: boolean;
  loading: boolean;

  init: () => Promise<void>;
  refreshPublic: () => Promise<void>;
  addPractice: (
    title: string,
    topic: string,
    mode: PracticeMode,
    questions: GeneratedQuestion[]
  ) => Promise<Practice | null>;
  deletePractice: (id: string) => Promise<boolean>;
  publishPractice: (id: string) => Promise<boolean>;
  unpublishPractice: (id: string) => Promise<boolean>;
  getUserPractices: () => Practice[];
  getPublicPractices: () => Practice[];
  searchPublicPractices: (query: string, mode: PracticeMode | 'all') => Practice[];
  getPracticeById: (id: string) => Practice | undefined;
  loadQuestions: (id: string) => Promise<GeneratedQuestion[]>;
  recordPlayResult: (
    practiceId: string,
    correctAnswers: number,
    incorrectAnswers: number
  ) => Promise<void>;
  getUserResults: () => PracticeResult[];
  getPracticeResults: (practiceId: string) => PracticeResult[];
  canAccessHistory: () => boolean;
  canPublish: () => boolean;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function toIsoMs(value: string | number | null | undefined): number {
  if (value == null) return Date.now();
  if (typeof value === 'number') return value;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : Date.now();
}

interface ApiPractice {
  id: string;
  code: string;
  title: string;
  description: string | null;
  mode_code: string;
  mode_name?: string;
  topic?: string | null;
  question_count: number;
  is_public: boolean;
  created_at: string;
  created_by: string;
  creator_name?: string | null;
  play_count?: number;
}

function mapPractice(row: ApiPractice): Practice {
  return {
    id: row.id,
    code: row.code,
    creatorId: Number(row.created_by) || 0,
    creatorName: row.creator_name ?? 'Docente',
    title: row.title,
    description: row.description ?? '',
    mode: row.mode_code as PracticeMode,
    topic: row.topic ?? row.title,
    questions: [],
    questionCount: row.question_count,
    createdAt: toIsoMs(row.created_at),
    lastPlayedAt: null,
    isPublic: row.is_public,
    playCount: row.play_count ?? 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
  };
}

function mapQuestions(
  rows: Array<{
    question_text: string;
    options_raw?: Array<{ id: string; text: string }>;
    options?: Array<{ id: string; text: string }>;
    correct_index: number | null;
  }>
): GeneratedQuestion[] {
  return rows.map((r) => {
    const opts = r.options_raw ?? r.options ?? [];
    const a = opts[0]?.text ?? '';
    const b = opts[1]?.text ?? '';
    const correctIndex = r.correct_index ?? 0;
    return {
      question: r.question_text,
      optionA: a,
      optionB: b,
      correctAnswer: correctIndex === 1 ? 'B' : 'A',
    } satisfies GeneratedQuestion;
  });
}

async function apiGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function apiPost<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toApiQuestions(questions: GeneratedQuestion[]) {
  return questions.map((q) => ({
    question_text: q.question,
    options: [q.optionA, q.optionB],
    correct_index: q.correctAnswer === 'B' ? 1 : 0,
  }));
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practices: [],
  publicPractices: [],
  results: [],
  initialized: false,
  loading: false,

  init: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true });

    const publicData = await apiGet<{ practicas: ApiPractice[] }>('/api/practicas?scope=public');
    const publicPractices = (publicData?.practicas ?? []).map(mapPractice);

    let practices: Practice[] = [];
    let results: PracticeResult[] = [];

    if (isRegisteredUser()) {
      const [mine, hist] = await Promise.all([
        apiGet<{ practicas: ApiPractice[] }>('/api/practicas?scope=mine'),
        apiGet<{ resultados: Array<{ id: string; practice_id: string; score: number; correct: number; total: number; completed_at: string }> }>(
          '/api/practicas?scope=results'
        ),
      ]);
      practices = (mine?.practicas ?? []).map(mapPractice);
      results = (hist?.resultados ?? []).map((r) => ({
        practiceId: r.practice_id,
        userId: 0,
        correctAnswers: r.correct,
        incorrectAnswers: Math.max(0, r.total - r.correct),
        totalQuestions: r.total,
        playedAt: toIsoMs(r.completed_at),
        mode: 'decisiones',
      }));
    }

    set({ practices, publicPractices, results, initialized: true, loading: false });
  },

  refreshPublic: async () => {
    const publicData = await apiGet<{ practicas: ApiPractice[] }>('/api/practicas?scope=public');
    set({ publicPractices: (publicData?.practicas ?? []).map(mapPractice) });
  },

  addPractice: async (title, topic, mode, questions) => {
    if (!isRegisteredUser()) return null;
    const data = await apiPost<{ ok: boolean; id: string }>('/api/practicas', {
      action: 'create',
      title,
      mode,
      topic,
      questions: toApiQuestions(questions),
    });
    if (!data?.ok) return null;

    const practice: Practice = {
      id: data.id,
      code: '',
      creatorId: 0,
      creatorName: 'Tú',
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
    set({ practices: [practice, ...get().practices] });
    return practice;
  },

  deletePractice: async (id) => {
    if (!isRegisteredUser()) return false;
    const data = await apiPost<{ ok: boolean }>('/api/practicas', {
      action: 'delete',
      practice_id: id,
    });
    if (!data?.ok) return false;
    set({ practices: get().practices.filter((p) => p.id !== id) });
    return true;
  },

  publishPractice: async (id) => {
    if (!isRegisteredUser()) return false;
    const data = await apiPost<{ ok: boolean }>('/api/practicas', {
      action: 'publish',
      practice_id: id,
    });
    if (!data?.ok) return false;
    set({
      practices: get().practices.map((p) => (p.id === id ? { ...p, isPublic: true } : p)),
    });
    void get().refreshPublic();
    return true;
  },

  unpublishPractice: async (id) => {
    if (!isRegisteredUser()) return false;
    const data = await apiPost<{ ok: boolean }>('/api/practicas', {
      action: 'unpublish',
      practice_id: id,
    });
    if (!data?.ok) return false;
    set({
      practices: get().practices.map((p) => (p.id === id ? { ...p, isPublic: false } : p)),
    });
    void get().refreshPublic();
    return true;
  },

  getUserPractices: () => {
    if (!isRegisteredUser()) return [];
    return get().practices;
  },

  getPublicPractices: () => get().publicPractices,

  searchPublicPractices: (query, mode) => {
    const allPublic = get().publicPractices;
    const normalizedQuery = normalize(query);

    return allPublic.filter((p) => {
      const matchesMode = mode === 'all' || p.mode === mode;
      if (!normalizedQuery) return matchesMode;

      const normalizedTitle = normalize(p.title);
      const normalizedTopic = normalize(p.topic);
      const normalizedCreator = normalize(p.creatorName);
      const codeMatch = p.code && p.code.toLowerCase().includes(normalizedQuery.replace('#', ''));

      const matchesQuery =
        normalizedTitle.includes(normalizedQuery) ||
        normalizedTopic.includes(normalizedQuery) ||
        normalizedCreator.includes(normalizedQuery) ||
        !!codeMatch;

      return matchesMode && matchesQuery;
    });
  },

  getPracticeById: (id) => {
    return (
      get().practices.find((p) => p.id === id) ??
      get().publicPractices.find((p) => p.id === id)
    );
  },

  loadQuestions: async (id) => {
    const data = await apiGet<{ practica: ApiPractice; preguntas: Parameters<typeof mapQuestions>[0] }>(
      `/api/practicas?practice_id=${encodeURIComponent(id)}`
    );
    if (!data?.preguntas) return [];
    const questions = mapQuestions(data.preguntas);
    const mapped = mapPractice(data.practica);
    mapped.questions = questions;
    set({
      practices: get().practices.map((p) => (p.id === id ? { ...p, ...mapped } : p)),
      publicPractices: get().publicPractices.map((p) => (p.id === id ? { ...p, ...mapped } : p)),
    });
    return questions;
  },

  recordPlayResult: async (practiceId, correctAnswers, incorrectAnswers) => {
    if (!isRegisteredUser()) return;
    await apiPost('/api/practicas', {
      action: 'submit',
      practice_id: practiceId,
      correct: correctAnswers,
      incorrect: incorrectAnswers,
      total: correctAnswers + incorrectAnswers,
    });
    const practice = get().getPracticeById(practiceId);
    const result: PracticeResult = {
      practiceId,
      userId: 0,
      correctAnswers,
      incorrectAnswers,
      totalQuestions: practice?.questionCount ?? correctAnswers + incorrectAnswers,
      playedAt: Date.now(),
      mode: practice?.mode ?? 'decisiones',
    };
    set({ results: [result, ...get().results] });
  },

  getUserResults: () => {
    if (!isRegisteredUser()) return [];
    return get().results;
  },

  getPracticeResults: (practiceId) => {
    return get().results.filter((r) => r.practiceId === practiceId);
  },

  canAccessHistory: () => isRegisteredUser(),

  canPublish: () => isRegisteredUser(),
}));

'use client';

import { create } from 'zustand';
import type { Practice, PracticeMode, PracticeResult } from '@/shared/types/practice';
import type { GeneratedQuestion } from '@/app/panel/lib/aiGenerator';
import type { MyPracticesPage, PublicPracticesPage } from '@/lib/db/practices';
import { isRegisteredUser } from '@/shared/lib/userStorage';

interface PracticeStore {
  practices: Practice[];
  publicPractices: Practice[];
  publicPage: number;
  publicTotal: number;
  publicTotalPages: number;
  publicLimit: number;
  publicQuery: string;
  publicMode: PracticeMode | 'all';
  publicLoading: boolean;
  results: PracticeResult[];
  initialized: boolean;
  loading: boolean;
  myPage: number;
  myTotal: number;
  myTotalPages: number;
  myLoading: boolean;

  init: () => Promise<void>;
  loadMyPage: (opts?: { page?: number }) => Promise<void>;
  loadPublicPage: (opts?: { q?: string; mode?: PracticeMode | 'all'; page?: number }) => Promise<void>;
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
  getPracticeById: (id: string) => Practice | undefined;
  loadQuestions: (id: string) => Promise<GeneratedQuestion[]>;
  recordPlayResult: (
    practiceId: string,
    answers: Array<{ index: number; choice: 'A' | 'B' | null }>
  ) => Promise<void>;
  getUserResults: () => PracticeResult[];
  getPracticeResults: (practiceId: string) => PracticeResult[];
  canAccessHistory: () => boolean;
  canPublish: () => boolean;
}

const PUBLIC_PAGE_LIMIT = 15;
const MY_PAGE_LIMIT = 15;
let publicRequestId = 0;
let myRequestId = 0;

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
  correct_answers?: number;
  incorrect_answers?: number;
  last_played_at?: string | null;
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
    lastPlayedAt: row.last_played_at ? toIsoMs(row.last_played_at) : null,
    isPublic: row.is_public,
    playCount: Number(row.play_count ?? 0),
    correctAnswers: Number(row.correct_answers ?? 0),
    incorrectAnswers: Number(row.incorrect_answers ?? 0),
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
  publicPage: 1,
  publicTotal: 0,
  publicTotalPages: 1,
  publicLimit: PUBLIC_PAGE_LIMIT,
  publicQuery: '',
  publicMode: 'all',
  publicLoading: false,
  results: [],
  initialized: false,
  loading: false,
  myPage: 1,
  myTotal: 0,
  myTotalPages: 1,
  myLoading: false,

  init: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true });

    await get().loadPublicPage({ q: '', mode: 'all', page: 1 });

    let results: PracticeResult[] = [];

    if (isRegisteredUser()) {
      const [, hist] = await Promise.all([
        get().loadMyPage({ page: 1 }),
        apiGet<{ resultados: Array<{ id: string; practice_id: string; score: number; correct: number; total: number; completed_at: string }> }>(
          '/api/practicas?scope=results'
        ),
      ]);
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

    set({ results, initialized: true, loading: false });
  },

  loadMyPage: async (opts) => {
    if (!isRegisteredUser()) return;
    const requestedPage = Math.max(1, opts?.page ?? get().myPage);
    const requestId = ++myRequestId;
    const buildUrl = (page: number) =>
      `/api/practicas?scope=mine&page=${page}&limit=${MY_PAGE_LIMIT}`;

    set({ myLoading: true });

    let data = await apiGet<MyPracticesPage>(buildUrl(requestedPage));
    if (requestId !== myRequestId) return;

    let page = data?.page ?? requestedPage;
    if (data && page > data.totalPages) {
      // La pagina dejo de existir: corregir a la ultima valida
      page = data.totalPages;
      data = await apiGet<MyPracticesPage>(buildUrl(page));
      if (requestId !== myRequestId) return;
    }

    set({
      practices: (data?.practicas ?? []).map(mapPractice),
      myPage: data?.page ?? page,
      myTotal: data?.total ?? 0,
      myTotalPages: data?.totalPages ?? 1,
      myLoading: false,
    });
  },

  loadPublicPage: async (opts) => {
    const state = get();
    const q = (opts?.q ?? state.publicQuery).trim();
    const mode = opts?.mode ?? state.publicMode;
    const requestedPage = Math.max(1, opts?.page ?? state.publicPage);
    const requestId = ++publicRequestId;

    const buildUrl = (page: number) => {
      const params = new URLSearchParams({
        scope: 'public',
        page: String(page),
        limit: String(PUBLIC_PAGE_LIMIT),
      });
      if (q) params.set('q', q.slice(0, 100));
      if (mode !== 'all') params.set('mode', mode);
      return `/api/practicas?${params.toString()}`;
    };

    set({ publicLoading: true, publicQuery: q, publicMode: mode });

    let data = await apiGet<PublicPracticesPage>(buildUrl(requestedPage));
    if (requestId !== publicRequestId) return;

    let page = data?.page ?? requestedPage;
    if (data && page > data.totalPages) {
      // La pagina dejo de existir: corregir a la ultima valida
      page = data.totalPages;
      data = await apiGet<PublicPracticesPage>(buildUrl(page));
      if (requestId !== publicRequestId) return;
    }

    set({
      publicPractices: (data?.practicas ?? []).map(mapPractice),
      publicPage: data?.page ?? page,
      publicTotal: data?.total ?? 0,
      publicTotalPages: data?.totalPages ?? 1,
      publicLimit: data?.limit ?? PUBLIC_PAGE_LIMIT,
      publicLoading: false,
    });
  },

  refreshPublic: async () => {
    const state = get();
    await get().loadPublicPage({ q: state.publicQuery, mode: state.publicMode, page: state.publicPage });
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
    // Recargar la pagina 1 del historial: la nueva practica ahi aparece (created_at DESC)
    await get().loadMyPage({ page: 1 });
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
    void get().loadMyPage({ page: get().myPage });
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
    void get().loadMyPage({ page: get().myPage });
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
    void get().loadMyPage({ page: get().myPage });
    return true;
  },

  getUserPractices: () => {
    if (!isRegisteredUser()) return [];
    return get().practices;
  },

  getPublicPractices: () => get().publicPractices,

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

  recordPlayResult: async (practiceId, answers) => {
    if (!isRegisteredUser()) return;
    const data = await apiPost<{
      ok: boolean;
      score: number;
      correct: number;
      incorrect: number;
      total: number;
    }>('/api/practicas', {
      action: 'submit',
      practice_id: practiceId,
      answers,
    });
    if (!data?.ok) return;
    // El servidor califica: el historial local usa sus valores, no los del cliente
    const practice = get().getPracticeById(practiceId);
    const result: PracticeResult = {
      practiceId,
      userId: 0,
      correctAnswers: data.correct,
      incorrectAnswers: data.incorrect,
      totalQuestions: data.total,
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

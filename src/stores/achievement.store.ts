'use client';

import { create } from 'zustand';
import type { AchievementProgress, AchievementEvent } from '@/shared/types/achievement';
import { ACHIEVEMENTS } from '@/shared/lib/achievements-data';
import { onAchievementEvent } from '@/shared/lib/achievement-service';
import { audioManager } from '@/shared/lib/audio';
import { isRegisteredUser } from '@/shared/lib/userStorage';
import { getMatchRoomId } from '@/lib/partida-client';

/** El servidor (PostgreSQL) es la única fuente de verdad del progreso. */
const SYNC_DEBOUNCE_MS = 400;

/** Eventos que indican que una partida terminó (candidate a record_play). */
const TERMINAL_EVENTS: ReadonlySet<AchievementEvent['type']> = new Set([
  'game_completed',
  'game_defeated',
]);

interface LogroRow {
  code: string;
  progreso: number;
  completado: boolean;
  desbloqueado_en: string | null;
}

interface AchievementStore {
  progress: AchievementProgress[];
  newAchievementIds: string[];
  initialized: boolean;
  notificationQueue: string[];
  currentNotification: string | null;
  loading: boolean;

  init: () => Promise<void>;
  markAsReviewed: () => void;
  hasNewAchievements: () => boolean;
  getProgressForId: (id: string) => AchievementProgress | undefined;
  getUnlockedCount: () => number;
  processEvent: (event: AchievementEvent) => void;
  dismissNotification: () => void;
  resetForTesting: () => void;
}

function emptyProgress(): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => ({
    id: def.id,
    progress: 0,
    completed: false,
    unlockedAt: null,
    isNew: false,
  }));
}

function mapLogros(
  logros: LogroRow[],
  nuevos: string[],
  previous: AchievementProgress[]
): AchievementProgress[] {
  const byCode = new Map(logros.map((l) => [l.code, l]));
  const prevById = new Map(previous.map((p) => [p.id, p]));
  const newly = new Set(nuevos);
  return ACHIEVEMENTS.map((def) => {
    const row = byCode.get(def.id);
    const prev = prevById.get(def.id);
    return {
      id: def.id,
      progress: row?.progreso ?? 0,
      completed: row?.completado ?? false,
      unlockedAt: row?.desbloqueado_en ? Date.parse(row.desbloqueado_en) : null,
      isNew: newly.has(def.id) || (prev?.isNew ?? false),
    };
  });
}

export const useAchievementStore = create<AchievementStore>((set, get) => {
  let syncTimer: ReturnType<typeof setTimeout> | null = null;
  let syncInFlight = false;
  let syncQueued = false;

  const enqueueNew = (nuevos: string[]) => {
    if (nuevos.length === 0) return;
    const state = get();
    const queue = [...state.notificationQueue, ...nuevos];
    const currentNotification = state.currentNotification || queue[0];
    const remaining = state.currentNotification ? queue : queue.slice(1);
    if (!state.currentNotification) audioManager.play('success');
    set({
      newAchievementIds: [...state.newAchievementIds, ...nuevos],
      notificationQueue: remaining,
      currentNotification,
    });
  };

  const applyRemote = (logros: LogroRow[], nuevos: string[]) => {
    const state = get();
    const previous = state.progress.length > 0 ? state.progress : emptyProgress();
    set({ progress: mapLogros(logros, nuevos, previous) });
    enqueueNew(nuevos);
  };

  const runSync = async () => {
    if (!isRegisteredUser()) return;
    if (syncInFlight) {
      syncQueued = true;
      return;
    }
    syncInFlight = true;
    try {
      const res = await fetch('/api/logros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.logros)) {
          applyRemote(
            data.logros as LogroRow[],
            Array.isArray(data?.nuevos) ? (data.nuevos as string[]) : []
          );
        }
      }
    } catch {
      /* offline — el próximo evento reintenta */
    } finally {
      syncInFlight = false;
      if (syncQueued) {
        syncQueued = false;
        scheduleSync();
      }
    }
  };

  const scheduleSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void runSync();
    }, SYNC_DEBOUNCE_MS);
  };

  /**
   * Jugada local/práctica terminada (sin sala): registra la partida en el
   * servidor y aplica la respuesta. Si la red falla, cae a un sync normal
   * (el progreso se recupera, la jugada se pierde — el servidor es autoridad).
   */
  const recordSoloPlay = async (event: AchievementEvent) => {
    try {
      const md = event.metadata ?? {};
      const res = await fetch('/api/logros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_play',
          mode: event.mode,
          score: Math.round(md.score ?? 0),
          xp: Math.round(md.xp ?? 0),
          correct: Math.round(md.correct ?? 0),
          total: Math.round(md.total ?? 0),
          best_streak: Math.round(md.bestStreak ?? 0),
          ticks: typeof md.ticks === 'number' ? Math.round(md.ticks) : null,
          completed: event.type === 'game_completed',
          had_error: md.hadError === true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.logros)) {
          applyRemote(
            data.logros as LogroRow[],
            Array.isArray(data?.nuevos) ? (data.nuevos as string[]) : []
          );
        }
        return;
      }
    } catch {
      /* sin red — el próximo evento reintenta */
    }
    scheduleSync();
  };

  return {
    progress: [],
    newAchievementIds: [],
    initialized: false,
    notificationQueue: [],
    currentNotification: null,
    loading: false,

    init: async () => {
      if (get().initialized || get().loading) return;
      set({ loading: true });

      let progress = emptyProgress();
      let nuevos: string[] = [];

      if (isRegisteredUser()) {
        try {
          const res = await fetch('/api/logros', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.logros)) {
              progress = mapLogros(
                data.logros as LogroRow[],
                [],
                progress
              );
              nuevos = Array.isArray(data?.nuevos) ? (data.nuevos as string[]) : [];
            }
          }
        } catch {
          /* sin red — se reintentará con el próximo sync */
        }
      }

      set({ progress, initialized: true, loading: false });

      onAchievementEvent((event) => {
        get().processEvent(event);
      });
      enqueueNew(nuevos);
    },

    markAsReviewed: () => {
      const updated = get().progress.map((p) => (p.isNew ? { ...p, isNew: false } : p));
      set({ progress: updated, newAchievementIds: [] });
    },

    hasNewAchievements: () => {
      return get().progress.some((p) => p.isNew);
    },

    getProgressForId: (id) => {
      return get().progress.find((p) => p.id === id);
    },

    getUnlockedCount: () => {
      return get().progress.filter((p) => p.completed).length;
    },

    /**
     * - Eventos terminales sin sala (local/práctica): record_play registra la
     *   jugada y el servidor la evalúa junto a las partidas en sala.
     * - Eventos terminales en sala: solo sync — la partida ya está en PG y
     *   contarla dos veces duplicaría los acumulados.
     * - El resto: sync con debounce; la práctica (sin evento terminal) no
     *   dispara nada.
     * El progreso y los desbloqueos los calcula el servidor desde PostgreSQL:
     * nada de localStorage ni de contadores manipulables en el cliente.
     */
    processEvent: (event) => {
      if (!isRegisteredUser() || !get().initialized) return;
      if (TERMINAL_EVENTS.has(event.type)) {
        if (getMatchRoomId()) {
          scheduleSync();
          return;
        }
        void recordSoloPlay(event);
        return;
      }
      if (event.metadata?.isPractice) return;
      scheduleSync();
    },

    dismissNotification: () => {
      const { notificationQueue } = get();
      if (notificationQueue.length > 0) {
        const next = notificationQueue[0];
        const rest = notificationQueue.slice(1);
        audioManager.play('success');
        set({ currentNotification: next, notificationQueue: rest });
      } else {
        set({ currentNotification: null });
      }
    },

    resetForTesting: () => {
      set({
        progress: emptyProgress(),
        newAchievementIds: [],
        notificationQueue: [],
        currentNotification: null,
      });
    },
  };
});

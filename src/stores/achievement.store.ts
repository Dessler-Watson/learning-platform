'use client';

import { create } from 'zustand';
import type { AchievementProgress, AchievementEvent } from '@/shared/types/achievement';
import { ACHIEVEMENTS } from '@/shared/lib/achievements-data';
import { onAchievementEvent } from '@/shared/lib/achievement-service';
import { audioManager } from '@/shared/lib/audio';
import { isRegisteredUser, writeUserJson } from '@/shared/lib/userStorage';

/** Ephemeral counter cache only — PG achievement_progress is source of truth for progress/completed/unlockedAt. */
const STATS_BASE = 'eduplay_achievement_stats';

interface AchievementStats {
  [key: string]: number;
}

interface AchievementStore {
  progress: AchievementProgress[];
  stats: AchievementStats;
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

function loadStatsCache(): AchievementStats {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${STATS_BASE}`);
    return raw ? (JSON.parse(raw) as AchievementStats) : {};
  } catch {
    return {};
  }
}

function saveStatsCache(stats: AchievementStats): void {
  writeUserJson(STATS_BASE, stats);
}

function hydrateStatsFromProgress(progress: AchievementProgress[], stats: AchievementStats): AchievementStats {
  const next = { ...stats };
  for (const def of ACHIEVEMENTS) {
    const p = progress.find((x) => x.id === def.id);
    if (!p) continue;
    const cur = next[def.statKey] || 0;
    if (p.progress > cur) next[def.statKey] = p.progress;
    if (p.completed && next[def.statKey] < def.goal) next[def.statKey] = def.goal;
  }
  return next;
}

async function fetchProgressFromApi(): Promise<AchievementProgress[] | null> {
  try {
    const res = await fetch('/api/logros', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const logros: Array<{
      code: string;
      progreso: number;
      completado: boolean;
      desbloqueado_en: string | null;
    }> = data.logros ?? [];
    const map = new Map(logros.map((l) => [l.code, l]));
    return ACHIEVEMENTS.map((def) => {
      const row = map.get(def.id);
      return {
        id: def.id,
        progress: row?.progreso ?? 0,
        completed: row?.completado ?? false,
        unlockedAt: row?.desbloqueado_en ? Date.parse(row.desbloqueado_en) : null,
        isNew: false,
      };
    });
  } catch {
    return null;
  }
}

/** Batch upsert of changed progress rows (single request). */
async function saveProgressBatch(items: Array<{ id: string; progress: number; completed: boolean }>): Promise<void> {
  if (items.length === 0 || !isRegisteredUser()) return;
  try {
    await fetch('/api/logros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((it) => ({
          code: it.id,
          progress: it.progress,
          completed: it.completed,
        })),
      }),
    });
  } catch {
    /* offline — retry on next unlock */
  }
}

function incrementStat(stats: AchievementStats, key: string, amount: number = 1): AchievementStats {
  const current = stats[key] || 0;
  return { ...stats, [key]: current + amount };
}

function updateStatMax(stats: AchievementStats, key: string, value: number): AchievementStats {
  const current = stats[key] || 0;
  if (value > current) return { ...stats, [key]: value };
  return stats;
}

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  progress: [],
  stats: {},
  newAchievementIds: [],
  initialized: false,
  notificationQueue: [],
  currentNotification: null,
  loading: false,

  init: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true });

    let progress = emptyProgress();
    let stats = loadStatsCache();

    if (isRegisteredUser()) {
      const remote = await fetchProgressFromApi();
      if (remote) progress = remote;
    }

    stats = hydrateStatsFromProgress(progress, stats);
    set({ progress, stats, initialized: true, loading: false });

    onAchievementEvent((event) => {
      get().processEvent(event);
    });
  },

  markAsReviewed: () => {
    const updated = get().progress.map((p) =>
      p.isNew ? { ...p, isNew: false } : p
    );
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

  processEvent: (event) => {
    const user = isRegisteredUser();
    if (!user) return;

    const state = get();
    if (!state.initialized) return;

    let newStats = { ...state.stats };
    let newProgress = [...state.progress];
    const newlyUnlocked: string[] = [];

    const isRelevantMode = (mode: string) => event.mode === mode;

    switch (event.type) {
      case 'correct_answer': {
        if (isRelevantMode('decisiones')) {
          newStats = incrementStat(newStats, 'decisiones_correct_answers');
        }
        if (isRelevantMode('lava')) {
          newStats = incrementStat(newStats, 'lava_correct_answers');
        }
        if (event.metadata?.streak !== undefined) {
          if (isRelevantMode('decisiones')) {
            newStats = updateStatMax(newStats, 'decisiones_best_streak', event.metadata.streak);
          }
        }
        break;
      }
      case 'incorrect_answer': {
        break;
      }
      case 'game_completed': {
        if (isRelevantMode('decisiones')) {
          newStats = incrementStat(newStats, 'decisiones_games_completed');
        }
        if (isRelevantMode('lava')) {
          newStats = incrementStat(newStats, 'lava_games_completed');
        }
        if (isRelevantMode('lava') && !event.metadata?.defeated) {
          newStats = incrementStat(newStats, 'lava_games_survived');
        }
        if (event.metadata?.ticks !== undefined && isRelevantMode('lava')) {
          newStats = updateStatMax(newStats, 'lava_max_ticks_reached', event.metadata.ticks);
        }
        if (event.metadata?.accuracy !== undefined) {
          if (isRelevantMode('decisiones')) {
            newStats = updateStatMax(newStats, 'decisiones_best_accuracy', event.metadata.accuracy);
          }
          if (isRelevantMode('lava')) {
            newStats = updateStatMax(newStats, 'lava_best_accuracy', event.metadata.accuracy);
          }
        }
        break;
      }
      case 'game_defeated': {
        if (isRelevantMode('lava') && event.metadata?.ticks !== undefined) {
          newStats = updateStatMax(newStats, 'lava_max_ticks_reached', event.metadata.ticks);
        }
        break;
      }
      case 'score': {
        if (event.metadata?.score !== undefined) {
          if (isRelevantMode('decisiones')) {
            newStats = updateStatMax(newStats, 'decisiones_best_score', event.metadata.score);
          }
          if (isRelevantMode('lava')) {
            newStats = updateStatMax(newStats, 'lava_best_score', event.metadata.score);
          }
        }
        break;
      }
      case 'xp': {
        if (event.metadata?.xp !== undefined) {
          if (isRelevantMode('decisiones')) {
            newStats = incrementStat(newStats, 'decisiones_total_xp', event.metadata.xp);
          }
          if (isRelevantMode('lava')) {
            newStats = incrementStat(newStats, 'lava_total_score', event.metadata.xp);
          }
        }
        break;
      }
      case 'streak': {
        if (event.metadata?.streak !== undefined && isRelevantMode('decisiones')) {
          newStats = updateStatMax(newStats, 'decisiones_best_streak', event.metadata.streak);
        }
        break;
      }
      case 'accuracy': {
        if (event.metadata?.accuracy !== undefined) {
          if (isRelevantMode('decisiones')) {
            newStats = updateStatMax(newStats, 'decisiones_best_accuracy', event.metadata.accuracy);
          }
          if (isRelevantMode('lava')) {
            newStats = updateStatMax(newStats, 'lava_best_accuracy', event.metadata.accuracy);
          }
        }
        break;
      }
      case 'elimination': {
        break;
      }
    }

    if (event.mode === 'tierras' || event.mode === 'abismos') {
      const m = event.mode;
      switch (event.type) {
        case 'correct_answer': {
          newStats = incrementStat(newStats, `${m}_correct_answers`);
          if (event.metadata?.streak !== undefined) {
            newStats = updateStatMax(newStats, `${m}_best_streak`, event.metadata.streak);
          }
          break;
        }
        case 'streak': {
          if (event.metadata?.streak !== undefined) {
            newStats = updateStatMax(newStats, `${m}_best_streak`, event.metadata.streak);
          }
          break;
        }
        case 'score': {
          if (event.metadata?.score !== undefined) {
            newStats = updateStatMax(newStats, `${m}_best_score`, event.metadata.score);
          }
          break;
        }
        case 'game_completed': {
          newStats = incrementStat(newStats, `${m}_games_played`);
          newStats = incrementStat(newStats, `${m}_games_won`);
          newStats = incrementStat(newStats, `${m}_games_survived`);
          if (event.metadata?.accuracy !== undefined && event.metadata.accuracy >= 100) {
            newStats = incrementStat(newStats, `${m}_perfect_games`);
          }
          if (event.metadata?.hadError) {
            newStats = incrementStat(newStats, `${m}_games_after_error`);
          }
          const currentWinStreak = (newStats[`${m}_current_win_streak`] || 0) + 1;
          newStats = { ...newStats, [`${m}_current_win_streak`]: currentWinStreak };
          newStats = updateStatMax(newStats, `${m}_best_win_streak`, currentWinStreak);
          if (newStats[`${m}_after_loss`]) {
            newStats = incrementStat(newStats, `${m}_wins_after_loss`);
            newStats = { ...newStats, [`${m}_after_loss`]: 0 };
          }
          if (event.metadata?.score !== undefined) {
            newStats = incrementStat(newStats, `${m}_total_score`, event.metadata.score);
            newStats = updateStatMax(newStats, `${m}_best_score`, event.metadata.score);
          }
          break;
        }
        case 'game_defeated': {
          newStats = incrementStat(newStats, `${m}_games_played`);
          if (event.metadata?.hadError) {
            newStats = incrementStat(newStats, `${m}_games_after_error`);
          }
          if (event.metadata?.score !== undefined) {
            newStats = incrementStat(newStats, `${m}_total_score`, event.metadata.score);
            newStats = updateStatMax(newStats, `${m}_best_score`, event.metadata.score);
          }
          newStats = { ...newStats, [`${m}_current_win_streak`]: 0, [`${m}_after_loss`]: 1 };
          break;
        }
        default:
          break;
      }
    }

    const updateMetaStats = (stats: AchievementStats): AchievementStats => {
      const updated = { ...stats };
      for (const def of ACHIEVEMENTS) {
        if (def.statKey !== 'tierras_all_unlocked' && def.statKey !== 'abismos_all_unlocked') continue;
        const others = ACHIEVEMENTS.filter(
          (d) => d.mode === def.mode && d.statKey !== def.statKey
        );
        const completedCount = others.filter((d) => {
          const idx = ACHIEVEMENTS.findIndex((a) => a.id === d.id);
          return newProgress[idx]?.completed;
        }).length;
        updated[def.statKey] = completedCount;
      }
      return updated;
    };

    const checkAchievements = (
      stats: AchievementStats,
      progress: AchievementProgress[],
      unlocked: string[],
      onlyMeta: boolean
    ): AchievementProgress[] => {
      const next = [...progress];
      for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        const def = ACHIEVEMENTS[i];
        const isMeta = def.statKey === 'tierras_all_unlocked' || def.statKey === 'abismos_all_unlocked';
        if (onlyMeta !== isMeta) continue;
        const prog = next[i];
        if (!prog || prog.completed) continue;

        const currentStat = stats[def.statKey] || 0;
        const newProgressVal = Math.min(currentStat, def.goal);

        if (newProgressVal !== prog.progress || (currentStat >= def.goal && !prog.completed)) {
          next[i] = { ...prog, progress: newProgressVal };

          if (currentStat >= def.goal && !prog.completed) {
            next[i] = {
              ...next[i],
              completed: true,
              unlockedAt: Date.now(),
              isNew: true,
            };
            unlocked.push(def.id);
          }
        }
      }
      return next;
    };

    newProgress = checkAchievements(newStats, newProgress, newlyUnlocked, false);
    newStats = updateMetaStats(newStats);
    newProgress = checkAchievements(newStats, newProgress, newlyUnlocked, true);

    const dirty = newProgress
      .filter((p, i) => {
        const old = state.progress[i];
        if (!old) return p.progress > 0 || p.completed;
        return p.progress !== old.progress || p.completed !== old.completed;
      })
      .map((p) => ({ id: p.id, progress: p.progress, completed: p.completed }));

    if (dirty.length > 0) {
      void saveProgressBatch(dirty);
    }

    const statsChanged =
      Object.keys(newStats).length !== Object.keys(state.stats).length ||
      Object.entries(newStats).some(([k, v]) => state.stats[k] !== v);

    if (statsChanged) {
      saveStatsCache(newStats);
    }

    if (newlyUnlocked.length > 0) {
      const queue = [...state.notificationQueue, ...newlyUnlocked];
      const currentNotification = state.currentNotification || queue[0];
      const remainingQueue = state.currentNotification ? queue : queue.slice(1);

      if (!state.currentNotification) {
        audioManager.play('success');
      }

      set({
        progress: newProgress,
        stats: newStats,
        newAchievementIds: [...state.newAchievementIds, ...newlyUnlocked],
        notificationQueue: remainingQueue,
        currentNotification,
      });
    } else if (dirty.length > 0 || statsChanged) {
      set({ progress: newProgress, stats: newStats });
    }
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
    const fresh = emptyProgress();
    writeUserJson(STATS_BASE, {});
    set({
      progress: fresh,
      stats: {},
      newAchievementIds: [],
      notificationQueue: [],
      currentNotification: null,
    });
  },
}));

'use client';

import { create } from 'zustand';
import type { AchievementProgress, AchievementEvent } from '@/shared/types/achievement';
import { ACHIEVEMENTS } from '@/shared/lib/achievements-data';
import { onAchievementEvent } from '@/shared/lib/achievement-service';
import { audioManager } from '@/shared/lib/audio';

const STORAGE_KEY = 'eduplay_achievements';
const STATS_KEY = 'eduplay_achievement_stats';
const USER_KEY = 'eduplay_user';

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

  init: () => void;
  markAsReviewed: () => void;
  hasNewAchievements: () => boolean;
  getProgressForId: (id: string) => AchievementProgress | undefined;
  getUnlockedCount: () => number;
  processEvent: (event: AchievementEvent) => void;
  dismissNotification: () => void;
  resetForTesting: () => void;
}

function getUser(): { id_usuario: number; modo: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadProgress(): AchievementProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProgress(progress: AchievementProgress[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadStats(): AchievementStats {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStats(stats: AchievementStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function initProgress(): AchievementProgress[] {
  const existing = loadProgress();
  const existingMap = new Map(existing.map((p) => [p.id, p]));

  return ACHIEVEMENTS.map((def) => {
    const saved = existingMap.get(def.id);
    if (saved) return saved;
    return {
      id: def.id,
      progress: 0,
      completed: false,
      unlockedAt: null,
      isNew: false,
    };
  });
}

function getInitialStats(): AchievementStats {
  const saved = loadStats();
  if (Object.keys(saved).length > 0) return saved;

  return {};
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

  init: () => {
    if (get().initialized) return;
    const progress = initProgress();
    const stats = getInitialStats();
    set({ progress, stats, initialized: true });

    onAchievementEvent((event) => {
      get().processEvent(event);
    });
  },

  markAsReviewed: () => {
    const updated = get().progress.map((p) =>
      p.isNew ? { ...p, isNew: false } : p
    );
    saveProgress(updated);
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
    const user = getUser();
    if (!user || user.modo !== 'registrado') return;

    const state = get();
    let newStats = { ...state.stats };
    let newProgress = [...state.progress];
    const newlyUnlocked: string[] = [];

    const isRelevantMode = (mode: string) =>
      event.mode === mode;

    // Update stats based on event
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
          if (!event.metadata?.defeated) {
            newStats = incrementStat(newStats, 'lava_games_survived');
          }
          if (event.metadata?.ticks !== undefined) {
            newStats = updateStatMax(newStats, 'lava_max_ticks_reached', event.metadata.ticks);
          }
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
        if (isRelevantMode('lava')) {
          if (event.metadata?.ticks !== undefined) {
            newStats = updateStatMax(newStats, 'lava_max_ticks_reached', event.metadata.ticks);
          }
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
        if (event.metadata?.streak !== undefined) {
          if (isRelevantMode('decisiones')) {
            newStats = updateStatMax(newStats, 'decisiones_best_streak', event.metadata.streak);
          }
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

    // Check each achievement
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      const def = ACHIEVEMENTS[i];
      const prog = newProgress[i];
      if (!prog || prog.completed) continue;

      const currentStat = newStats[def.statKey] || 0;
      const newProgressVal = Math.min(currentStat, def.goal);

      if (newProgressVal !== prog.progress || (currentStat >= def.goal && !prog.completed)) {
        newProgress[i] = {
          ...prog,
          progress: newProgressVal,
        };

        if (currentStat >= def.goal && !prog.completed) {
          newProgress[i] = {
            ...newProgress[i],
            completed: true,
            unlockedAt: Date.now(),
            isNew: true,
          };
          newlyUnlocked.push(def.id);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      const queue = [...state.notificationQueue, ...newlyUnlocked];
      const currentNotification = state.currentNotification || queue[0];
      const remainingQueue = state.currentNotification ? queue : queue.slice(1);

      saveProgress(newProgress);
      saveStats(newStats);

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
    } else {
      const progressChanged = newProgress.some((p, i) => p.progress !== state.progress[i]?.progress);
      if (progressChanged) {
        saveProgress(newProgress);
      }
      if (Object.keys(newStats).length !== Object.keys(state.stats).length ||
        Object.entries(newStats).some(([k, v]) => state.stats[k] !== v)) {
        saveStats(newStats);
      }
      if (progressChanged || Object.keys(newStats).length !== Object.keys(state.stats).length ||
        Object.entries(newStats).some(([k, v]) => state.stats[k] !== v)) {
        set({ progress: newProgress, stats: newStats });
      }
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
    const fresh = ACHIEVEMENTS.map((def) => ({
      id: def.id,
      progress: 0,
      completed: false,
      unlockedAt: null,
      isNew: false,
    }));
    saveProgress(fresh);
    localStorage.removeItem(STATS_KEY);
    set({
      progress: fresh,
      stats: {},
      newAchievementIds: [],
      notificationQueue: [],
      currentNotification: null,
    });
  },
}));

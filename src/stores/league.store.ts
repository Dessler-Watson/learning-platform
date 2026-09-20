'use client';
import { create } from 'zustand';
import { getLeagueByStars, getNextLeague, getLeagueProgress, getStarsToNextLeague } from '@/lib/leagues';

const STORAGE_KEY = 'eduplay_stars';

interface LeagueStore {
  stars: number;
  starsEarnedThisGame: number;
  initStars: () => void;
  addStars: (amount: number) => void;
  removeStars: (amount: number) => void;
  setStarsEarnedThisGame: (amount: number) => void;
  resetStarsEarnedThisGame: () => void;
  getCurrentLeague: () => ReturnType<typeof getLeagueByStars>;
  getNextLeagueInfo: () => ReturnType<typeof getNextLeague>;
  getProgress: () => number;
  getStarsToNext: () => number;
}

function loadStars(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const n = parseInt(raw, 10);
      return isNaN(n) ? 0 : n;
    }
  } catch { /* ignore */ }
  return 0;
}

function saveStars(stars: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, String(stars));
  } catch { /* ignore */ }
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  stars: 0,
  starsEarnedThisGame: 0,

  initStars: () => {
    const stars = loadStars();
    set({ stars });
  },

  addStars: (amount) => {
    if (amount <= 0) return;
    const currentStars = loadStars();
    const newStars = currentStars + amount;
    saveStars(newStars);
    set({ stars: newStars });
  },

  removeStars: (amount) => {
    if (amount <= 0) return;
    const currentStars = loadStars();
    const newStars = Math.max(0, currentStars - amount);
    saveStars(newStars);
    set({ stars: newStars });
  },

  setStarsEarnedThisGame: (amount) => set({ starsEarnedThisGame: amount }),

  resetStarsEarnedThisGame: () => set({ starsEarnedThisGame: 0 }),

  getCurrentLeague: () => getLeagueByStars(get().stars),

  getNextLeagueInfo: () => getNextLeague(get().stars),

  getProgress: () => getLeagueProgress(get().stars),

  getStarsToNext: () => getStarsToNextLeague(get().stars),
}));

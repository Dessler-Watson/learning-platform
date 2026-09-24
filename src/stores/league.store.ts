'use client';
import { create } from 'zustand';
import { getLeagueByStars, getNextLeague, getLeagueProgress, getStarsToNextLeague } from '@/lib/leagues';
import { userKey, readUserJson, writeUserJson } from '@/shared/lib/userStorage';

const STORAGE_BASE = 'eduplay_stars';

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
  return readUserJson<number>(STORAGE_BASE, 0);
}

function saveStars(stars: number) {
  writeUserJson(STORAGE_BASE, stars);
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

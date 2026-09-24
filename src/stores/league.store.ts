'use client';
import { create } from 'zustand';
import { getLeagueByStars, getNextLeague, getLeagueProgress, getStarsToNextLeague } from '@/lib/leagues';

/**
 * PostgreSQL is the source of truth for stars/league.
 * addStars/removeStars only update ephemeral UI state (starsEarnedThisGame).
 * Permanent star changes happen only via server (room finish / admin / migrate).
 */
interface LeagueStore {
  stars: number;
  starsEarnedThisGame: number;
  leagueName: string | null;
  leagueImage: string | null;
  leagueColor: string | null;
  loading: boolean;
  initStars: () => Promise<void>;
  refresh: () => Promise<void>;
  addStars: (amount: number) => void;
  removeStars: (amount: number) => void;
  setStarsEarnedThisGame: (amount: number) => void;
  resetStarsEarnedThisGame: () => void;
  getCurrentLeague: () => ReturnType<typeof getLeagueByStars>;
  getNextLeagueInfo: () => ReturnType<typeof getNextLeague>;
  getProgress: () => number;
  getStarsToNext: () => number;
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  stars: 0,
  starsEarnedThisGame: 0,
  leagueName: null,
  leagueImage: null,
  leagueColor: null,
  loading: false,

  initStars: async () => {
    if (get().loading) return;
    await get().refresh();
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/estrellas', { cache: 'no-store' });
      if (!res.ok) {
        set({ loading: false });
        return;
      }
      const data = await res.json();
      const liga = data.liga;
      set({
        stars: Number(data.estrellas ?? 0),
        leagueName: liga?.full_name ?? null,
        leagueImage: liga?.image_path ?? null,
        leagueColor: liga?.color ?? null,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  /** Ephemeral only — does not persist. Server awards real stars. */
  addStars: (amount) => {
    if (amount <= 0) return;
    set({ starsEarnedThisGame: get().starsEarnedThisGame + amount });
  },

  /** Ephemeral only — does not persist. */
  removeStars: (amount) => {
    if (amount <= 0) return;
    set({ starsEarnedThisGame: get().starsEarnedThisGame - amount });
  },

  setStarsEarnedThisGame: (amount) => set({ starsEarnedThisGame: amount }),

  resetStarsEarnedThisGame: () => set({ starsEarnedThisGame: 0 }),

  getCurrentLeague: () => getLeagueByStars(get().stars),

  getNextLeagueInfo: () => getNextLeague(get().stars),

  getProgress: () => getLeagueProgress(get().stars),

  getStarsToNext: () => getStarsToNextLeague(get().stars),
}));

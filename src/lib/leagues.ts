// ============================================================
// LEAGUE CONFIGURATION — Single source of truth
// ============================================================

export interface League {
  id: string;
  name: string;
  tier: 'I' | 'II' | 'III';
  fullName: string;
  starsRequired: number;
  order: number;
  image: string;
  color: string;
}

// Stars earned per correct answer per game mode
export const STARS_PER_CORRECT: Record<string, number> = {
  'camino-decisiones': 10,
  'lava-conocimiento': 15,
};

// League definitions — ordered from lowest to highest
export const LEAGUES: League[] = [
  { id: 'cuarzo-I', name: 'Cuarzo', tier: 'I', fullName: 'Cuarzo I', starsRequired: 0, order: 1, image: '/images/ligas/Cuarzo I.png', color: '#A0A0A0' },
  { id: 'cuarzo-II', name: 'Cuarzo', tier: 'II', fullName: 'Cuarzo II', starsRequired: 100, order: 2, image: '/images/ligas/Cuarzo II.png', color: '#A0A0A0' },
  { id: 'cuarzo-III', name: 'Cuarzo', tier: 'III', fullName: 'Cuarzo III', starsRequired: 250, order: 3, image: '/images/ligas/Cuarzo III.png', color: '#A0A0A0' },

  { id: 'bronce-I', name: 'Bronce', tier: 'I', fullName: 'Bronce I', starsRequired: 450, order: 4, image: '/images/ligas/Bronce I.png', color: '#CD7F32' },
  { id: 'bronce-II', name: 'Bronce', tier: 'II', fullName: 'Bronce II', starsRequired: 700, order: 5, image: '/images/ligas/Bronce II.png', color: '#CD7F32' },
  { id: 'bronce-III', name: 'Bronce', tier: 'III', fullName: 'Bronce III', starsRequired: 1000, order: 6, image: '/images/ligas/Bronce III.png', color: '#CD7F32' },

  { id: 'cobre-I', name: 'Cobre', tier: 'I', fullName: 'Cobre I', starsRequired: 1350, order: 7, image: '/images/ligas/Cobre I.png', color: '#B87333' },
  { id: 'cobre-II', name: 'Cobre', tier: 'II', fullName: 'Cobre II', starsRequired: 1750, order: 8, image: '/images/ligas/Cobre II.png', color: '#B87333' },
  { id: 'cobre-III', name: 'Cobre', tier: 'III', fullName: 'Cobre III', starsRequired: 2200, order: 9, image: '/images/ligas/Cobre III.png', color: '#B87333' },

  { id: 'plata-I', name: 'Plata', tier: 'I', fullName: 'Plata I', starsRequired: 2700, order: 10, image: '/images/ligas/Plata I.png', color: '#94A3B8' },
  { id: 'plata-II', name: 'Plata', tier: 'II', fullName: 'Plata II', starsRequired: 3250, order: 11, image: '/images/ligas/Plata II.png', color: '#94A3B8' },
  { id: 'plata-III', name: 'Plata', tier: 'III', fullName: 'Plata III', starsRequired: 3850, order: 12, image: '/images/ligas/Plata III.png', color: '#94A3B8' },

  { id: 'oro-I', name: 'Oro', tier: 'I', fullName: 'Oro I', starsRequired: 4500, order: 13, image: '/images/ligas/Oro I.png', color: '#F9A825' },
  { id: 'oro-II', name: 'Oro', tier: 'II', fullName: 'Oro II', starsRequired: 5200, order: 14, image: '/images/ligas/Oro II.png', color: '#F9A825' },
  { id: 'oro-III', name: 'Oro', tier: 'III', fullName: 'Oro III', starsRequired: 6000, order: 15, image: '/images/ligas/Oro III.png', color: '#F9A825' },

  { id: 'rubi-I', name: 'Rubí', tier: 'I', fullName: 'Rubí I', starsRequired: 6850, order: 16, image: '/images/ligas/Rubí I.png', color: '#E53935' },
  { id: 'rubi-II', name: 'Rubí', tier: 'II', fullName: 'Rubí II', starsRequired: 7750, order: 17, image: '/images/ligas/Rubí II.png', color: '#E53935' },
  { id: 'rubi-III', name: 'Rubí', tier: 'III', fullName: 'Rubí III', starsRequired: 8700, order: 18, image: '/images/ligas/Rubí III.png', color: '#E53935' },

  { id: 'amatista-I', name: 'Amatista', tier: 'I', fullName: 'Amatista I', starsRequired: 9700, order: 19, image: '/images/ligas/Amatista I.png', color: '#9C27B0' },
  { id: 'amatista-II', name: 'Amatista', tier: 'II', fullName: 'Amatista II', starsRequired: 10750, order: 20, image: '/images/ligas/Amatista II.png', color: '#9C27B0' },
  { id: 'amatista-III', name: 'Amatista', tier: 'III', fullName: 'Amatista III', starsRequired: 11850, order: 21, image: '/images/ligas/Amatista III.png', color: '#9C27B0' },

  { id: 'diamante-I', name: 'Diamante', tier: 'I', fullName: 'Diamante I', starsRequired: 13000, order: 22, image: '/images/ligas/Diamante I.png', color: '#00BCD4' },
  { id: 'diamante-II', name: 'Diamante', tier: 'II', fullName: 'Diamante II', starsRequired: 14200, order: 23, image: '/images/ligas/Diamante II.png', color: '#00BCD4' },
  { id: 'diamante-III', name: 'Diamante', tier: 'III', fullName: 'Diamante III', starsRequired: 15450, order: 24, image: '/images/ligas/Diamante III.png', color: '#00BCD4' },

  { id: 'esmeralda-I', name: 'Esmeralda', tier: 'I', fullName: 'Esmeralda I', starsRequired: 16750, order: 25, image: '/images/ligas/Esmeralda I.png', color: '#4CAF50' },
  { id: 'esmeralda-II', name: 'Esmeralda', tier: 'II', fullName: 'Esmeralda II', starsRequired: 18100, order: 26, image: '/images/ligas/Esmeralda II.png', color: '#4CAF50' },
  { id: 'esmeralda-III', name: 'Esmeralda', tier: 'III', fullName: 'Esmeralda III', starsRequired: 19500, order: 27, image: '/images/ligas/Esmeralda III.png', color: '#4CAF50' },

  { id: 'obsidiana-I', name: 'Obsidiana', tier: 'I', fullName: 'Obsidiana I', starsRequired: 20950, order: 28, image: '/images/ligas/Obsidiana I.png', color: '#7B1FA2' },
  { id: 'obsidiana-II', name: 'Obsidiana', tier: 'II', fullName: 'Obsidiana II', starsRequired: 22450, order: 29, image: '/images/ligas/Obsidiana II.png', color: '#7B1FA2' },
  { id: 'obsidiana-III', name: 'Obsidiana', tier: 'III', fullName: 'Obsidiana III', starsRequired: 24000, order: 30, image: '/images/ligas/Obsidiana III.png', color: '#7B1FA2' },
];

const MAX_STARS = LEAGUES[LEAGUES.length - 1].starsRequired;

// ============================================================
// CORE FUNCTIONS
// ============================================================

/** Get the league for a given star count */
export function getLeagueByStars(stars: number): League {
  let result = LEAGUES[0];
  for (const league of LEAGUES) {
    if (stars >= league.starsRequired) {
      result = league;
    } else {
      break;
    }
  }
  return result;
}

/** Get the next league after the current one (null if max) */
export function getNextLeague(stars: number): League | null {
  const current = getLeagueByStars(stars);
  const idx = LEAGUES.findIndex(l => l.id === current.id);
  if (idx < LEAGUES.length - 1) return LEAGUES[idx + 1];
  return null;
}

/** Get progress (0-100) between current league and next */
export function getLeagueProgress(stars: number): number {
  const current = getLeagueByStars(stars);
  const next = getNextLeague(stars);
  if (!next) return 100;
  const range = next.starsRequired - current.starsRequired;
  if (range <= 0) return 100;
  const progress = stars - current.starsRequired;
  return Math.min(100, Math.round((progress / range) * 100));
}

/** How many stars needed to reach the next league */
export function getStarsToNextLeague(stars: number): number {
  const next = getNextLeague(stars);
  if (!next) return 0;
  return Math.max(0, next.starsRequired - stars);
}

/** Get the image path for a league */
export function getLeagueImage(league: League): string {
  return league.image;
}

/** Check if a league is unlocked given current stars */
export function isLeagueUnlocked(stars: number, league: League): boolean {
  return stars >= league.starsRequired;
}

/** Get the stars earned for a correct answer in a game mode */
export function getStarsForCorrectAnswer(gameMode: string): number {
  return STARS_PER_CORRECT[gameMode] ?? 10;
}

'use client';
import { create } from 'zustand';
import {
  SURVIVAL_MODIFIER_IDS,
  ULTIMA_OPORTUNIDAD_MODIFIER,
} from '@/lib/chaos/survival';

/**
 * Grupo 3 (supervivencia): estado servido por GET /api/partida y por las
 * respuestas de POST /api/partida. Solo lectura local para el HUD y para que
 * cada juego reaccione a la eliminación/escudo; la autoridad (vidas, racha,
 * errores, muerte) sigue siendo SIEMPRE el servidor.
 */
interface SurvivalAnswerLike {
  eliminated?: boolean;
  status?: string;
  vidas?: number;
  racha?: number;
  errores?: number;
  critico?: boolean;
}

interface SurvivalStateLike {
  partida?: { modificadores?: unknown };
  yo?: { estado?: string; vidas?: number; racha?: number; errores?: number; critico?: boolean; respondidas?: unknown[] };
}

export interface SurvivalStore {
  /** Modificadores del Grupo 3 activos en la partida ([] = sin supervivencia). */
  modifiers: string[];
  /** Vidas restantes con 'vida_limitada' (null sin el modificador). */
  vidas: number | null;
  /** Racha actual con 'racha_obligatoria' (null sin el modificador). */
  racha: number | null;
  /** Errores consecutivos con 'error_acumulativo' (null sin el modificador). */
  errores: number | null;
  /** 'ultima_oportunidad': tuvo al menos1 error (banner). */
  critico: boolean;
  /** El servidor lo ha eliminado (a partir de aquí, siempre true). */
  eliminated: boolean;
  /** Ya se recibió al menos1 respuesta/estado del servidor. */
  ingested: boolean;
  reset: () => void;
  /** Ingesta desde el boot (GET /api/partida vía fetchMatchState). */
  ingestState: (state: SurvivalStateLike | null | undefined) => void;
  /** Ingesta desde la respuesta de una pregunta (POST /api/partida). */
  ingestAnswer: (res: SurvivalAnswerLike | null | undefined) => void;
  /**
   * El escudo de 'ultima_oportunidad' protegió el último error: el servidor
   * lo mantiene 'playing'. Los juegos lo usan para NO ejecutar su muerte
   * local cuando el servidor ya decidió que sigue vivo.
   */
  shielded: () => boolean;
}

const EMPTY: Pick<SurvivalStore, 'modifiers' | 'vidas' | 'racha' | 'errores' | 'critico' | 'eliminated' | 'ingested'> = {
  modifiers: [],
  vidas: null,
  racha: null,
  errores: null,
  critico: false,
  eliminated: false,
  ingested: false,
};

export const useSurvivalStore = create<SurvivalStore>((set, get) => ({
  ...EMPTY,
  reset: () => set({ ...EMPTY }),
  ingestState: (state) => {
    const partMods = Array.isArray(state?.partida?.modificadores) ? (state.partida!.modificadores as unknown[]) : [];
    const surv = partMods.filter((m): m is string => SURVIVAL_MODIFIER_IDS.includes(m as (typeof SURVIVAL_MODIFIER_IDS)[number]));
    const yo = state?.yo;
    set({
      modifiers: surv,
      vidas: typeof yo?.vidas === 'number' ? yo.vidas : null,
      racha: typeof yo?.racha === 'number' ? yo.racha : null,
      errores: typeof yo?.errores === 'number' ? yo.errores : null,
      critico: yo?.critico === true,
      eliminated: yo?.estado === 'eliminated',
      ingested: true,
    });
  },
  ingestAnswer: (res) => {
    if (!res) return;
    const s = get();
    set({
      vidas: typeof res.vidas === 'number' ? res.vidas : s.vidas,
      racha: typeof res.racha === 'number' ? res.racha : s.racha,
      errores: typeof res.errores === 'number' ? res.errores : s.errores,
      critico: typeof res.critico === 'boolean' ? res.critico : s.critico,
      eliminated: res.eliminated === true || res.status === 'eliminated' ? true : s.eliminated,
      ingested: true,
    });
  },
  shielded: () => {
    const s = get();
    return s.modifiers.includes(ULTIMA_OPORTUNIDAD_MODIFIER) && s.ingested && !s.eliminated;
  },
}));

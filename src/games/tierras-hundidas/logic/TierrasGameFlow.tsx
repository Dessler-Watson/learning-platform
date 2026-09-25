'use client';
import { useEffect } from 'react';
import { useTierrasStore } from '@/stores/tierras.store';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';
import { getMatchRoomId, fetchMatchState, toStoreQuestion } from '@/lib/partida-client';

export function TierrasGameFlow() {
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const existing = useTierrasStore.getState().questions;
      const roomId = existing.length === 0 ? getMatchRoomId() : null;
      if (roomId) {
        // Paso 4: en modo sala las preguntas vienen de la base de datos.
        try {
          const state = await fetchMatchState(roomId);
          if (!cancelled && state.preguntas.length > 0) {
            useTierrasStore.getState().setQuestions(state.preguntas.map(toStoreQuestion));
          }
        } catch (e) {
          console.error('[TierrasGameFlow] No se pudo cargar la partida:', e);
        }
      }
      if (cancelled) return;
      if (useTierrasStore.getState().questions.length === 0) {
        const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, CFG.questionsPerGame);
        useTierrasStore.getState().setQuestions(pool);
      }
      const t = setTimeout(() => useTierrasStore.getState().setPhase('playing'), 800);
      return () => clearTimeout(t);
    };
    void boot();
    return () => { cancelled = true; };
  }, []);

  return null;
}

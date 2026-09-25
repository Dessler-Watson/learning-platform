'use client';
import { useEffect } from 'react';
import { useLavaStore } from '@/stores/lava.store';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';
import { getMatchRoomId, fetchMatchState, toStoreQuestion } from '@/lib/partida-client';

export function LavaGameFlow() {
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const existing = useLavaStore.getState().questions;
      const roomId = existing.length === 0 ? getMatchRoomId() : null;
      if (roomId) {
        // Paso 4: en modo sala las preguntas vienen de la base de datos.
        try {
          const state = await fetchMatchState(roomId);
          if (!cancelled && state.preguntas.length > 0) {
            useLavaStore.getState().setQuestions(state.preguntas.map(toStoreQuestion));
          }
        } catch (e) {
          console.error('[LavaGameFlow] No se pudo cargar la partida:', e);
        }
      }
      if (cancelled) return;
      if (useLavaStore.getState().questions.length === 0) {
        const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, C.questionsPerGame);
        useLavaStore.getState().setQuestions(pool);
      }
      setTimeout(() => useLavaStore.getState().setPhase('playing'), 400);
      setTimeout(() => useLavaStore.getState().startRound(), 800);
    };
    void boot();
    return () => { cancelled = true; };
  }, []);

  return null;
}

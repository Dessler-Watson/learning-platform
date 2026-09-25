'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game.store';
import { DECISION_ROAD_CONFIG as CFG } from '@/games/decision-road/config';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';
import { getMatchRoomId, fetchMatchState, toStoreQuestion } from '@/lib/partida-client';
const START_Z = 12; const SPACING = 25;
export function GameFlow() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const existing = useGameStore.getState().questions;
      const roomId = existing.length === 0 ? getMatchRoomId() : null;
      if (roomId) {
        // Paso 4: en modo sala las preguntas vienen de la base de datos.
        try {
          const state = await fetchMatchState(roomId);
          if (!cancelled && state.preguntas.length > 0) {
            useGameStore.getState().setQuestions(state.preguntas.map(toStoreQuestion));
          }
        } catch (e) {
          console.error('[GameFlow] No se pudo cargar la partida:', e);
        }
      }
      if (cancelled) return;
      if (useGameStore.getState().questions.length === 0) {
        const pool = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5).slice(0, CFG.questionsPerLevel);
        useGameStore.getState().setQuestions(pool);
      }
      setTimeout(() => useGameStore.getState().setPhase('playing'), 400);
    };
    void boot();
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);
  return null;
}

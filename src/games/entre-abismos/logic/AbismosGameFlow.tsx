'use client';
import { useEffect, useRef } from 'react';
import { useAbismosStore } from '@/stores/abismos.store';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import type { AbismosQuestion } from '@/games/entre-abismos/types';
import { getMatchRoomId, fetchMatchState, toStoreQuestion, postGameRoute } from '@/lib/partida-client';
import { useRoomFinished } from '@/shared/hooks/useRoomFinished';

export function AbismosGameFlow() {
  const questions = useAbismosStore((s) => s.questions);
  const setQuestions = useAbismosStore((s) => s.setQuestions);
  const setPhase = useAbismosStore((s) => s.setPhase);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El docente finalizó la sala: salir a Resultados de inmediato.
  const roomFinished = useRoomFinished(getMatchRoomId());
  useEffect(() => {
    if (!roomFinished) return;
    window.location.href = postGameRoute();
  }, [roomFinished]);

  useEffect(() => {
    const load = async () => {
      if (questions.length > 0) {
        timerRef.current = setTimeout(() => setPhase('questions'), 400);
        return;
      }
      // Paso 4: en modo sala las preguntas vienen de la base de datos.
      const roomId = getMatchRoomId();
      if (roomId) {
        try {
          const state = await fetchMatchState(roomId);
          if (state.preguntas.length > 0) {
            setQuestions(state.preguntas.map(toStoreQuestion) as AbismosQuestion[]);
            // Modificadores de la partida (Caos): mismos datos del boot del
            // match; sin fetch adicional. Solo reflejo local del HUD.
            useAbismosStore.getState().setModifiers(state.partida.modificadores);
            timerRef.current = setTimeout(() => setPhase('questions'), 400);
            return;
          }
        } catch (e) {
          console.error('[AbismosGameFlow] No se pudo cargar la partida:', e);
        }
      }
      try {
        const { dignidadMujerQuestions } = await import('@/education/question-bank/dignidad-mujer');
        const shuffled = [...dignidadMujerQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, CFG.questionsPerGame);
        setQuestions(selected);
        timerRef.current = setTimeout(() => setPhase('questions'), 400);
      } catch (e) {
        console.error('Failed to load questions:', e);
      }
    };
    load();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [setQuestions, setPhase]);

  return null;
}

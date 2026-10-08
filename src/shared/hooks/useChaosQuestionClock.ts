'use client';
import { useEffect, useRef, useState } from 'react';
import { notifyQuestionStarted } from '@/lib/partida-client';

/** Ventana de respuesta por pregunta (ms): solo 'contrarreloj' (10 s).
 * 'pregunta_fugaz' NO es ventana de respuesta: solo oculta el enunciado
 * (hidePromptInMs) y el jugador puede seguir respondiendo. */
function questionWindowMs(modifiers: readonly string[]): number | null {
  if (modifiers.includes('contrarreloj')) return 10_000;
  return null;
}

interface ChaosQuestionClockOptions {
  /** true mientras la pregunta se está mostrando (arranca/mantiene el reloj). */
  active: boolean;
  /** Id de la pregunta visible (al cambiar, todo se reinicia). */
  questionId: string | null | undefined;
  /** Modificadores de la partida (Caos). */
  modifiers: readonly string[];
  /** 'pregunta_fugaz'/'memoria': oculta el enunciado pasados N ms (null = no oculta). */
  hidePromptInMs?: number | null;
  /** 'memoria': oculta las opciones pasados N ms (null = no oculta). */
  hideOptionsInMs?: number | null;
  /** Se dispara UNA vez al agotarse la ventana de contrarreloj. */
  onTimeout?: () => void;
}

export interface ChaosQuestionClockState {
  /** Segundos restantes (10→0) si hay contrarreloj activo; null si no. */
  secondsLeft: number | null;
  /** true cuando ya se cumplió hidePromptInMs en la pregunta actual. */
  hidePrompt: boolean;
  /** true cuando ya se cumplió hideOptionsInMs en la pregunta actual. */
  hideOptions: boolean;
}

/**
 * Único reloj de pregunta para los modificadores de tiempo del Modo Caos:
 * - 'contrarreloj': cuenta 10 s LOCALES desde que la pregunta se muestra;
 *   muestra el contador, llama a onTimeout al llegar a 0 y avisa al servidor
 *   con question_started (la autoridad sigue siendo el backend).
 * - 'pregunta_fugaz' y 'memoria': SIN ventana de respuesta (el jugador puede
 *   seguir respondiendo); solo ocultan enunciado/opciones a los N ms pasados
 *   con hidePromptInMs/hideOptionsInMs (opacity; el texto sigue en el DOM).
 * Todo se reinicia al cambiar de pregunta o al salir de la fase activa y los
 * timers se limpian al desmontar.
 */
export function useChaosQuestionClock(opts: ChaosQuestionClockOptions): ChaosQuestionClockState {
  const { active, questionId, modifiers } = opts;
  const hidePromptInMs = opts.hidePromptInMs ?? null;
  const hideOptionsInMs = opts.hideOptionsInMs ?? null;
  const windowMs = questionWindowMs(modifiers);
  const enabled = active && !!questionId;

  // onTimeout como ref: la función inline del caller no debe reiniciar el reloj.
  const onTimeoutRef = useRef(opts.onTimeout);
  onTimeoutRef.current = opts.onTimeout;

  const [hidePrompt, setHidePrompt] = useState(false);
  const [hideOptions, setHideOptions] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Aviso de inicio de pregunta al servidor (con reloj, una vez por pregunta).
  const notifiedRef = useRef<string | null>(null);
  useEffect(() => {
    if (windowMs == null || !active || !questionId) return;
    if (notifiedRef.current === questionId) return;
    notifiedRef.current = questionId;
    void notifyQuestionStarted(questionId);
  }, [windowMs, active, questionId]);

  // Reloj y ocultados de la pregunta actual.
  useEffect(() => {
    if (!enabled) {
      setHidePrompt(false);
      setHideOptions(false);
      setSecondsLeft(null);
      return;
    }

    setHidePrompt(false);
    setHideOptions(false);
    const startedAt = Date.now();
    const intervals: number[] = [];
    const timeouts: number[] = [];

    if (windowMs != null) {
      setSecondsLeft(Math.ceil(windowMs / 1000));
      let fired = false;
      intervals.push(
        window.setInterval(() => {
          const left = Math.max(0, windowMs - (Date.now() - startedAt));
          setSecondsLeft(Math.ceil(left / 1000));
          if (left <= 0 && !fired) {
            fired = true;
            onTimeoutRef.current?.();
          }
        }, 150)
      );
    }

    if (hidePromptInMs != null && hidePromptInMs >= 0) {
      timeouts.push(window.setTimeout(() => setHidePrompt(true), hidePromptInMs));
    }
    if (hideOptionsInMs != null && hideOptionsInMs >= 0) {
      timeouts.push(window.setTimeout(() => setHideOptions(true), hideOptionsInMs));
    }

    return () => {
      for (const t of intervals) window.clearInterval(t);
      for (const t of timeouts) window.clearTimeout(t);
      setSecondsLeft(null);
      setHidePrompt(false);
      setHideOptions(false);
    };
  }, [enabled, questionId, windowMs, hidePromptInMs, hideOptionsInMs]);

  return {
    secondsLeft: secondsLeft,
    hidePrompt: hidePrompt,
    hideOptions: hideOptions,
  };
}

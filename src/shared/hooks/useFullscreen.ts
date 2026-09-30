'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type DocFS = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type ElFS = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function currentFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const d = document as DocFS;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function requestOnDocumentElement(): Promise<void> {
  const el = document.documentElement as ElFS;
  const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
  if (!request) return Promise.reject(new Error('fullscreen no soportado'));
  return Promise.resolve(request.call(el));
}

function exitFullscreenIfAny(): Promise<void> {
  const d = document as DocFS;
  const exit = document.exitFullscreen ?? d.webkitExitFullscreen;
  if (!exit || !currentFullscreenElement()) return Promise.resolve();
  try {
    return Promise.resolve(exit.call(document));
  } catch {
    return Promise.resolve();
  }
}

/**
 * Fullscreen reutilizable (Fullscreen API con prefijos webkit).
 * - `enter()`/`exit()` nunca lanzan: rechazo del navegador o falta de soporte
 *   devuelven/falsean en silencio para no romper el juego.
 * - `active` sigue los cambios de `fullscreenchange`, así que pulsar ESC del
 *   navegador (que sale del fullscreen) solo actualiza el estado.
 */
export function useFullscreen() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onChange = () => setActive(!!currentFullscreenElement());
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const enter = useCallback(async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;
    try {
      await requestOnDocumentElement();
      return true;
    } catch {
      return false;
    }
  }, []);

  const exit = useCallback(async (): Promise<void> => {
    try {
      await exitFullscreenIfAny();
    } catch {
      // Ignorado a propósito.
    }
  }, []);

  const supported =
    typeof document !== 'undefined' &&
    !!(
      (document.documentElement as ElFS).requestFullscreen ||
      (document.documentElement as ElFS).webkitRequestFullscreen
    );

  return { active, enter, exit, supported };
}

/**
 * Integración para los juegos: entra en fullscreen en la PRIMERA interacción
 * del jugador (toque o tecla) y sale al desmontar (salir del juego). Un solo
 * intento por sesión: si el navegador rechaza o el jugador pulsa ESC para
 * salir, el juego sigue funcionando con normalidad.
 */
export function useGameFullscreen() {
  const { enter, exit } = useFullscreen();
  const attemptedRef = useRef(false);
  const enteredRef = useRef(false);

  useEffect(() => {
    const onFirstInteraction = () => {
      if (attemptedRef.current) return;
      attemptedRef.current = true;
      void (async () => {
        const ok = await enter();
        enteredRef.current = ok && !!currentFullscreenElement();
      })();
    };

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('pointerdown', onFirstInteraction, opts);
    window.addEventListener('touchend', onFirstInteraction, opts);
    window.addEventListener('keydown', onFirstInteraction, opts);

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction, opts);
      window.removeEventListener('touchend', onFirstInteraction, opts);
      window.removeEventListener('keydown', onFirstInteraction, opts);
      if (enteredRef.current && currentFullscreenElement()) void exit();
      enteredRef.current = false;
    };
  }, [enter, exit]);
}

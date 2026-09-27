'use client';

import { useEffect, useState } from 'react';
import { useIsMobile } from './useIsMobile';

/**
 * useLandscapeLock — orientación horizontal obligatoria para los 4 modos de juego.
 *
 * Solo actúa en teléfonos/tablets usando la detección existente (useIsMobile, ancho <= 1024);
 * en escritorio no hace nada (sin listeners, sin bloqueos, sin overlay).
 *
 * Comportamiento:
 *  1. Al activarse intenta bloquear `landscape` con la Screen Orientation API.
 *  2. Si el navegador no permite bloquearlo y el dispositivo queda en vertical,
 *     expone `blocked = true` para que un overlay impida jugar en vertical.
 *  3. Al desmontarse (fin de partida, abandono o vuelta al menú) libera el bloqueo
 *     con `unlock()` y, si se había logrado bloquear, intenta restaurar la
 *     orientación vertical cuando es posible.
 */

let lockGeneration = 0;

// Algunos lib.dom (TS antiguo) no declaran `lock`, así que se tipea aparte.
type OrientationWithOptionalLock = ScreenOrientation & {
  lock?: (angle: 'landscape' | 'portrait') => Promise<void>;
};
type LockableOrientation = ScreenOrientation & {
  lock: (angle: 'landscape' | 'portrait') => Promise<void>;
};

function getScreenOrientation(): OrientationWithOptionalLock | null {
  if (typeof window === 'undefined') return null;
  return (window.screen?.orientation as OrientationWithOptionalLock | undefined) ?? null;
}

function canLock(orientation: OrientationWithOptionalLock | null): orientation is LockableOrientation {
  return !!orientation && typeof orientation.lock === 'function';
}

function safeUnlock(): void {
  try {
    getScreenOrientation()?.unlock();
  } catch {
    // Navegadores sin soporte de Screen Orientation API: no hay nada que liberar.
  }
}

export function useLandscapeLock(enabled = true): { blocked: boolean } {
  const isMobile = useIsMobile();
  const [isPortrait, setIsPortrait] = useState(false);

  // 1) Observar si el dispositivo está en vertical (matchMedia cubre iOS/Safari).
  useEffect(() => {
    if (!isMobile || !enabled) {
      setIsPortrait(false);
      return;
    }
    const media = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(media.matches);
    update();
    media.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, [isMobile, enabled]);

  // 2) Bloquear landscape al entrar; liberar al salir/terminar/abandonar.
  useEffect(() => {
    if (!isMobile || !enabled) return;
    const generation = ++lockGeneration;
    let acquired = false;
    const orientation = getScreenOrientation();

    if (canLock(orientation)) {
      orientation
        .lock('landscape')
        .then(() => {
          // Si otro bloqueo más reciente ya está activo, no tocarlo.
          if (generation === lockGeneration) acquired = true;
        })
        .catch(() => {
          // Navegador que no permite bloquear sin fullscreen: el overlay de
          // vertical (blocked) es el respaldo y evita jugar en vertical.
        });
    }

    const onPageHide = () => safeUnlock();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      safeUnlock();
      // Restaurar vertical "cuando sea posible" solo si este bloqueo sigue vigente;
      // el unlock final evita dejar un bloqueo huérfano si nadie más lo pidió.
      if (acquired && generation === lockGeneration && canLock(orientation)) {
        try {
          orientation
            .lock('portrait')
            .then(() => {
              setTimeout(() => {
                if (generation === lockGeneration) safeUnlock();
              }, 300);
            })
            .catch(() => {
              // No se pudo restaurar vertical: con unlock() ya queda libre.
            });
        } catch {
          // API inestable en este UA: ignorar.
        }
      }
    };
  }, [isMobile, enabled]);

  return { blocked: enabled && isMobile && isPortrait };
}

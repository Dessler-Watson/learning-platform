'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';

export type TouchControlsPref = 'auto' | 'on' | 'off';

const STORAGE_KEY = 'eduplay_touch_controls';

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getTouchControlsPref(): TouchControlsPref {
  if (typeof window === 'undefined') return 'auto';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'on' || v === 'off' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function setTouchControlsPref(pref: TouchControlsPref): TouchControlsPref {
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {}
  emit();
  return pref;
}

export function cycleTouchControlsPref(): TouchControlsPref {
  const order: TouchControlsPref[] = ['auto', 'on', 'off'];
  const next = order[(order.indexOf(getTouchControlsPref()) + 1) % order.length];
  return setTouchControlsPref(next);
}

export function useTouchControlsPref(): TouchControlsPref {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getTouchControlsPref,
    () => 'auto' as const
  );
}

/**
 * Modo "auto": muestra los controles en pantallas estrechas (<=1024px, el
 * comportamiento histórico del CSS) o cuando el puntero principal es táctil
 * (tablets grandes que quedaban sin botones).
 */
export function useAutoTouchControlsVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const narrow =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 1024px)').matches;
      const coarse =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;
      setVisible(narrow || coarse);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return visible;
}

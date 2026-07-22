'use client';
import { useCallback, useEffect, useRef } from 'react';
import type { KeyState } from '@/shared/types/game';
export function useKeyboard() {
  const keysRef = useRef<KeyState>({ forward: false, backward: false, left: false, right: false, jump: false });
  const handleKey = useCallback((e: KeyboardEvent, pressed: boolean) => {
    const keyMap: Record<string, keyof KeyState> = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', Space: 'jump', ArrowUp: 'forward', ArrowDown: 'backward', ArrowLeft: 'left', ArrowRight: 'right' };
    const action = keyMap[e.code];
    if (action) { e.preventDefault(); keysRef.current[action] = pressed; }
  }, []);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [handleKey]);
  return keysRef;
}

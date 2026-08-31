'use client';

import { useCallback, useRef } from 'react';

export function useClickLock(ms = 600) {
  const locked = useRef(false);
  const lock = useCallback(() => {
    if (locked.current) return false;
    locked.current = true;
    setTimeout(() => { locked.current = false; }, ms);
    return true;
  }, [ms]);
  return lock;
}

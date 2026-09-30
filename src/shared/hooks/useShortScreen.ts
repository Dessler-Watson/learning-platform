'use client';

import { useState, useEffect } from 'react';

export function useShortScreen(breakpoint = 500): boolean {
  const [short, setShort] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setShort(window.innerHeight <= breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return short;
}

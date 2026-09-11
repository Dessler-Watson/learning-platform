import type { MutableRefObject } from 'react';

interface HUDTargets {
  checkRef: MutableRefObject<HTMLDivElement | null>;
  crossRef: MutableRefObject<HTMLDivElement | null>;
  starRef: MutableRefObject<HTMLDivElement | null>;
}

export const hudTargets: HUDTargets = {
  checkRef: { current: null },
  crossRef: { current: null },
  starRef: { current: null },
};

export function getTargetCenter(ref: MutableRefObject<HTMLDivElement | null>): { x: number; y: number } | null {
  const el = ref.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

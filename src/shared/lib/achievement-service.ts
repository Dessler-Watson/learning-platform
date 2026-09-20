import type { AchievementEvent } from '@/shared/types/achievement';

const EVENT_LISTENERS: Array<(event: AchievementEvent) => void> = [];

export function recordAchievementEvent(event: AchievementEvent) {
  EVENT_LISTENERS.forEach((listener) => {
    try {
      listener(event);
    } catch {}
  });
}

export function onAchievementEvent(listener: (event: AchievementEvent) => void) {
  EVENT_LISTENERS.push(listener);
  return () => {
    const idx = EVENT_LISTENERS.indexOf(listener);
    if (idx >= 0) EVENT_LISTENERS.splice(idx, 1);
  };
}

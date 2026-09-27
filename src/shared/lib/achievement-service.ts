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

/** Mejor racha de aciertos consecutivos a partir del historial de respuestas. */
export function bestStreakOf(answers: ReadonlyArray<{ correct: boolean }>): number {
  let best = 0;
  let current = 0;
  for (const answer of answers) {
    if (answer.correct) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

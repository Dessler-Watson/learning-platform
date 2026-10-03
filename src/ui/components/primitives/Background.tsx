import { DoodleBackground } from './DoodleBackground';
import type { GameModeId } from '@/shared/lib/game-modes';

export function Background({ variant = null }: { variant?: GameModeId | null } = {}) {
  return <DoodleBackground variant={variant} />;
}

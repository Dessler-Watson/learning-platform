'use client';

import React from 'react';
import {
  ModeLogo,
  MODE_THEME,
  toGameModeId,
  getModeTheme,
} from '@/shared/lib/game-modes';

interface GameIconProps {
  className?: string;
  size?: number;
}

export { ModeLogo, MODE_THEME, toGameModeId, getModeTheme };

export function GameIcon({
  juegoId,
  className,
  size = 24,
}: { juegoId: string } & GameIconProps) {
  const mode = toGameModeId(juegoId);
  if (!mode) return null;
  return (
    <ModeLogo
      mode={mode}
      size={size}
      shape="square"
      showBox={false}
      className={className}
    />
  );
}

export const GAME_ICON_COLORS: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  'juego-1': {
    text: 'text-[#0288D1]',
    bg: 'bg-[#4FC3F7]/35',
    border: 'border-[#4FC3F7]/55',
  },
  'juego-2': {
    text: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/35',
    border: 'border-[#EF4444]/55',
  },
  'juego-3': {
    text: 'text-[#2E7D32]',
    bg: 'bg-[#1B5E20]/40',
    border: 'border-[#1B5E20]/60',
  },
  'juego-4': {
    text: 'text-[#1976D2]',
    bg: 'bg-[#1976D2]/35',
    border: 'border-[#1976D2]/55',
  },
};

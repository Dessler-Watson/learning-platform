'use client';

import React from 'react';

interface GameIconProps {
  className?: string;
  size?: number;
}

export function CaminoDecisionesIcon({ className, size = 24 }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main stem */}
      <path
        d="M12 20V12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left branch */}
      <path
        d="M12 12C12 12 8 10 5 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Right branch */}
      <path
        d="M12 12C12 12 16 10 19 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left dot */}
      <circle cx="5" cy="5" r="2" fill="currentColor" />
      {/* Right dot */}
      <circle cx="19" cy="5" r="2" fill="currentColor" />
      {/* Center dot */}
      <circle cx="12" cy="21" r="2" fill="currentColor" />
    </svg>
  );
}

export function LavaConocimientoIcon({ className, size = 24 }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer flame */}
      <path
        d="M12 2C12 2 6 8 6 14C6 17.314 8.686 20 12 20C15.314 20 18 17.314 18 14C18 8 12 2 12 2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Inner flame */}
      <path
        d="M12 8C12 8 9 12 9 15C9 16.657 10.343 18 12 18C13.657 18 15 16.657 15 15C15 12 12 8 12 8Z"
        fill="white"
        opacity="0.4"
      />
      {/* Flame tip highlight */}
      <path
        d="M12 2C12 2 10 5 10 8C10 9.105 10.895 10 12 10C13.105 10 14 9.105 14 8C14 5 12 2 12 2Z"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
}

const GAME_ICON_MAP: Record<string, React.FC<GameIconProps>> = {
  'juego-1': CaminoDecisionesIcon,
  'juego-2': LavaConocimientoIcon,
};

export function GameIcon({ juegoId, className, size }: { juegoId: string } & GameIconProps) {
  const Icon = GAME_ICON_MAP[juegoId];
  if (!Icon) return null;
  return <Icon className={className} size={size} />;
}

export const GAME_ICON_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'juego-1': { text: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  'juego-2': { text: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
};

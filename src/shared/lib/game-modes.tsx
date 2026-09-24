'use client';

import React from 'react';

export type GameModeId = 'decisiones' | 'lava' | 'tierras' | 'abismos';

export interface GameModeTheme {
  id: GameModeId;
  label: string;
  logo: string;
  /** Solid representative color for buttons */
  color: string;
  /** Darker shade for gradients / hover */
  colorDark: string;
  /** Semi-transparent container background (logo is always inside a box) */
  bg: string;
  /** Border for the logo box */
  border: string;
}

export const MODE_THEME: Record<GameModeId, GameModeTheme> = {
  decisiones: {
    id: 'decisiones',
    label: 'Rumbo',
    logo: '/images/Logos_juegos/rumbo.png',
    color: '#4FC3F7',
    colorDark: '#03A9F4',
    bg: 'rgba(79, 195, 247, 0.35)',
    border: 'rgba(79, 195, 247, 0.55)',
  },
  lava: {
    id: 'lava',
    label: 'Bajo Presión',
    logo: '/images/Logos_juegos/bajo_presion.png',
    color: '#EF4444',
    colorDark: '#C62828',
    bg: 'rgba(239, 68, 68, 0.35)',
    border: 'rgba(239, 68, 68, 0.55)',
  },
  tierras: {
    id: 'tierras',
    label: 'Tierras Hundidas',
    logo: '/images/Logos_juegos/tierras_hundidas.png',
    color: '#1B5E20',
    colorDark: '#0D3B12',
    bg: 'rgba(27, 94, 32, 0.4)',
    border: 'rgba(27, 94, 32, 0.6)',
  },
  abismos: {
    id: 'abismos',
    label: 'Entre Abismos',
    logo: '/images/Logos_juegos/entre_abismos.png',
    color: '#1976D2',
    colorDark: '#0D47A1',
    bg: 'rgba(25, 118, 210, 0.35)',
    border: 'rgba(25, 118, 210, 0.55)',
  },
};

const JUEGO_TO_MODE: Record<string, GameModeId> = {
  'juego-1': 'decisiones',
  'juego-2': 'lava',
  'juego-3': 'tierras',
  'juego-4': 'abismos',
  decisiones: 'decisiones',
  lava: 'lava',
  tierras: 'tierras',
  abismos: 'abismos',
};

export function toGameModeId(id: string | null | undefined): GameModeId | null {
  if (!id) return null;
  return JUEGO_TO_MODE[id] ?? null;
}

export function getModeTheme(id: string | null | undefined): GameModeTheme | null {
  const mode = toGameModeId(id);
  return mode ? MODE_THEME[mode] : null;
}

export function modeButtonGradient(mode: GameModeId): string {
  const t = MODE_THEME[mode];
  return `linear-gradient(90deg, ${t.color}, ${t.colorDark})`;
}

export function modeButtonShadow(mode: GameModeId): string {
  const t = MODE_THEME[mode];
  return `0 4px 0 ${t.colorDark}55`;
}

interface ModeLogoProps {
  mode: GameModeId | string | null | undefined;
  /** Outer box size in px (square or circle) */
  size?: number;
  shape?: 'square' | 'circle';
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Visual scale of the logo relative to the box (can exceed 1). Default 1 */
  imgScale?: number;
  showBox?: boolean;
  alt?: string;
}

export function ModeLogo({
  mode,
  size = 40,
  shape = 'square',
  radius,
  className,
  style,
  imgScale = 1,
  showBox = true,
  alt,
}: ModeLogoProps) {
  const id = toGameModeId(mode);
  if (!id) return null;
  const theme = MODE_THEME[id];
  const borderRadius =
    shape === 'circle'
      ? '50%'
      : radius !== undefined
      ? radius
      : Math.max(6, Math.round(size * 0.28));

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        background: showBox ? theme.bg : 'transparent',
        border: showBox ? `1px solid ${theme.border}` : undefined,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'visible',
        ...style,
      }}
    >
      <img
        src={theme.logo}
        alt={alt ?? theme.label}
        draggable={false}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          maxWidth: 'none',
          maxHeight: 'none',
          flexShrink: 0,
          objectFit: 'contain',
          display: 'block',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${imgScale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

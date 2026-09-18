'use client';

import { type League, getLeagueByStars } from '@/lib/leagues';

interface LeagueBadgeProps {
  league?: League;
  stars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showStars?: boolean;
  locked?: boolean;
  circular?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { img: 24, ring: 32, font: 'text-[9px]' },
  sm: { img: 32, ring: 42, font: 'text-[10px]' },
  md: { img: 48, ring: 60, font: 'text-xs' },
  lg: { img: 64, ring: 80, font: 'text-sm' },
  xl: { img: 96, ring: 120, font: 'text-base' },
};

export function LeagueBadge({
  league,
  stars = 0,
  size = 'md',
  showName = false,
  showStars = false,
  locked = false,
  circular = false,
  className = '',
}: LeagueBadgeProps) {
  const resolvedLeague = league || getLeagueByStars(stars);
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`relative flex items-center justify-center ${circular ? 'rounded-full' : 'rounded-xl'}`}
        style={{
          width: s.ring,
          height: s.ring,
          background: locked ? '#1a1a2e' : '#0d0d1a',
          boxShadow: locked
            ? 'none'
            : `0 0 12px ${resolvedLeague.color}40, 0 0 24px ${resolvedLeague.color}20`,
        }}
      >
        <img
          src={resolvedLeague.image}
          alt={resolvedLeague.fullName}
          draggable={false}
          className="object-contain"
          style={{
            width: s.img,
            height: s.img,
            filter: locked ? 'brightness(0.35) saturate(0.3)' : 'none',
          }}
        />
      </div>
      {showName && (
        <span
          className={`font-black leading-tight ${s.font} ${locked ? 'text-surface-400' : 'text-surface-800'}`}
          style={locked ? {} : { color: resolvedLeague.color }}
        >
          {resolvedLeague.fullName}
        </span>
      )}
      {showStars && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-surface-500">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#F9A825">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {stars.toLocaleString('es-ES')}
        </span>
      )}
    </div>
  );
}

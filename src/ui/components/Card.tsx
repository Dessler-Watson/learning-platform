'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const pads = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ children, className = '', onClick, hover = false, padding = 'md' }: CardProps) {
  const Element = onClick ? motion.button : motion.div;
  return (
    <Element
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
      className={`bg-neutral-0 rounded-2xl shadow-md border border-neutral-100 ${pads[padding]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Element>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, color = '#7C4DFF', size = 'md' }: BadgeProps) {
  const cls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${cls}`}
      style={{ backgroundColor: color + '20', color }}
    >
      {children}
    </span>
  );
}

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  league?: 'bronze' | 'silver' | 'gold' | 'diamond';
}

const dims = { sm: 32, md: 48, lg: 64 };
const leagueColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', diamond: '#B9F2FF' };

export function Avatar({ src, name, size = 'md', league }: AvatarProps) {
  const d = dims[size];
  const borderColor = league ? leagueColors[league] : 'transparent';
  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div
      style={{ width: d, height: d, borderColor, borderWidth: league ? 3 : 0 }}
      className="rounded-full overflow-hidden bg-primary-100 flex items-center justify-center font-extrabold text-primary-600 border-2 border-transparent"
    >
      {src ? (
        <img src={src} alt={name || ''} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: d * 0.4 }}>{initials}</span>
      )}
    </div>
  );
}

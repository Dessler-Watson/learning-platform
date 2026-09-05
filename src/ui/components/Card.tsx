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
      whileHover={hover ? { y: -6, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
      className={`bg-white rounded-3xl shadow-card border border-surface-100 ${pads[padding]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={hover ? { transition: 'box-shadow 0.3s ease' } : {}}
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

export function Badge({ children, color = '#00A0B5', size = 'md' }: BadgeProps) {
  const cls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${cls}`}
      style={{ backgroundColor: color + '18', color }}
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
const leagueColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FDDB33', diamond: '#00A0B5' };

export function Avatar({ src, name, size = 'md', league }: AvatarProps) {
  const d = dims[size];
  const borderColor = league ? leagueColors[league] : 'transparent';
  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div
      style={{ width: d, height: d, borderColor, borderWidth: league ? 3 : 0 }}
      className="rounded-full overflow-hidden bg-edu-blue/10 flex items-center justify-center font-extrabold text-edu-blue border-2 border-transparent"
    >
      {src ? (
        <img src={src} alt={name || ''} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: d * 0.4 }}>{initials}</span>
      )}
    </div>
  );
}

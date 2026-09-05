'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  color?: string;
}

const colorMap: Record<string, { iconBg: string; iconText: string; border: string; glow: string }> = {
  'text-blue-600': {
    iconBg: 'bg-blue-50 border border-blue-100',
    iconText: 'text-blue-500',
    border: 'border-blue-200',
    glow: 'hover:shadow-glow-blue hover:border-blue-300',
  },
  'text-emerald-600': {
    iconBg: 'bg-emerald-50 border border-emerald-100',
    iconText: 'text-emerald-500',
    border: 'border-emerald-200',
    glow: 'hover:shadow-glow-emerald hover:border-emerald-300',
  },
  'text-violet-600': {
    iconBg: 'bg-violet-50 border border-violet-100',
    iconText: 'text-violet-500',
    border: 'border-violet-200',
    glow: 'hover:shadow-glow-violet hover:border-violet-300',
  },
  'text-amber-600': {
    iconBg: 'bg-amber-50 border border-amber-100',
    iconText: 'text-amber-500',
    border: 'border-amber-200',
    glow: 'hover:shadow-glow-amber hover:border-amber-300',
  },
  'text-cyan-600': {
    iconBg: 'bg-[#00A0B5]/10 border border-[#00A0B5]/20',
    iconText: 'text-[#00A0B5]',
    border: 'border-[#00A0B5]/20',
    glow: 'hover:shadow-glow-cyan hover:border-[#00A0B5]/40',
  },
  'text-orange-600': {
    iconBg: 'bg-orange-50 border border-orange-100',
    iconText: 'text-orange-500',
    border: 'border-orange-200',
    glow: 'hover:shadow-glow-orange hover:border-orange-300',
  },
  'text-rose-600': {
    iconBg: 'bg-rose-50 border border-rose-100',
    iconText: 'text-rose-500',
    border: 'border-rose-200',
    glow: 'hover:shadow-glow-rose hover:border-rose-300',
  },
};

export function StatsCard({ label, value, icon: Icon, hint, color = 'text-primary' }: StatsCardProps) {
  const colors = colorMap[color] ?? {
    iconBg: 'bg-[#00A0B5]/10 border border-[#00A0B5]/20',
    iconText: 'text-[#00A0B5]',
    border: 'border-[#00A0B5]/20',
    glow: 'hover:shadow-glow-cyan',
  };

  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const num = typeof value === 'number' ? value : null;
    if (num === null || num === 0) {
      setDisplayValue(num ?? 0);
      return;
    }
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * num));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  const displayText = typeof value === 'number' ? displayValue : value;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, scale: 1.02, zIndex: 10, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } }}
      className={cn(
        'group relative flex items-center gap-4 rounded-3xl border bg-white/90 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 cursor-default z-0 card-shimmer card-corner-decoration overflow-hidden',
        colors.border,
        colors.glow
      )}
    >
      {/* Decorative orb */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.04] pointer-events-none bg-current" />
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
        colors.iconBg
      )}>
        <Icon className={cn('h-5 w-5 transition-transform duration-300 group-hover:scale-110', colors.iconText)} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight tracking-tight text-foreground">{displayText}</p>
        <p className="truncate text-sm text-gray-400 font-medium">{label}</p>
        {hint && <p className="text-xs text-gray-300">{hint}</p>}
      </div>
    </motion.div>
  );
}

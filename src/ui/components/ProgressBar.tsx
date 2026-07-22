'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  animate?: boolean;
}

export function ProgressBar({ value, max = 100, color = '#7C4DFF', showLabel, size = 'md', animate = true }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const h = size === 'sm' ? 6 : 10;

  return (
    <div className="w-full">
      <div style={{ height: h }} className="rounded-full bg-neutral-200 overflow-hidden">
        <motion.div
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ height: '100%', background: color, borderRadius: '999px' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-neutral-500 mt-1 block text-right font-semibold">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

export function XPBar({ value, max = 100 }: { value: number; max?: number }) {
  return <ProgressBar value={value} max={max} color="linear-gradient(90deg, #7C4DFF, #FF6B9D)" size="sm" />;
}

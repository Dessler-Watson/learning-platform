'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { audioManager } from '@/shared/lib/audio';
import { Gamepad2, Lock } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  color: string;
  colorSecondary?: string;
  route: string;
  available: boolean;
  emoji?: string;
}

export function GameCard({ title, description, color, colorSecondary, route, available }: GameCardProps) {
  const secondary = colorSecondary || '#FFEF5A';

  return (
    <motion.div
      whileHover={available ? { y: -6, scale: 1.02 } : {}}
      whileTap={available ? { scale: 0.98, y: 2 } : {}}
      className="w-full overflow-hidden rounded-[28px] bg-white/90"
      style={{
        border: `2px solid ${color}30`,
        boxShadow: `0 4px 0 rgba(0,0,0,0.04), 0 8px 20px ${color}20`,
        opacity: available ? 1 : 0.5,
        cursor: available ? 'pointer' : 'default',
      }}
    >
      <div
        className="relative flex h-36 items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}25, ${secondary}20)` }}
      >
        <motion.div
          animate={available ? { y: [0, -6, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
        >
          <Gamepad2 size={36} />
        </motion.div>
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Lock size={32} color="#fff" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-base font-black text-surface-800">{title}</h3>
        <p className="mb-4 text-xs font-bold leading-relaxed text-surface-500">{description}</p>
        <motion.button
whileHover={available ? { scale: 1.04 } : {}}
          whileTap={available ? { scale: 0.95 } : {}}
          onClick={(e) => { e.stopPropagation(); if (available) { audioManager.play('navigate'); window.location.href = route; } }}
          disabled={!available}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white disabled:cursor-default disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: available ? `0 4px 0 rgba(0,0,0,0.12), 0 6px 18px ${color}40` : 'none',
          }}
        >
          <Gamepad2 size={16} /> Jugar
        </motion.button>
      </div>
    </motion.div>
  );
}

export function GameGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full max-w-3xl grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 px-1">
      {children}
    </div>
  );
}

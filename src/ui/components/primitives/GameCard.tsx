'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { audioManager } from '@/shared/lib/audio';

interface GameCardProps {
  title: string;
  description: string;
  color: string;
  colorSecondary?: string;
  route: string;
  available: boolean;
  emoji: string;
}

export function GameCard({ title, description, color, colorSecondary, route, available, emoji }: GameCardProps) {
  const secondary = colorSecondary || '#FDDB33';
  
  return (
    <motion.div
      whileHover={available ? { y: -8, scale: 1.03 } : {}}
      whileTap={available ? { scale: 0.97 } : {}}
      style={{
        width: '100%',
        borderRadius: 28, overflow: 'hidden',
        background: 'rgba(255,255,255,0.9)',
        border: `2px solid ${color}30`,
        boxShadow: `0 4px 20px ${color}20`,
        opacity: available ? 1 : 0.5,
        cursor: available ? 'pointer' : 'default',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <div
        style={{
          height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${color}25, ${secondary}20)`,
          position: 'relative',
        }}
      >
        <motion.span
          animate={available ? { y: [0, -6, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ fontSize: 56 }}
        >{emoji}</motion.span>
        {!available && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
            <span style={{ fontSize: 32 }}>🔒</span>
          </div>
        )}
      </div>

      <div style={{ padding: '18px 18px 16px' }}>
        <h3 style={{ color: '#344054', fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>{title}</h3>
        <p style={{ color: '#6B7A94', fontSize: 12, margin: '0 0 14px', lineHeight: 1.5 }}>{description}</p>
        <motion.button
          whileHover={available ? { scale: 1.04 } : {}}
          whileTap={available ? { scale: 0.95 } : {}}
          onClick={(e) => { e.stopPropagation(); if (available) { audioManager.play('navigate'); window.location.href = route; } }}
          disabled={!available}
          style={{
            width: '100%', padding: '13px', borderRadius: 16, border: 'none',
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: available ? 'pointer' : 'default',
            boxShadow: `0 4px 16px ${color}40`,
          }}
        >
          🎮 Jugar
        </motion.button>
      </div>
    </motion.div>
  );
}

export function GameGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 20,
      width: '100%',
      maxWidth: 760,
      padding: '0 4px',
    }}>
      {children}
    </div>
  );
}

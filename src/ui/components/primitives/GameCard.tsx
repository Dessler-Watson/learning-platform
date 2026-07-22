'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GameCardProps {
  title: string;
  description: string;
  color: string;
  route: string;
  available: boolean;
  emoji: string;
}

export function GameCard({ title, description, color, route, available, emoji }: GameCardProps) {
  return (
    <motion.div
      whileHover={available ? { y: -6, scale: 1.02 } : {}}
      whileTap={available ? { scale: 0.97 } : {}}
      style={{
        width: '100%',
        borderRadius: 24, overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        opacity: available ? 1 : 0.5,
        cursor: available ? 'pointer' : 'default',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${color}44, ${color}22)`,
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 48 }}>{emoji}</span>
        {!available && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <span style={{ fontSize: 32 }}>🔒</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px 16px 14px' }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>{description}</p>
        <motion.button
          whileHover={available ? { scale: 1.04 } : {}}
          whileTap={available ? { scale: 0.95 } : {}}
          onClick={(e) => { e.stopPropagation(); if (available) window.location.href = route; }}
          disabled={!available}
          style={{
            width: '100%', padding: '12px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: available ? 'pointer' : 'default',
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
      gap: 18,
      width: '100%',
      maxWidth: 760,
      padding: '0 4px',
    }}>
      {children}
    </div>
  );
}

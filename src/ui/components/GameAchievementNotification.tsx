'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useAchievementStore } from '@/stores/achievement.store';
import { ACHIEVEMENTS } from '@/shared/lib/achievements-data';

const DISPLAY_DURATION = 6500;

export function GameAchievementNotification() {
  const currentNotification = useAchievementStore((s) => s.currentNotification);
  const dismissNotification = useAchievementStore((s) => s.dismissNotification);
  const [visible, setVisible] = useState(false);
  const [displayId, setDisplayId] = useState<string | null>(null);

  useEffect(() => {
    if (currentNotification && !visible) {
      setDisplayId(currentNotification);
      setVisible(true);

      let exitTimer: ReturnType<typeof setTimeout>;
      const mainTimer = setTimeout(() => {
        setVisible(false);
        exitTimer = setTimeout(() => {
          dismissNotification();
        }, 500);
      }, DISPLAY_DURATION);

      return () => {
        clearTimeout(mainTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [currentNotification, visible, dismissNotification]);

  const achievement = displayId ? ACHIEVEMENTS.find((a) => a.id === displayId) : null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visible && achievement && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: -30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, x: -40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{
              pointerEvents: 'auto',
              maxWidth: '320px',
              borderRadius: '20px',
              border: '2px solid rgba(255, 239, 90, 0.5)',
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '14px 16px',
              boxShadow: '0 8px 0 rgba(255,239,90,0.15), 0 16px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #FFEF5A, #FFA000)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={24} color="#5A3E00" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#FFEF5A',
                  marginBottom: '2px',
                }}
              >
                Logro desbloqueado
              </p>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {achievement.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

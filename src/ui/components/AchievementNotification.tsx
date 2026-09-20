'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useAchievementStore } from '@/stores/achievement.store';
import { ACHIEVEMENTS } from '@/shared/lib/achievements-data';

const DISPLAY_DURATION = 4000;

export function AchievementNotification() {
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
        }, 400);
      }, DISPLAY_DURATION);

      return () => {
        clearTimeout(mainTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [currentNotification, visible, dismissNotification]);

  const achievement = displayId ? ACHIEVEMENTS.find((a) => a.id === displayId) : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && achievement && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto max-w-xs rounded-2xl border-2 border-[#FFEF5A]/40 bg-white/95 p-4 shadow-lg backdrop-blur-md"
            style={{
              boxShadow: '0 8px 0 rgba(255,239,90,0.2), 0 12px 32px rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFEF5A]">
                <Trophy size={24} className="text-[#8A6D00]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#FFA000]">
                  Logro desbloqueado
                </p>
                <p className="mt-0.5 truncate text-sm font-black text-surface-800">
                  {achievement.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

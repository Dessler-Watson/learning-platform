'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '@/shared/lib/audio';
import { Globe, Music, Volume2, Palette, Settings, X } from 'lucide-react';

const CONTROLS = [
  { icon: Globe, label: 'Idioma', value: 'Espanol', color: '#00A0B5' },
  { icon: Music, label: 'Musica', value: 'Activado', color: '#EB5D70' },
  { icon: Volume2, label: 'Sonidos', value: 'Activado', color: '#FFA000' },
  { icon: Palette, label: 'Tema', value: 'Claro', color: '#98C54E' },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { audioManager.play('modalClose'); onClose(); }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative z-10 w-[88%] max-w-sm rounded-[28px] border-2 border-white/70 bg-edu-cream p-6 shadow-game-lg"
          >
            <div className="mb-5 flex items-center justify-center gap-2">
              <Settings size={22} className="text-edu-blue" />
              <h2 className="text-xl font-black text-surface-800">Ajustes</h2>
            </div>

            <div className="mb-5 flex flex-col gap-2">
              {CONTROLS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/80 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: item.color }}>
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-black text-surface-700">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-surface-500">{item.value}</span>
                  </div>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, y: 2 }}
              onClick={() => { audioManager.play('modalClose'); onClose(); }}
              className="btn-game flex w-full items-center justify-center gap-2 rounded-xl bg-edu-blue py-3.5 text-base text-white"
              style={{ boxShadow: '0 5px 0 rgba(0, 138, 157, 0.4), 0 8px 22px rgba(0,160,181,0.3)' }}
            >
              <X size={18} /> Cerrar
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

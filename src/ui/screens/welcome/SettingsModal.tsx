'use client';

import { motion, AnimatePresence } from 'framer-motion';

const CONTROLS = [
  { icon: '🌐', label: 'Idioma', value: 'Español' },
  { icon: '🎵', label: 'Música', value: 'Activado' },
  { icon: '🔊', label: 'Sonidos', value: 'Activado' },
  { icon: '🎨', label: 'Tema', value: 'Claro' },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              position: 'relative', zIndex: 1,
              background: 'rgba(22,22,34,0.98)', borderRadius: 24,
              padding: '28px 24px 20px', maxWidth: 360, width: '88%',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 12px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 20px', textAlign: 'center' }}>
              ⚙️ Ajustes
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {CONTROLS.map((item) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ color: '#ddd', fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <span style={{ color: '#888', fontSize: 13 }}>{item.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '14px', borderRadius: 16,
                border: 'none', background: 'linear-gradient(135deg, #7C4DFF, #651FFF)',
                color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import { audioManager } from '@/shared/lib/audio';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  perfil: {
    usuario: {
      id_usuario: number;
      nombre: string;
      apellido?: string;
      fecha_registro?: string;
      avatar: { id_avatar: number };
    };
    puntos: number;
    rango: {
      nombre: string;
      color: string;
      esMaximo: boolean;
    };
  };
}

const AVATAR_EMOJIS: Record<number, string> = {
  1: '🧭',
  2: '🔭',
  3: '📚',
  4: '⚔️',
  5: '🪄',
  6: '🥷',
};

const RANGO_IMAGEN: Record<string, string> = {
  Bronce: '/images/rangos/bronce.png',
  Plata: '/images/rangos/plata.png',
  Oro: '/images/rangos/oro.png',
  Diamante: '/images/rangos/diamante.png',
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatFecha(iso?: string): string {
  if (!iso) return 'Fecha desconocida';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Fecha desconocida';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ProfileModal({ open, onClose, perfil }: ProfileModalProps) {
  const avatarEmoji = AVATAR_EMOJIS[perfil.usuario.avatar.id_avatar] || '🧑‍🎓';
  const rangoImagen = RANGO_IMAGEN[perfil.rango.nombre] || '/images/rangos/bronce.png';
  const fullName = [perfil.usuario.nombre, perfil.usuario.apellido || ''].filter(Boolean).join(' ').trim() || 'Jugador';
  const rankColor = perfil.rango.color;

  useEffect(() => {
    if (!open) return;
    audioManager.play('modalOpen');
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { audioManager.play('modalClose'); onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 380, maxHeight: '85vh', overflowY: 'auto',
              background: '#fff', borderRadius: 28,
              padding: '28px 24px 24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              border: '2px solid rgba(0,0,0,0.04)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => { audioManager.play('modalClose'); onClose(); }}
              aria-label="Cerrar perfil"
              style={{
                position: 'absolute', top: 18, right: 18,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#A0ADC4', padding: 4,
              }}
            >
              <X size={22} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{
                width: 96, height: 96, margin: '0 auto 14px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F087A9, #30BCE6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, boxShadow: '0 8px 30px rgba(240,135,169,0.3)',
              }}>
                {avatarEmoji}
              </div>
              <h2 style={{
                fontSize: 24, fontWeight: 900, color: '#1E2A3A', margin: '0 0 6px',
              }}>
                {fullName}
              </h2>

              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 22px', borderRadius: 20,
                background: '#F8FAFE', border: `2px solid ${withAlpha(rankColor, 0.4)}`,
              }}>
                <div style={{
                  width: 72, height: 72,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src={rangoImagen}
                    alt={perfil.rango.nombre}
                    draggable={false}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))',
                    }}
                  />
                </div>
                <span style={{
                  color: rankColor, fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: 1.5, fontSize: 16,
                }}>
                  {perfil.rango.nombre}
                </span>
              </div>

              <div style={{
                fontSize: 20, fontWeight: 800, color: '#1E2A3A', margin: '14px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <img src="/images/puntos.png" alt="Puntos" draggable={false}
                  style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span>{perfil.puntos.toLocaleString('es-ES')}</span>
                <span style={{ color: '#6B7A94', fontWeight: 700, fontSize: 15 }}>puntos</span>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 16,
              background: '#F8FAFE', border: '1px solid rgba(0,0,0,0.04)',
              marginBottom: 22,
            }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <span style={{ color: '#6B7A94', fontSize: 13, fontWeight: 700 }}>
                Miembro desde {formatFecha(perfil.usuario.fecha_registro)}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                audioManager.play('navigate');
                window.location.href = '/configuracion';
              }}
              style={{
                width: '100%', padding: '15px', borderRadius: 18, border: 'none',
                background: 'linear-gradient(135deg, #30BCE6, #1A9FCC)',
                color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 16px rgba(48,188,230,0.35)',
              }}
            >
              <Pencil size={18} />
              Configuración de la cuenta
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

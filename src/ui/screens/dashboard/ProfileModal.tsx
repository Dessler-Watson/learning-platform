'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Check, Settings, Calendar } from 'lucide-react';
import { audioManager } from '@/shared/lib/audio';
import { AvatarPicker } from '@/ui/components/AvatarPicker';
import { avatarImagen as avatarFile } from '@/lib/avatares';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  perfil: {
    usuario: {
      id_usuario: number;
      nombre: string;
      apellido?: string;
      fecha_registro?: string;
      avatar: { id_avatar: number; nombre: string; imagen: string };
    };
    puntos: number;
    rango: {
      nombre: string;
      color: string;
      barColor: string;
      esMaximo: boolean;
      progreso: number;
      puntosRangoActual: number;
      puntosParaSiguiente: number;
      siguiente: string | null;
    };
  };
  isGuest?: boolean;
  onAvatarChange?: (id_avatar: number, imagen: string, nombre: string) => void;
}

const RANGO_IMAGEN: Record<string, string> = {
  Bronce: '/images/rangos/bronce.png',
  Plata: '/images/rangos/plata.png',
  Oro: '/images/rangos/oro.png',
  Diamante: '/images/rangos/diamante.png',
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const itemNoY = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
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

export function ProfileModal({ open, onClose, perfil, isGuest, onAvatarChange }: ProfileModalProps) {
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(perfil.usuario.avatar.id_avatar);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);

  const avatarImagen = `/images/avatares/${perfil.usuario.avatar.imagen}`;
  const rangoImagen = RANGO_IMAGEN[perfil.rango.nombre] || '/images/rangos/bronce.png';
  const fullName = [perfil.usuario.nombre, perfil.usuario.apellido || ''].filter(Boolean).join(' ').trim() || 'Jugador';
  const rankColor = perfil.rango.color;
  const progreso = Math.max(0, Math.min(100, perfil.rango.progreso));
  const maxRango = perfil.rango.esMaximo;

  useEffect(() => {
    setSelectedAvatarId(perfil.usuario.avatar.id_avatar);
    setEditingAvatar(false);
    setAvatarError(null);
    setAvatarSaved(false);
  }, [open, perfil.usuario.avatar.id_avatar]);

  useEffect(() => {
    if (!open) return;
    audioManager.play('modalOpen');
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const guardarAvatar = async () => {
    if (selectedAvatarId === perfil.usuario.avatar.id_avatar) {
      setEditingAvatar(false);
      return;
    }
    setSavingAvatar(true);
    setAvatarError(null);
    setAvatarSaved(false);

    const lookupAvatar = async (id: number) => {
      const res = await fetch('/api/avatares');
      const list = await res.json();
      return list.find((a: any) => a.id_avatar === id) || null;
    };

    try {
      if (isGuest) {
        const avatar = await lookupAvatar(selectedAvatarId);
        const nextAvatar = {
          id_avatar: selectedAvatarId,
          imagen: avatar?.imagen || avatarFile(selectedAvatarId),
          nombre: avatar?.nombre || 'Avatar',
        };
        const raw = localStorage.getItem('eduplay_user');
        if (raw) {
          localStorage.setItem('eduplay_user', JSON.stringify({
            ...JSON.parse(raw),
            avatar_id: selectedAvatarId,
          }));
        }
        if (onAvatarChange) onAvatarChange(nextAvatar.id_avatar, nextAvatar.imagen, nextAvatar.nombre);
        setAvatarSaved(true);
        setSavingAvatar(false);
        setTimeout(() => setEditingAvatar(false), 700);
        return;
      }

      const res = await fetch('/api/estudiante/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: perfil.usuario.id_usuario,
          avatar_id: selectedAvatarId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || 'No se pudo guardar el avatar');
        setSavingAvatar(false);
        return;
      }
      const nuevo = data.usuario.avatar;
      if (onAvatarChange) {
        onAvatarChange(nuevo.id_avatar, nuevo.imagen, nuevo.nombre);
      } else {
        window.location.reload();
      }
      setAvatarSaved(true);
      setSavingAvatar(false);
      setTimeout(() => setEditingAvatar(false), 700);
    } catch {
      setAvatarError('Error al guardar el avatar');
      setSavingAvatar(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { audioManager.play('modalClose'); onClose(); }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(30,20,10,0.45)', backdropFilter: 'blur(7px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[32px] border-[3px] border-white/70 bg-edu-cream p-0"
            style={{ boxShadow: '0 24px 80px rgba(90,50,10,0.30)', scrollbarWidth: 'none' }}
          >
            <motion.button
              onClick={() => { audioManager.play('modalClose'); onClose(); }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              aria-label="Cerrar perfil"
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-black/5 bg-white/70 text-surface-500 shadow-soft transition-colors hover:bg-edu-pink-light/30 hover:text-edu-pink"
            >
              <X size={20} strokeWidth={2.5} />
            </motion.button>

            {/* Content */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="relative z-10 px-6 pb-7 pt-8"
            >
              {/* Header: avatar protagonista */}
              <motion.div variants={itemNoY} className="text-center">
                <div className="relative mx-auto mb-3 h-32 w-32">
                  <div
                    className="absolute -inset-3 rounded-full blur-sm"
                    style={{ background: withAlpha(rankColor, 0.35) }}
                  />
                  <motion.div
                    whileHover={{ scale: editingAvatar ? 1 : 1.03 }}
                    whileTap={{ scale: editingAvatar ? 1 : 0.97 }}
                    onClick={() => { if (!editingAvatar) setEditingAvatar(true); }}
                    title={editingAvatar ? undefined : 'Cambiar avatar'}
                    className="absolute inset-0 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-glow-edu-blue"
                    style={{ background: '#fff7ef' }}
                  >
                    <img
                      src={avatarImagen}
                      alt={perfil.usuario.avatar.nombre}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                    {!editingAvatar && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 text-xs font-black text-white"
                      >
                        <Pencil size={13} /> Editar
                      </motion.span>
                    )}
                  </motion.div>
                </div>

                <motion.h2
                  variants={item}
                  className="text-shadow-soft text-[28px] font-black leading-none text-surface-800"
                >
                  {fullName}
                </motion.h2>
                <motion.div variants={item} className="mt-1 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-surface-500">
                  <span className="h-0.5 w-5 rounded-full bg-gradient-to-r from-transparent to-edu-pink" />
                  Mi perfil
                  <span className="h-0.5 w-5 rounded-full bg-gradient-to-l from-transparent to-edu-blue" />
                </motion.div>
              </motion.div>

              {/* Rango + puntos */}
              <motion.div
                variants={item}
                className="mt-5 overflow-hidden rounded-3xl border-2 p-4"
                style={{
                  background: `linear-gradient(160deg, ${withAlpha(rankColor, 0.12)}, rgba(255,255,255,0.7))`,
                  borderColor: withAlpha(rankColor, 0.25),
                  boxShadow: `0 6px 0 ${withAlpha(rankColor, 0.1)}, 0 8px 24px ${withAlpha(rankColor, 0.1)}`,
                }}
              >
                <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: rankColor }}>
                  Tu rango
                </p>

                <div className="flex items-center justify-center gap-4">
                  <img
                    src={rangoImagen}
                    alt={perfil.rango.nombre}
                    draggable={false}
                    className="h-20 w-20 flex-shrink-0 object-contain"
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 text-lg font-black text-surface-800">
                      <img src="/images/puntos.png" alt="Puntos" draggable={false} className="h-5 w-5 object-contain" />
                      {perfil.puntos.toLocaleString('es-ES')}
                      <span className="text-xs font-bold text-surface-500">puntos</span>
                    </div>
                    <div className="text-sm font-black" style={{ color: rankColor }}>
                      {perfil.rango.nombre}
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-3">
                  <div className="h-3 overflow-hidden rounded-full border border-black/5 bg-black/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxRango ? 100 : progreso}%` }}
                      transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${rankColor}, ${withAlpha(rankColor, 0.55)})` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs font-black text-surface-500">
                    {maxRango ? (
                      <>Has alcanzado el rango maximo!</>
                    ) : (
                      <>Proximo rango: <span style={{ color: rankColor }}>{perfil.rango.siguiente}</span> — faltan <span style={{ color: rankColor }}>{perfil.rango.puntosParaSiguiente.toLocaleString('es-ES')}</span> puntos</>
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Informacion del jugador */}
              <motion.div
                variants={item}
                className="card-game mt-4 flex items-center gap-3 p-3"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-edu-pink-light/30 text-edu-pink shadow-glow-edu-pink">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-surface-500">Miembro desde</div>
                  <div className="text-sm font-black text-surface-800">{formatFecha(perfil.usuario.fecha_registro)}</div>
                </div>
              </motion.div>

              {/* Creditos de puntos estilo recompensa */}
              <motion.div
                variants={item}
                className="mt-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-edu-yellow/40 bg-gradient-to-r from-edu-yellow-light to-[#FFE9BC] p-3"
                style={{ boxShadow: '0 6px 0 rgba(249,168,37,0.15), 0 8px 24px rgba(249,168,37,0.15)' }}
              >
                <StarBadge />
                <div className="text-center">
                  <div className="text-2xl font-black leading-none text-surface-800">{perfil.puntos.toLocaleString('es-ES')}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#B0770A]">Puntos totales</div>
                </div>
                <StarBadge />
              </motion.div>

              {/* Edicion de avatar */}
              <AnimatePresence>
                {editingAvatar && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="rounded-2xl border-2 border-black/5 bg-white/75 p-4">
                      <p className="mb-3 text-center text-xs font-black text-surface-500">
                        Elige tu nuevo avatar
                      </p>
                      <AvatarPicker selected={selectedAvatarId} onSelect={setSelectedAvatarId} compact />

                      {(avatarError || avatarSaved) && (
                        <p className={`mt-3 text-center text-xs font-black ${avatarError ? 'text-edu-pink' : 'text-edu-green-dark'}`}>
                          {avatarSaved && <Check size={14} className="mr-1 inline align-middle" />}
                          {avatarError || 'Avatar actualizado'}
                        </p>
                      )}

                      <div className="mt-4 flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 2 }}
                          onClick={() => { setEditingAvatar(false); setAvatarError(null); setAvatarSaved(false); }}
                          disabled={savingAvatar}
                          className="flex-1 rounded-xl border-2 border-surface-200 bg-edu-cream py-3 text-sm font-black text-surface-500 shadow-card"
                        >
                          Cancelar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 2 }}
                          onClick={guardarAvatar}
                          disabled={savingAvatar}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-edu-blue py-3 text-sm font-black text-white shadow-glow-edu-blue disabled:opacity-70"
                        >
                          <Check size={16} strokeWidth={3} />
                          {savingAvatar ? 'Guardando...' : 'Guardar'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Configuracion de cuenta */}
              <motion.button
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97, y: 2 }}
                onClick={() => { audioManager.play('navigate'); window.location.href = '/configuracion'; }}
                className="card-game mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-black text-surface-500 transition-colors hover:bg-white/90 hover:text-surface-700"
              >
                <Settings size={16} />
                Configuracion de la cuenta
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StarBadge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#F9A825">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

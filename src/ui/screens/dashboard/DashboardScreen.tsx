'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Sparkles, Gamepad2, Trophy } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { ProfileModal } from './ProfileModal';
import { audioManager } from '@/shared/lib/audio';

interface StoredUser {
  id_usuario: number;
  nombre: string;
  avatar_id: number;
  correo?: string;
  modo: 'registrado' | 'invitado';
}

interface Perfil {
  usuario: {
    id_usuario: number;
    nombre: string;
    apellido?: string;
    correo?: string;
    fecha_registro?: string;
    avatar: {
      id_avatar: number;
      nombre: string;
      imagen: string;
    };
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
}

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

const DEFAULT_PERFIL: Perfil = {
  usuario: {
    id_usuario: 0,
    nombre: 'Jugador',
    apellido: '',
    fecha_registro: new Date().toISOString(),
    avatar: { id_avatar: 1, nombre: 'Sacuanjoche', imagen: 'avatar1.png' },
  },
  puntos: 0,
  rango: {
    nombre: 'Bronce',
    color: '#B87333',
    barColor: 'linear-gradient(90deg, #B87333, #CD7F32)',
    esMaximo: false,
    progreso: 0,
    puntosRangoActual: 0,
    puntosParaSiguiente: 1000,
    siguiente: 'Plata',
  },
};

export function DashboardScreen() {
  const [perfil, setPerfil] = useState<Perfil>(DEFAULT_PERFIL);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFocused, setAvatarFocused] = useState(false);
  const [salaCode, setSalaCode] = useState('');
  const [salaLoading, setSalaLoading] = useState(false);
  const [salaError, setSalaError] = useState<string | null>(null);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('eduplay_user') : null;
    if (!raw) {
      window.location.href = '/estudiante';
      return;
    }

    const stored: StoredUser = JSON.parse(raw);

    const t1 = setTimeout(() => {
      audioManager.playWelcome();
    }, 800);

    if (stored.modo === 'invitado') {
      setIsGuest(true);
      setPerfil({
        ...DEFAULT_PERFIL,
        usuario: {
          ...DEFAULT_PERFIL.usuario,
          id_usuario: stored.id_usuario,
          nombre: stored.nombre,
          avatar: {
            ...DEFAULT_PERFIL.usuario.avatar,
            id_avatar: stored.avatar_id,
            imagen: `avatar${stored.avatar_id}.png`,
          },
        },
      });
      setLoading(false);
      return () => clearTimeout(t1);
    }

    fetch(`/api/estudiante/perfil?usuario_id=${stored.id_usuario}`)
      .then(res => res.json())
      .then((data: Perfil) => {
        if (data.usuario) setPerfil(data);
      })
      .catch(() => setPerfil(DEFAULT_PERFIL))
      .finally(() => setLoading(false));

    return () => clearTimeout(t1);
  }, []);

  const unirseASala = (e: React.FormEvent) => {
    e.preventDefault();
    setSalaError(null);
    const codigo = salaCode.trim();
    if (!codigo) {
      setSalaError('Ingresa un codigo de sala');
      audioManager.play('error');
      return;
    }
    window.location.href = `/sala-espera?codigo=${encodeURIComponent(codigo)}`;
  };

  const avatarImagen = `/images/avatares/${perfil.usuario.avatar.imagen}`;
  const rangoImagen = RANGO_IMAGEN[perfil.rango.nombre] || '/images/rangos/bronce.png';
  const rankColor = perfil.rango.color;

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4">
        <Background />
        <div className="relative z-10 text-surface-500 font-extrabold">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-5 pb-10 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        {/* Encabezado */}
        <header className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { audioManager.play('click'); setProfileOpen(true); }}
            onFocus={() => setAvatarFocused(true)}
            onBlur={() => setAvatarFocused(false)}
            aria-label="Abrir mi perfil"
            title="Mi perfil"
            className="group flex items-center gap-3 rounded-full p-2 pr-4 shadow-card transition-all hover:shadow-card-hover"
            style={{
              background: '#EB5D70',
              border: 'none',
              boxShadow: avatarFocused ? `0 0 0 3px ${rankColor}40, 0 6px 20px rgba(0,0,0,0.08)` : undefined,
            }}
          >
            <div
              className="h-12 w-12 overflow-hidden rounded-xl"
              style={{ background: '#fff7ef' }}
            >
              <img
                src={avatarImagen}
                alt={perfil.usuario.avatar.nombre}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-left">
              <div className="text-lg font-extrabold leading-tight text-white">
                {perfil.usuario.nombre}
              </div>
              <div className="text-xs font-bold text-white/85">Bienvenido de nuevo!</div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <IconBtn onClick={() => { audioManager.play('click'); window.location.href = '/configuracion'; }} ariaLabel="Configuracion">
              <Settings size={20} />
            </IconBtn>
            <IconBtn onClick={() => { audioManager.play('click'); }} ariaLabel="Notificaciones" badge>
              <Bell size={20} />
            </IconBtn>
          </div>
        </header>

        {/* Tarjeta de rango principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="card-game card-game-hover mb-5 overflow-hidden"
          style={{ border: `2px solid ${withAlpha(rankColor, 0.18)}` }}
        >
          {/* Franja de color superior segun rango */}
          <div
            className="h-3 w-full"
            style={{ background: rankColor }}
          />

          <div className="px-5 pb-5 pt-4 text-center">
            <span
              className="mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]"
              style={{ background: withAlpha(rankColor, 0.12), color: rankColor }}
            >
              Tu rango actual
            </span>

            <div className="mx-auto mb-2 flex h-40 w-40 items-center justify-center">
              <img
                src={rangoImagen}
                alt={perfil.rango.nombre}
                draggable={false}
                className="h-full w-full object-contain drop-shadow-lg"
              />
            </div>

            <h2 className="mb-1 text-2xl font-black text-surface-800">
              {perfil.rango.nombre}
            </h2>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: withAlpha(rankColor, 0.1) }}
            >
              <img src="/images/puntos.png" alt="Puntos" draggable={false} className="h-5 w-5 object-contain" />
              <span className="text-lg font-black text-surface-800">
                {perfil.puntos.toLocaleString('es-ES')}
              </span>
              <span className="text-xs font-bold text-surface-500">puntos</span>
            </div>

            {/* Barra de progreso */}
            <div
              className="mb-2 h-4 overflow-hidden rounded-full border"
              style={{ background: '#FFF3E0', borderColor: 'rgba(0,0,0,0.05)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${perfil.rango.progreso}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${rankColor}, ${withAlpha(rankColor, 0.7)})` }}
              />
            </div>

            <p className="text-xs font-bold text-surface-500">
              {perfil.rango.esMaximo
                ? 'Has alcanzado el rango maximo!'
                : `Proximo rango: ${perfil.rango.siguiente} — faltan ${perfil.rango.puntosParaSiguiente} puntos`}
            </p>
          </div>
        </motion.div>

        {/* Card: Unirse a una sala (CTA principal) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative overflow-hidden rounded-[28px]"
          style={{
            background: 'linear-gradient(90deg, #F478B0 0%, #E85D70 100%)',
            boxShadow: '0 8px 0 rgba(224, 90, 20, 0.35), 0 12px 32px rgba(244, 120, 176, 0.35)',
          }}
        >
          <Sparkles size={16} color="rgba(255,255,255,0.45)" className="absolute right-5 top-5" />

          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <Gamepad2 size={22} color="#fff" />
              <h2 className="text-xl font-black text-white">Unirse a una sala</h2>
            </div>
            <p className="mb-5 text-sm font-bold text-white/85">
              Ingresa el codigo que te dio tu docente para comenzar a jugar.
            </p>

            <form onSubmit={(e) => { audioManager.play('submit'); unirseASala(e); }} className="flex items-stretch gap-3">
              <input
                value={salaCode}
                onChange={(e) => setSalaCode(e.target.value.toUpperCase())}
                placeholder="Ingresa el codigo"
                disabled={salaLoading}
                className="input-game flex-1 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider"
              />
              <motion.button
                whileHover={{ scale: salaLoading ? 1 : 1.03 }}
                whileTap={{ scale: salaLoading ? 1 : 0.97, y: 2 }}
                type="submit"
                disabled={salaLoading}
                className="rounded-xl bg-[#407516] px-5 py-3 text-sm font-black text-white shadow-game-sm"
              >
                {salaLoading ? 'Uniendo...' : 'Unirse'}
              </motion.button>
            </form>

            {salaError && (
              <p className="mt-3 text-xs font-bold text-white text-shadow-game">
                {salaError}
              </p>
            )}
          </div>
        </motion.div>

        {/* Accesos rapidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 grid grid-cols-2 gap-4"
        >
          <QuickCard
            icon={<Trophy size={22} />}
            label="Logros"
            color="#FFEF5A"
            text="#8A6D00"
            onClick={() => {}}
          />
          <QuickCard
            icon={<Sparkles size={22} />}
            label="Proximos retos"
            color="#B2E0EF"
            text="#006A7A"
            onClick={() => {}}
          />
        </motion.div>
      </motion.div>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        perfil={perfil}
        isGuest={isGuest}
        onAvatarChange={(id_avatar, imagen, nombre) => {
          setPerfil(prev => ({
            ...prev,
            usuario: {
              ...prev.usuario,
              avatar: { id_avatar, imagen, nombre },
            },
          }));
        }}
      />
    </main>
  );
}

function IconBtn({ children, onClick, ariaLabel, badge }: { children: React.ReactNode; onClick: () => void; ariaLabel: string; badge?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92, y: 2 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFEF5A] text-[#407516] shadow-card"
      style={{ boxShadow: '0 4px 0 rgba(64, 117, 22, 0.2), 0 6px 20px rgba(255, 239, 90, 0.25)' }}
    >
      {children}
      {badge && (
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-edu-pink" />
      )}
    </motion.button>
  );
}

function QuickCard({ icon, label, color, text, onClick }: { icon: React.ReactNode; label: string; color: string; text: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97, y: 2 }}
      onClick={onClick}
      className="card-game flex items-center gap-3 p-4 text-left"
      style={{ borderLeft: `5px solid ${color}` }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: color, color: text }}
      >
        {icon}
      </div>
      <span className="text-sm font-black text-surface-700">{label}</span>
    </motion.button>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Sparkles, Gamepad2, Trophy, Brain } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { ProfileModal } from './ProfileModal';
import { LeagueBadge } from '@/ui/components/LeagueBadge';
import { useLeagueStore } from '@/stores/league.store';
import { getLeagueByStars, getNextLeague, getLeagueProgress, getStarsToNextLeague } from '@/lib/leagues';
import { audioManager } from '@/shared/lib/audio';
import { avatarImagen as avatarFile } from '@/lib/avatares';
import { useAchievementStore } from '@/stores/achievement.store';
import { AchievementNotification } from '@/ui/components/AchievementNotification';

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

function StarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#F9A825">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const DEFAULT_PERFIL: Perfil = {
  usuario: {
    id_usuario: 0,
    nombre: 'Jugador',
    apellido: '',
    fecha_registro: new Date().toISOString(),
    avatar: { id_avatar: 1, nombre: 'Güegüense', imagen: 'gueguense.png' },
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
  const [showAuthModal, setShowAuthModal] = useState(false);

  const stars = useLeagueStore((s) => s.stars);
  const initStars = useLeagueStore((s) => s.initStars);

  const achievementInit = useAchievementStore((s) => s.init);
  const hasNewAchievements = useAchievementStore((s) => s.hasNewAchievements);

  useEffect(() => {
    initStars();
    achievementInit();
  }, [initStars, achievementInit]);

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
            imagen: avatarFile(stored.avatar_id),
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
  const rankColor = perfil.rango.color;

  const currentLeague = getLeagueByStars(stars);
  const nextLeague = getNextLeague(stars);
  const progress = getLeagueProgress(stars);
  const starsToNext = getStarsToNextLeague(stars);

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
        <header className="relative z-20 mb-6 flex items-center justify-between">
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

        {/* Tarjeta de liga principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="card-game card-game-hover mb-5 overflow-hidden cursor-pointer"
          style={{ border: `2px solid ${withAlpha(currentLeague.color, 0.18)}` }}
          onClick={() => { audioManager.play('click'); window.location.href = '/ligas'; }}
        >
          {/* Fondo espacial preparado */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(30,40,80,0.9) 0%, rgba(10,10,30,0.95) 100%)',
            }}
          />

          {/* Franja de color superior segun liga */}
          <div
            className="h-3 w-full"
            style={{ background: currentLeague.color }}
          />

          <div className="relative px-5 pb-5 pt-4 text-center">
            <span
              className="mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]"
              style={{ background: withAlpha(currentLeague.color, 0.12), color: currentLeague.color }}
            >
              Tu liga actual
            </span>

            <div className="mx-auto mb-2 flex h-36 w-36 items-center justify-center">
              <LeagueBadge league={currentLeague} size="xl" circular />
            </div>

            <h2 className="mb-1 text-2xl font-black text-surface-800">
              {currentLeague.fullName}
            </h2>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: withAlpha(currentLeague.color, 0.1) }}
            >
              <StarIcon size={18} />
              <span className="text-lg font-black text-surface-800">
                {stars.toLocaleString('es-ES')}
              </span>
              <span className="text-xs font-bold text-surface-500">estrellas</span>
            </div>

            {/* Barra de progreso */}
            <div
              className="mb-2 h-4 overflow-hidden rounded-full border"
              style={{ background: '#FFF3E0', borderColor: 'rgba(0,0,0,0.05)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${currentLeague.color}, ${withAlpha(currentLeague.color, 0.7)})` }}
              />
            </div>

            <p className="text-xs font-bold text-surface-500">
              {nextLeague
                ? `Proxima liga: ${nextLeague.fullName} — faltan ${starsToNext.toLocaleString('es-ES')} estrellas`
                : 'Has alcanzado la liga maxima!'}
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

        {/* Card: Modo práctica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative mt-5 overflow-hidden rounded-[28px]"
          style={{
            background: 'linear-gradient(90deg, #00A0B5 0%, #008A9D 100%)',
            boxShadow: '0 8px 0 rgba(0, 100, 120, 0.35), 0 12px 32px rgba(0, 160, 181, 0.35)',
          }}
        >
          <Brain size={16} color="rgba(255,255,255,0.45)" className="absolute right-5 top-5" />

          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <Brain size={22} color="#fff" />
              <h2 className="text-xl font-black text-white">Modo práctica</h2>
            </div>
            <p className="mb-5 text-sm font-bold text-white/85">
              Practica por tu cuenta con preguntas generadas por IA.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97, y: 2 }}
              onClick={() => { audioManager.play('click'); window.location.href = '/practica'; }}
              className="rounded-xl bg-white px-6 py-3 text-sm font-black shadow-game-sm"
              style={{ color: '#008A9D' }}
            >
              Practicar
            </motion.button>
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
            showDot={isGuest ? false : hasNewAchievements()}
            onClick={() => {
              audioManager.play('click');
              if (isGuest) {
                setShowAuthModal(true);
              } else {
                window.location.href = '/logros';
              }
            }}
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

      {/* Auth Modal for achievements */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative z-10 w-full max-w-sm rounded-[28px] border-2 border-white/70 bg-[#FFF7F2]/95 p-7 shadow-xl backdrop-blur-xl"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFEF5A]/20">
                <Trophy size={28} className="text-[#FFA000]" />
              </div>
              <h2 className="mb-2 text-xl font-black text-surface-800">Necesitas una cuenta</h2>
              <p className="text-sm font-bold text-surface-500 mb-6">
                Los logros se guardan en tu cuenta. Crea una cuenta para comenzar a desbloquear y guardar tus logros.
              </p>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97, y: 2 }}
                  onClick={() => { audioManager.play('navigate'); window.location.href = '/registro'; }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#407516] px-6 py-3.5 text-sm font-black text-white"
                  style={{ boxShadow: '0 6px 0 rgba(64, 117, 22, 0.4), 0 8px 24px rgba(64,117,22,0.3)' }}
                >
                  Crear cuenta
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { audioManager.play('modalClose'); setShowAuthModal(false); }}
                  className="w-full rounded-xl px-6 py-3 text-sm font-black text-surface-400"
                >
                  Cerrar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AchievementNotification />
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

function QuickCard({ icon, label, color, text, onClick, showDot }: { icon: React.ReactNode; label: string; color: string; text: string; onClick: () => void; showDot?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97, y: 2 }}
      onClick={onClick}
      className="card-game relative flex items-center gap-3 p-4 text-left"
      style={{ borderLeft: `5px solid ${color}` }}
    >
      {showDot && (
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#EB5D70]" style={{ boxShadow: '0 0 6px rgba(235, 93, 112, 0.5)' }} />
      )}
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

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, CheckCircle, XCircle, Star, ArrowRight, Home, Users, Medal } from 'lucide-react';
import { useGameStore } from '@/stores/game.store';
import type { GameResult } from '@/games/decision-road/types';

/* ------------------------------------------------------------------ */
/*  MOCK RANKING  (simulacion — reemplazar luego por datos reales)    */
/* ------------------------------------------------------------------ */

const MOCK_CLASSMATES = [
  { id: 1, nombre: 'Sofia M.', avatar: '/images/avatares/avatar2.png', puntos: 3450, rango: 'Oro' },
  { id: 2, nombre: 'Carlos R.', avatar: '/images/avatares/avatar4.png', puntos: 3120, rango: 'Plata' },
  { id: 4, nombre: 'Ana L.', avatar: '/images/avatares/avatar6.png', puntos: 2650, rango: 'Plata' },
  { id: 5, nombre: 'Diego P.', avatar: '/images/avatares/avatar8.png', puntos: 2400, rango: 'Bronce' },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function avatarUrl(imagen: string): string {
  return `/images/avatares/${imagen}`;
}

function rangoImagen(nombre: string): string {
  const map: Record<string, string> = {
    Bronce: '/images/rangos/bronce.png',
    Plata: '/images/rangos/plata.png',
    Oro: '/images/rangos/oro.png',
    Diamante: '/images/rangos/diamante.png',
  };
  return map[nombre] || '/images/rangos/bronce.png';
}

/* ------------------------------------------------------------------ */
/*  COMPONENTE PRINCIPAL                                               */
/* ------------------------------------------------------------------ */

interface PerfilData {
  usuario: {
    id_usuario: number;
    nombre: string;
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
}

export function ResultsScreen() {
  const phase = useGameStore((s) => s.phase);
  const result = useGameStore((s) => s.result);
  const show = phase === 'results' && result !== null;

  const [view, setView] = useState<'simple' | 'full'>('simple');
  const [perfil, setPerfil] = useState<PerfilData | null>(null);

  useEffect(() => {
    if (!show) return;
    const raw = typeof window !== 'undefined' ? localStorage.getItem('eduplay_user') : null;
    if (!raw) return;
    const user = JSON.parse(raw);
    if (!user?.id_usuario) return;

    fetch(`/api/estudiante/perfil?usuario_id=${user.id_usuario}`)
      .then((r) => r.json())
      .then((data: PerfilData) => setPerfil(data))
      .catch(() => {});
  }, [show]);

  if (!show || !result) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="results-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ background: 'rgba(30,20,10,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <AnimatePresence mode="wait">
            {view === 'simple' ? (
              <SimpleScreen key="simple" onContinue={() => setView('full')} />
            ) : (
              <FullResultsScreen
                key="full"
                result={result}
                perfil={perfil}
                onBack={() => setView('simple')}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA SIMPLE                                                       */
/* ------------------------------------------------------------------ */

function SimpleScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-[88%] max-w-sm rounded-[32px] border-2 border-white/70 bg-edu-cream p-10 text-center shadow-game-lg"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 14 }}
        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-edu-green text-white shadow-glow-green"
      >
        <CheckCircle size={40} strokeWidth={3} />
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="font-baloo text-3xl font-black text-surface-800"
      >
        CURSO COMPLETADO
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mx-auto mb-5 mt-3 h-1 w-28 rounded-full bg-edu-green"
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mb-6 text-sm font-bold text-surface-500"
      >
        Excelente trabajo! Has superado el desafio.
      </motion.p>

      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97, y: 2 }}
        onClick={onContinue}
        className="btn-game inline-flex items-center gap-2 rounded-xl bg-edu-blue px-8 py-4 text-base text-white"
        style={{ boxShadow: '0 6px 0 rgba(0, 138, 157, 0.4), 0 8px 24px rgba(0,160,181,0.35)' }}
      >
        CONTINUAR <ArrowRight size={20} />
      </motion.button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA COMPLETA DE RESULTADOS                                       */
/* ------------------------------------------------------------------ */

function FullResultsScreen({
  result,
  perfil,
  onBack,
}: {
  result: GameResult;
  perfil: PerfilData | null;
  onBack: () => void;
}) {
  const rankColor = perfil?.rango.color || '#B87333';
  const progreso = Math.max(0, Math.min(100, perfil?.rango.progreso || 0));
  const esMaximo = perfil?.rango.esMaximo ?? false;

  const estimatedTimeMs = result.totalQuestions * 12_000;

  const yoNombre = perfil?.usuario.nombre || 'Tu';
  const yoAvatar = perfil?.usuario.avatar.imagen
    ? avatarUrl(perfil.usuario.avatar.imagen)
    : '/images/avatares/avatar1.png';
  const yoPuntosTotal = (perfil?.puntos || 0) + result.score;

  const ranking = [
    ...MOCK_CLASSMATES,
    {
      id: 99,
      nombre: yoNombre,
      avatar: yoAvatar,
      puntos: yoPuntosTotal,
      rango: perfil?.rango.nombre || 'Bronce',
      esYo: true,
    },
  ].sort((a, b) => b.puntos - a.puntos);

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="relative max-h-[88vh] w-[92%] max-w-md overflow-y-auto rounded-[28px] border-2 border-white/70 bg-edu-cream p-5 shadow-game-lg"
    >
      <div className="relative z-10">
        <div className="mb-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-edu-yellow px-3 py-1 text-xs font-black text-[#562F00] shadow-glow-yellow"
          >
            <Star size={12} fill="currentColor" /> Nivel completado!
          </motion.div>
          <h2 className="text-xl font-black text-surface-800">Has superado el desafio!</h2>
        </div>

        {/* Rango + barra */}
        <div
          className="mb-4 rounded-2xl border-2 p-4"
          style={{
            background: `linear-gradient(160deg, ${hexToRgba(rankColor, 0.12)}, rgba(255,255,255,0.6))`,
            borderColor: hexToRgba(rankColor, 0.25),
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <img src={rangoImagen(perfil?.rango.nombre || 'Bronce')} alt={perfil?.rango.nombre || 'Bronce'} draggable={false} className="h-12 w-12 flex-shrink-0 object-contain" />
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: rankColor }}>
                Rango: {perfil?.rango.nombre || 'Bronce'}
              </div>
              <div className="text-sm font-black text-surface-800">
                {perfil?.puntos?.toLocaleString('es-ES') || 0} / {esMaximo ? 'Maximo' : `${((perfil?.puntos || 0) + (perfil?.rango.puntosParaSiguiente || 0)).toLocaleString('es-ES')} pts`}
              </div>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-black/5 bg-black/5">
            <motion.div initial={{ width: 0 }} animate={{ width: `${esMaximo ? 100 : progreso}%` }} transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${rankColor}, ${hexToRgba(rankColor, 0.55)})` }} />
          </div>
          <p className="mt-2 text-center text-xs font-black text-surface-500">
            {esMaximo ? 'Has alcanzado el rango maximo!' : `Faltan ${perfil?.rango.puntosParaSiguiente?.toLocaleString('es-ES') || 0} pts para ${perfil?.rango.siguiente || 'siguiente rango'}`}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard icon={<CheckCircle size={18} />} label="Correctas" value={`${result.correctAnswers}/${result.totalQuestions}`} accent="#98C54E" bg="#F1F8E3" />
          <StatCard icon={<XCircle size={18} />} label="Fallas" value={`${result.incorrectAnswers}`} accent="#EB5D70" bg="#FDEBF3" />
          <StatCard icon={<Clock size={18} />} label="Tiempo" value={`~${formatTimeMs(estimatedTimeMs)}`} accent="#00A0B5" bg="#E8F7FE" />
          <StatCard icon={<Trophy size={18} />} label="Puntos" value={`+${result.score}`} accent="#FFA000" bg="#FFF0D6" />
        </div>

        {/* Ranking */}
        <div className="card-game mb-4 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-surface-500">
            <Trophy size={14} /> Ranking de la clase
          </div>
          <div className="flex flex-col gap-2">
            {ranking.map((p, idx) => {
              const isYo = 'esYo' in p && p.esYo;
              return (
                <motion.div
                  key={p.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + idx * 0.08 }}
                  className="flex items-center gap-3 rounded-xl border-2 p-2"
                  style={{
                    background: isYo ? '#F1F8E3' : 'rgba(255,255,255,0.6)',
                    borderColor: isYo ? 'rgba(152,197,78,0.4)' : 'transparent',
                  }}
                >
                  <span className={`w-5 text-center text-sm font-black ${isYo ? 'text-edu-green-dark' : 'text-surface-400'}`}>{idx + 1}</span>
                  <img src={p.avatar} alt={p.nombre} draggable={false} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-black text-surface-800">
                      {p.nombre}
                      {isYo && <span className="rounded-full bg-edu-green px-2 py-0.5 text-[9px] font-black uppercase text-white">TU</span>}
                    </div>
                    <div className="text-[10px] font-black text-surface-400">{p.rango}</div>
                  </div>
                  <span className={`text-sm font-black ${isYo ? 'text-edu-green-dark' : 'text-surface-800'}`}>{p.puntos.toLocaleString('es-ES')}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 2 }} onClick={() => { window.location.href = '/sala-espera'; }} className="card-game flex items-center justify-center gap-2 py-3 text-sm font-black text-surface-700">
            <Users size={16} /> Ir a la sala
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97, y: 2 }} onClick={() => { window.location.href = '/inicio'; }} className="btn-game flex items-center justify-center gap-2 rounded-xl bg-edu-blue py-3 text-sm text-white" style={{ boxShadow: '0 5px 0 rgba(0, 138, 157, 0.4), 0 6px 18px rgba(0,160,181,0.3)' }}>
            <Home size={16} /> Salir al menu
          </motion.button>
        </div>

        <button onClick={onBack} className="mx-auto mt-4 block text-xs font-black text-surface-400 transition-colors hover:text-surface-600">
          &larr; Volver
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, accent, bg }: { icon: React.ReactNode; label: string; value: string; accent: string; bg: string }) {
  return (
    <div className="rounded-2xl border-2 border-transparent p-3 text-center" style={{ background: bg, borderColor: hexToRgba(accent, 0.2) }}>
      <div className="mb-1" style={{ color: accent }}>{icon}</div>
      <p className="mb-0.5 text-[10px] font-black uppercase tracking-wider text-surface-400">{label}</p>
      <p className="text-lg font-black" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

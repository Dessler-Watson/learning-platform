'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';
import { ArrowLeft, Pencil, Camera, Star, Trophy, Clock, Gamepad2, Flame, BookOpen } from 'lucide-react';

const DATA = {
  name: 'Arthur',
  level: 8,
  cups: 325,
  playTime: '12h 40min',
  joined: 'Enero 2026',
  gamesPlayed: 47,
};

const c = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const it = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

export function ProfileScreen() {
  const [avatarId, setAvatarId] = useState(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('eduplay_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.avatar_id) setAvatarId(u.avatar_id);
      }
    } catch {}
  }, []);

  return (
    <main className="relative min-h-screen px-5 pb-16 pt-7">
      <Background />

      <motion.div variants={c} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-md">

        <motion.div variants={it} className="mb-6 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={() => { audioManager.play('back'); window.location.href = '/inicio'; }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-edu-pink-light/40 text-surface-700 shadow-card"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="text-2xl font-black text-surface-800">Mi Perfil</h1>
        </motion.div>

        <motion.div variants={it} className="mb-6 flex flex-col items-center">
          <motion.div
            key={avatarId}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-3 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-game-lg"
            style={{ background: '#fff7ef' }}
          >
            <img
              src={`/images/avatares/avatar${avatarId}.png`}
              alt="Tu avatar"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </motion.div>
          <h2 className="text-2xl font-black text-surface-800">{DATA.name}</h2>
          <p className="text-xs font-black text-surface-500">Miembro desde {DATA.joined}</p>
        </motion.div>

        <motion.div variants={it} className="mb-4 grid grid-cols-3 gap-3">
          <StatBox icon={<Star size={20} />} value={`Nivel ${DATA.level}`} color="#FFEF5A" bg="rgba(255,239,90,0.2)" />
          <StatBox icon={<Trophy size={20} />} value={`${DATA.cups}`} label="Copas" color="#FFA000" bg="rgba(255,160,0,0.15)" />
          <StatBox icon={<Clock size={20} />} value={DATA.playTime} label="Jugado" color="#00A0B5" bg="rgba(0,160,181,0.12)" />
        </motion.div>

        <motion.div variants={it} className="mb-5 flex flex-col gap-2">
          <InfoRow icon={<Gamepad2 size={18} />} label="Partidas jugadas" value={DATA.gamesPlayed.toString()} />
          <InfoRow icon={<Flame size={18} />} label="Racha actual" value={`${6} dias`} accent="#FFA000" />
          <InfoRow icon={<BookOpen size={18} />} label="Preguntas respondidas" value="143" />
        </motion.div>

        <motion.div variants={it} className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 2 }}
            className="btn-game flex w-full items-center justify-center gap-2 rounded-xl bg-edu-pink py-4 text-base text-white"
            style={{ boxShadow: '0 5px 0 rgba(217, 101, 154, 0.4), 0 8px 24px rgba(235,93,112,0.3)' }}
          >
            <Pencil size={18} /> Editar perfil
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 2 }}
            className="card-game flex w-full items-center justify-center gap-2 py-4 text-base font-black text-surface-700"
          >
            <Camera size={18} /> Cambiar avatar
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}

function StatBox({ icon, value, label, color, bg }: { icon: React.ReactNode; value: string; label?: string; color: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-black/5 p-3 text-center" style={{ background: bg }}>
      <div className="mb-1 flex justify-center" style={{ color }}>{icon}</div>
      <div className="text-sm font-black" style={{ color }}>{value}</div>
      {label && <div className="mt-0.5 text-[10px] font-black text-surface-500">{label}</div>}
    </div>
  );
}

function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/60 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-surface-500">
          {icon}
        </div>
        <span className="text-xs font-black text-surface-500">{label}</span>
      </div>
      <span className="text-sm font-black" style={{ color: accent || '#2A1E0E' }}>{value}</span>
    </div>
  );
}

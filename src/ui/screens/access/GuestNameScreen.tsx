'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Dices, Pencil, Rocket, Sparkles } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';
import { AvatarPicker } from '@/ui/components/AvatarPicker';

const NAMES = [
  'SuperLeon', 'PandaMagico', 'RayoAzul', 'AstroKid', 'ZorroValiente',
  'NinjaEstrella', 'DragonFeliz', 'CaballeroPixel', 'RobotTurbo', 'CapitanLuna',
  'TigreVeloz', 'MonoSaltarin', 'LoboPlateado', 'AguilaReal', 'PumaFeroz',
];

export function GuestNameScreen() {
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [started, setStarted] = useState(false);

  const randomName = () => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
  };

  const start = () => {
    if (started) return;
    setStarted(true);
    const finalName = name.trim() || NAMES[Math.floor(Math.random() * NAMES.length)];
    localStorage.setItem('eduplay_user', JSON.stringify({
      id_usuario: 0,
      nombre: finalName,
      avatar_id: avatarId,
      modo: 'invitado',
    }));
    window.location.href = '/inicio';
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-8">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <Link
            href="/estudiante"
            onClick={() => audioManager.play('back')}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2.5 text-sm font-black text-surface-500 shadow-card transition-all hover:bg-white"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </motion.div>

        <div className="rounded-[28px] border-2 border-white/70 bg-[#FFD8D8] p-6 shadow-game-lg backdrop-blur-xl">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFEF5A] px-4 py-1.5 text-xs font-black text-[#407516]"
            >
              <Sparkles size={14} /> NUEVO JUGADOR
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-4 flex justify-center"
            >
              <motion.div
                key={avatarId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-game-lg"
                style={{ background: '#fff7ef' }}
              >
                <img
                  src={`/images/avatares/avatar${avatarId}.png`}
                  alt="Tu avatar"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-surface-800"
            >
              Como te llamas?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-1 text-sm font-bold text-surface-500"
            >
              Elige un nombre para tu aventura
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5"
          >
            <div className="relative mb-3">
              <div className="pointer-events-none absolute left-4 top-0 flex h-full items-center text-edu-orange">
                <Pencil size={20} />
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 15))}
                placeholder="Escribe tu nombre..."
                maxLength={15}
                className="input-game pl-12 pr-12"
              />
              <span className="pointer-events-none absolute right-4 top-0 flex h-full items-center text-xs font-black text-surface-400">
                {name.length}/15
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, y: 2 }}
              onClick={() => { audioManager.play('create'); randomName(); }}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edu-yellow bg-edu-yellow-light/50 py-3 text-sm font-black text-[#B08A00] transition-colors hover:bg-edu-yellow-light"
            >
              <Dices size={18} />
              Nombre aleatorio
            </motion.button>

            <p className="mb-2 text-center text-xs font-black text-surface-500">Elige tu avatar</p>
            <AvatarPicker selected={avatarId} onSelect={setAvatarId} />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, y: 2 }}
              onClick={start}
              disabled={!name.trim()}
              className="btn-game mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFEF5A] py-4 text-base text-[#407516] disabled:opacity-60"
              style={{ boxShadow: name.trim() ? '0 6px 0 rgba(64, 117, 22, 0.5), 0 8px 24px rgba(64,117,22,0.35)' : undefined }}
            >
              Comenzar aventura
              <Rocket size={20} />
            </motion.button>

            <p className="mt-4 text-center text-xs font-black text-edu-pink">
              Tu progreso no se guardara porque estas jugando como invitado.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

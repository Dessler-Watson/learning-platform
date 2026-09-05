'use client';

import { motion } from 'framer-motion';
import { WelcomeBackground } from './WelcomeBackground';
import { audioManager } from '@/shared/lib/audio';
import { Sparkles, Gamepad2 } from 'lucide-react';

export function WelcomePage() {
  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden px-6">
      <WelcomeBackground />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="mb-2 flex justify-center"
          >
            <img
              src="/images/logo.png"
              alt="Logo"
              className="h-auto w-52 drop-shadow-lg"
              draggable={false}
            />
          </motion.div>
          <p className="mt-1 text-base font-bold text-surface-500">
            Aprende, explora y conquista
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full flex-col items-center gap-4"
        >
<motion.button
            onClick={() => { audioManager.play('navigate'); window.location.href = '/estudiante'; }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96, y: 2 }}
            className="btn-game flex w-full max-w-[260px] items-center justify-center gap-2 rounded-2xl bg-edu-orange py-4 text-lg text-white"
            style={{ boxShadow: '0 6px 0 rgba(255, 160, 0, 0.45), 0 10px 28px rgba(255,160,0,0.35)' }}
          >
            <Gamepad2 size={22} />
            Jugar ahora
          </motion.button>

          <motion.button
            onClick={() => { audioManager.play('navigate'); window.location.href = '/login-docente'; }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97, y: 2 }}
            className="rounded-xl border-2 border-surface-200 bg-white/70 px-6 py-2.5 text-sm font-black text-surface-500 shadow-card transition-colors hover:bg-white hover:text-surface-700"
          >
            Soy docente
          </motion.button>
        </motion.div>

        <div className="mt-4 flex gap-2">
          <Dot color="#EB5D70" />
          <Dot color="#00A0B5" />
          <Dot color="#FFEF5A" />
          <Dot color="#FFA000" />
          <Dot color="#98C54E" />
        </div>
      </div>
    </main>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      className="h-2.5 w-2.5 rounded-full"
      style={{ background: color }}
    />
  );
}

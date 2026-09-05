'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';
import { Gamepad2, GraduationCap, ChevronRight, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-8">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 flex justify-center"
        >
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-auto w-56 drop-shadow-lg"
            draggable={false}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 text-base font-bold"
          style={{ color: '#407516' }}
        >
          Aprender es una aventura
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-white shadow-glow-edu-orange"
          style={{ backgroundColor: '#FFA000' }}
        >
          <Sparkles size={16} /> CONTINUAR COMO
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto flex w-full max-w-sm flex-col gap-4"
        >
          <RoleCard
            icon={<Gamepad2 size={26} />}
            title="Estudiante"
            subtitle="Entra a jugar y aprender"
            color="#00A0B5"
            bg="#E8F7FE"
            onClick={() => { audioManager.play('navigate'); router.push('/estudiante'); }}
          />

          <RoleCard
            icon={<GraduationCap size={26} />}
            title="Profesor"
            subtitle="Gestiona tus clases y alumnos"
            color="#EB5D70"
            bg="#FDEBF3"
            onClick={() => { audioManager.play('navigate'); router.push('/panel/login'); }}
          />
        </motion.div>
      </motion.div>
    </main>
  );
}

function RoleCard({ icon, title, subtitle, color, bg, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98, y: 2 }}
      className="card-game flex w-full items-center gap-4 p-4 text-left"
      style={{ borderLeft: `5px solid ${color}` }}
    >
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-0.5 text-xl font-black leading-tight" style={{ color }}>
          {title}
        </h3>
        <p className="m-0 text-sm font-bold text-surface-500">{subtitle}</p>
      </div>
      <ChevronRight size={24} style={{ color }} />
    </motion.button>
  );
}

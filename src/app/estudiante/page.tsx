'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, UserCircle, UserPlus } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';

export default function EstudiantePage() {
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
            href="/"
            onClick={() => audioManager.play('back')}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2.5 text-sm font-black text-surface-500 shadow-card transition-all hover:bg-white"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </motion.div>

        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-4 flex justify-center"
          >
            <img
              src="/images/logo.png"
              alt="Logo"
              className="h-auto w-44 drop-shadow-lg"
              draggable={false}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black"
            style={{ color: '#14704F' }}
          >
            Iniciar sesion
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-1 text-sm font-bold"
            style={{ color: '#14704F' }}
          >
            Guarda tu progreso y colecciona estrellas
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-4"
          >
            <OptionCard
              icon={<UserCircle size={26} />}
              title="Entrar con mi Cuenta"
              subtitle="Ingresa para seguir tu camino"
              color="#00A0B5"
              bg="#E8F7FE"
              href="/ingresar"
            />

            <OptionCard
              icon={<UserPlus size={26} />}
              title="Jugar como Invitado"
              subtitle="Prueba los juegos de inmediato"
              color="#FFA000"
              bg="#FFF0D6"
              href="/invitado"
            />
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

function OptionCard({ icon, title, subtitle, color, bg, href }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  href: string;
}) {
  return (
    <Link href={href} className="text-decoration-none">
      <motion.div
        onClick={() => audioManager.play('navigate')}
        whileHover={{ scale: 1.03, y: -3 }}
        whileTap={{ scale: 0.98, y: 2 }}
        className="card-game flex items-center gap-4 p-4 text-left transition-all"
        style={{ borderLeft: `5px solid ${color}` }}
      >
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-0.5 text-lg font-black leading-tight" style={{ color }}>
            {title}
          </h3>
          <p className="m-0 text-sm font-bold text-surface-500">
            {subtitle}
          </p>
        </div>
        <ChevronIcon color={color} />
      </motion.div>
    </Link>
  );
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-6 w-6 flex-shrink-0"
      style={{ color }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </motion.svg>
  );
}
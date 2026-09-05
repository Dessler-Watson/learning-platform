'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { audioManager } from '@/shared/lib/audio';
import { GraduationCap, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function LoginDocentePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.play('submit');
    router.push('/panel');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-8"
      style={{ background: 'linear-gradient(160deg, #E8F4FD 0%, #FFF3E0 30%, #FDF2F6 60%, #FDF8E8 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-[28px] border-2 border-white/70 bg-edu-cream/95 p-7 shadow-game-lg backdrop-blur-xl"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="mb-4 flex items-center gap-2 text-sm font-black text-surface-500 transition-colors hover:text-surface-700"
        >
          <ArrowLeft size={18} /> Volver al inicio
        </motion.button>

        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-edu-pink text-white shadow-glow-edu-pink"
          >
            <GraduationCap size={32} />
          </motion.div>
          <h1 className="text-2xl font-black text-surface-800">Panel Docente</h1>
          <p className="mt-1 text-sm font-bold text-surface-500">Ingresa tus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Correo"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Mail size={18} />}
            placeholder="docente@ejemplo.com"
          />
          <InputField
            label="Contrasena"
            type="password"
            value={password}
            onChange={setPassword}
            icon={<Lock size={18} />}
            placeholder="••••••••"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 2 }}
            type="submit"
            className="btn-game mt-1 w-full rounded-xl bg-edu-pink py-4 text-base text-white"
            style={{ boxShadow: '0 6px 0 rgba(217, 101, 154, 0.4), 0 8px 24px rgba(235,93,112,0.35)' }}
          >
            Ingresar
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

function InputField({ label, type, value, onChange, icon, placeholder }: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black text-surface-600">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-0 flex h-full items-center text-edu-pink">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-game pl-11"
        />
      </div>
    </div>
  );
}

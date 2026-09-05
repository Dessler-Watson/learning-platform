'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';

const schema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no valido'),
  password: z.string().min(1, 'La contrasena es obligatoria').min(4, 'Minimo 4 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginScreen() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoginError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios?rol=estudiante&estado=activo');
      const usuarios = await res.json();
      const usuario = usuarios.find((u: { correo: string }) => u.correo.toLowerCase() === data.email.toLowerCase());

      if (!usuario) {
        setLoginError('Correo no encontrado');
        audioManager.play('error');
        setLoading(false);
        return;
      }

      localStorage.setItem('eduplay_user', JSON.stringify({
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        avatar_id: usuario.avatar_id,
        correo: usuario.correo,
        modo: 'registrado',
      }));

      window.location.href = '/inicio';
    } catch {
      setLoginError('Error al iniciar sesion. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-8">
      <Background />

      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
        className="relative z-10 w-full max-w-sm rounded-[28px] border-2 border-white/70 bg-edu-cream/95 p-7 shadow-game-lg backdrop-blur-xl"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { window.location.href = '/estudiante'; }}
          className="mb-4 flex items-center gap-2 text-sm font-black text-surface-500 transition-colors hover:text-surface-700"
        >
          <ArrowLeft size={18} /> Volver
        </motion.button>

        <div className="mb-6 text-center">
          <img src="/images/logo.png" alt="Logo" className="mx-auto mb-3 h-auto w-32" draggable={false} />
          <h1 className="text-2xl font-black text-surface-800">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm font-bold text-surface-500">Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <InputRow
            icon={<Mail size={18} />}
            type="email"
            placeholder="Correo electronico"
            error={errors.email?.message}
            register={register('email')}
          />

          <InputRow
            icon={<Lock size={18} />}
            type="password"
            placeholder="Contrasena"
            error={errors.password?.message}
            register={register('password')}
          />

          {loginError && (
            <p className="text-center text-sm font-black text-edu-pink">{loginError}</p>
          )}

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97, y: 2 }}
            type="submit"
            disabled={loading}
            onClick={() => audioManager.play('submit')}
            className="btn-game mt-1 w-full rounded-xl bg-[#407516] py-4 text-base text-white disabled:opacity-70"
            style={{ boxShadow: '0 6px 0 rgba(64, 117, 22, 0.4), 0 8px 24px rgba(64,117,22,0.3)' }}
          >
            {loading ? 'Iniciando...' : 'Iniciar sesion'}
          </motion.button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-center">
          <button onClick={() => { audioManager.play('click'); }} className="text-xs font-black text-surface-400 transition-colors hover:text-surface-600">
            Olvidaste tu contrasena?
          </button>
          <button
            onClick={() => { audioManager.play('navigate'); window.location.href = '/registro'; }}
            className="text-sm font-black text-[#407516] transition-colors hover:text-edu-blue-dark"
          >
            Crear cuenta
          </button>
        </div>
      </motion.div>
    </main>
  );
}

function InputRow({
  icon,
  type,
  placeholder,
  error,
  register,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-0 flex h-full items-center text-edu-orange">
          {icon}
        </div>
        <input
          {...register}
          type={type}
          placeholder={placeholder}
          className={`input-game pl-11 ${error ? 'border-edu-pink' : ''}`}
        />
      </div>
      {error && <p className="ml-1 mt-1 text-xs font-black text-edu-pink">{error}</p>}
    </div>
  );
}

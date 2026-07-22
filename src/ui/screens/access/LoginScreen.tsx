'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Background } from '@/ui/components/primitives/Background';

const schema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria').min(4, 'Mínimo 4 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginScreen() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    console.log('Login intentado:', data);
    window.location.href = '/inicio';
  };

  return (
    <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Background />
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
        style={{
          position: 'relative', zIndex: 1,
          background: 'rgba(22,22,34,0.92)', backdropFilter: 'blur(20px)',
          borderRadius: 28, padding: '32px 24px 28px', maxWidth: 380, width: '90%',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 12px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/images/logo.webp" alt="EquiMundo" style={{ width: 56, height: 'auto' }} draggable={false} />
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '8px 0 4px' }}>Bienvenido de vuelta</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Correo electrónico"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 16,
                border: `2px solid ${errors.email ? '#FF4B4B' : 'rgba(255,255,255,0.1)'}`,
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.email && <p style={{ color: '#FF4B4B', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 600 }}>{errors.email.message}</p>}
          </div>

          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="Contraseña"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 16,
                border: `2px solid ${errors.password ? '#FF4B4B' : 'rgba(255,255,255,0.1)'}`,
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.password && <p style={{ color: '#FF4B4B', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 600 }}>{errors.password.message}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            style={{
              width: '100%', padding: '16px', borderRadius: 18, border: 'none',
              background: 'linear-gradient(135deg, #7C4DFF, #651FFF)',
              color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Iniciar sesión
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => {}} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            ¿Olvidaste tu contraseña?
          </button>
          <button onClick={() => {}} style={{ background: 'none', border: 'none', color: '#7C4DFF', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
            Crear cuenta
          </button>
        </div>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = '/acceso'; }}
          style={{
            display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}
        >
          ← Volver
        </motion.button>
      </motion.div>
    </main>
  );
}

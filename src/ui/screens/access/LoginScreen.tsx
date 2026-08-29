'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Background } from '@/ui/components/primitives/Background';

const schema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no valido'),
  password: z.string().min(1, 'La contrasena es obligatoria').min(4, 'Minimo 4 caracteres'),
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
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
          borderRadius: 28, padding: '32px 24px 28px', maxWidth: 380, width: '90%',
          border: '1px solid #E4EAF4',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/images/logo.svg" alt="EduPlay" style={{ width: 72, height: 'auto', display: 'block', margin: '0 auto' }} draggable={false} />
          <h1 style={{ color: '#344054', fontSize: 22, fontWeight: 800, margin: '8px 0 4px', fontFamily: "var(--font-baloo), system-ui, sans-serif" }}>Bienvenido de vuelta</h1>
          <p style={{ color: '#6B7A94', fontSize: 13, margin: 0 }}>Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Correo electronico"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 16,
                border: `2px solid ${errors.email ? '#E94930' : '#E4EAF4'}`,
                background: '#F8FAFE', color: '#344054', fontSize: 15, outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
              }}
              onFocus={e => { if (!errors.email) e.target.style.borderColor = '#30BCE6'; }}
              onBlur={e => { if (!errors.email) e.target.style.borderColor = '#E4EAF4'; }}
            />
            {errors.email && <p style={{ color: '#E94930', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 700 }}>{errors.email.message}</p>}
          </div>

          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="Contrasena"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 16,
                border: `2px solid ${errors.password ? '#E94930' : '#E4EAF4'}`,
                background: '#F8FAFE', color: '#344054', fontSize: 15, outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
              }}
              onFocus={e => { if (!errors.password) e.target.style.borderColor = '#30BCE6'; }}
              onBlur={e => { if (!errors.password) e.target.style.borderColor = '#E4EAF4'; }}
            />
            {errors.password && <p style={{ color: '#E94930', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 700 }}>{errors.password.message}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            style={{
              width: '100%', padding: '16px', borderRadius: 18, border: 'none',
              background: 'linear-gradient(135deg, #30BCE6, #1A9FCC)',
              color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              marginTop: 4, boxShadow: '0 4px 16px rgba(48, 188, 230, 0.35)',
              fontFamily: "var(--font-baloo), system-ui, sans-serif",
            }}
          >
            Iniciar sesion
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => {}} style={{ background: 'none', border: 'none', color: '#A0ADC4', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
            Olvidaste tu contrasena?
          </button>
          <button onClick={() => { window.location.href = '/registro'; }} style={{ background: 'none', border: 'none', color: '#30BCE6', fontSize: 13, cursor: 'pointer', fontWeight: 800 }}>
            Crear cuenta
          </button>
        </div>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = '/estudiante'; }}
          style={{
            display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
            color: '#6B7A94', fontSize: 13, cursor: 'pointer', fontWeight: 700,
          }}
        >
          &larr; Volver
        </motion.button>
      </motion.div>
    </main>
  );
}

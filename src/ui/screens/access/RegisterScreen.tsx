'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Background } from '@/ui/components/primitives/Background';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  edad: z.string().min(1, 'La edad es obligatoria').regex(/^\d+$/, 'Edad no valida'),
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no valido'),
  password: z.string().min(1, 'La contrasena es obligatoria').min(4, 'Minimo 4 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function RegisterScreen() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    console.log('Registro intentado:', { ...data, edad: Number(data.edad) });
    window.location.href = '/inicio';
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px 16px', borderRadius: 16,
    border: `2px solid ${hasError ? '#E94930' : '#E4EAF4'}`,
    background: '#F8FAFE', color: '#344054', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  });

  return (
    <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 18px' }}>
      <Background />
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
        style={{
          position: 'relative', zIndex: 1,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
          borderRadius: 28, padding: '32px 24px 28px', maxWidth: 420, width: '100%',
          border: '1px solid #E4EAF4',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/images/logo.png" alt="EduPlay" style={{ width: 110, height: 'auto', display: 'block', margin: '0 auto' }} draggable={false} />
          <h1 style={{ color: '#344054', fontSize: 22, fontWeight: 800, margin: '10px 0 4px' }}>Crear cuenta</h1>
          <p style={{ color: '#6B7A94', fontSize: 13, margin: 0 }}>Completa tus datos para comenzar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <input
                {...register('nombre')}
                type="text"
                placeholder="Nombre"
                style={inputStyle(!!errors.nombre)}
                onFocus={e => { if (!errors.nombre) e.target.style.borderColor = '#30BCE6'; }}
                onBlur={e => { if (!errors.nombre) e.target.style.borderColor = '#E4EAF4'; }}
              />
              {errors.nombre && <p style={{ color: '#E94930', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 700 }}>{errors.nombre.message}</p>}
            </div>

            <div>
              <input
                {...register('apellido')}
                type="text"
                placeholder="Apellido"
                style={inputStyle(!!errors.apellido)}
                onFocus={e => { if (!errors.apellido) e.target.style.borderColor = '#30BCE6'; }}
                onBlur={e => { if (!errors.apellido) e.target.style.borderColor = '#E4EAF4'; }}
              />
              {errors.apellido && <p style={{ color: '#E94930', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 700 }}>{errors.apellido.message}</p>}
            </div>
          </div>

          <div>
            <input
              {...register('edad')}
              type="number"
              placeholder="Edad"
              style={inputStyle(!!errors.edad)}
              onFocus={e => { if (!errors.edad) e.target.style.borderColor = '#30BCE6'; }}
              onBlur={e => { if (!errors.edad) e.target.style.borderColor = '#E4EAF4'; }}
            />
            {errors.edad && <p style={{ color: '#E94930', fontSize: 11, margin: '4px 0 0 4px', fontWeight: 700 }}>{errors.edad.message}</p>}
          </div>

          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Correo electronico"
              style={inputStyle(!!errors.email)}
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
              style={inputStyle(!!errors.password)}
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
            }}
          >
            Crear cuenta
          </motion.button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E4EAF4' }} />
          <span style={{ color: '#A0ADC4', fontSize: 12, fontWeight: 700 }}>o</span>
          <div style={{ flex: 1, height: 1, background: '#E4EAF4' }} />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {}}
          style={{
            width: '100%', padding: '14px', borderRadius: 18,
            border: '2px solid #E4EAF4', background: '#fff',
            color: '#344054', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: 20, height: 20 }}>
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Iniciar con Google
        </motion.button>

        <p style={{ textAlign: 'center', color: '#6B7A94', fontSize: 13, margin: '16px 0 0' }}>
          Ya tienes cuenta?{' '}
          <button onClick={() => { window.location.href = '/ingresar'; }} style={{ background: 'none', border: 'none', color: '#30BCE6', fontSize: 13, cursor: 'pointer', fontWeight: 800 }}>
            Inicia sesion
          </button>
        </p>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = '/ingresar'; }}
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

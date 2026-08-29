'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginDocentePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/panel');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #E8F4FD 0%, #F0F4FA 30%, #FDF2F6 60%, #FDF8E8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "var(--font-nunito), system-ui, sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 28,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 400,
          border: '1px solid #E4EAF4',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #F087A9, #D96B91)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 6px 24px rgba(240, 135, 169, 0.3)',
            }}
          >
            <span style={{ fontSize: 28 }}>👨‍🏫</span>
          </motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#344054', margin: '0 0 8px', fontFamily: "var(--font-baloo), system-ui, sans-serif" }}>
            Panel Docente
          </h1>
          <p style={{ color: '#6B7A94', fontSize: 14, margin: 0 }}>
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4A5770', marginBottom: 6 }}>
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#F8FAFE',
                border: '2px solid #E4EAF4',
                borderRadius: 16,
                color: '#344054',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
              }}
              placeholder="docente@ejemplo.com"
              onFocus={(e) => { e.target.style.borderColor = '#F087A9'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E4EAF4'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4A5770', marginBottom: 6 }}>
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#F8FAFE',
                border: '2px solid #E4EAF4',
                borderRadius: 16,
                color: '#344054',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
              }}
              placeholder="••••••••"
              onFocus={(e) => { e.target.style.borderColor = '#F087A9'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E4EAF4'; }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #F087A9, #D96B91)',
              color: '#fff',
              border: 'none',
              borderRadius: 18,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(240, 135, 169, 0.35)',
              fontFamily: "var(--font-baloo), system-ui, sans-serif",
              marginTop: 4,
            }}
          >
            Ingresar
          </motion.button>
        </form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '12px',
            background: 'none',
            border: 'none',
            color: '#6B7A94',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          &larr; Volver al inicio
        </motion.button>
      </motion.div>
    </div>
  );
}

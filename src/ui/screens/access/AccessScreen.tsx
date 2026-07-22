'use client';

import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';

export function AccessScreen() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Background />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: 40, width: '100%', maxWidth: 500 }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
          <img src="/images/logo.webp" alt="EquiMundo" style={{ width: 64, height: 'auto' }} draggable={false} />
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '8px 0 4px' }}>¿Cómo quieres jugar?</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Elige una opción para comenzar</p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          {/* Guest card */}
          <motion.button
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = '/invitado'; }}
            style={{
              width: '100%', padding: '22px 20px', borderRadius: 22, border: 'none',
              background: 'linear-gradient(135deg, #4BC94B, #33A033)',
              color: '#fff', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 6px 24px rgba(76,175,80,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>👤</span>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Jugar como invitado</h3>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>Comienza a jugar inmediatamente. Tu progreso no se guardará.</p>
              </div>
            </div>
          </motion.button>

          {/* Login card */}
          <motion.button
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = '/ingresar'; }}
            style={{
              width: '100%', padding: '22px 20px', borderRadius: 22, border: '2px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
              color: '#fff', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>⭐</span>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Iniciar sesión</h3>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>Guarda tu progreso, logros, copas y continúa tu aventura.</p>
              </div>
            </div>
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { window.location.href = '/'; }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
        >
          ← Volver
        </motion.button>
      </div>
    </main>
  );
}

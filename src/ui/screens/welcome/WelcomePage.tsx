'use client';

import { motion } from 'framer-motion';
import { WelcomeBackground } from './WelcomeBackground';
import { WoodenButton } from './WoodenButton';

export function WelcomePage() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <WelcomeBackground />

      {/* Overlay UI */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 24, padding: 40,
      }}>
        {/* Logo + título */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}
          >
            <img
              src="/images/logo.webp"
              alt="EquiMundo"
              style={{ width: 'clamp(100px, 22vw, 160px)', height: 'auto' }}
              draggable={false}
            />
          </motion.div>
          <h1 style={{
            fontSize: 42, fontWeight: 900, margin: 0,
            letterSpacing: -1,
            background: 'linear-gradient(135deg, #ffffff 0%, #ffe082 50%, #ff8f00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 24px rgba(0,0,0,0.25)',
          }}>
            EquiMundo
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.92)', fontSize: 16, margin: '8px 0 0', fontWeight: 600,
            textShadow: '0 2px 12px rgba(0,0,0,0.35)',
          }}>
            Aprende, explora y conquista
          </p>
        </motion.div>

        {/* Botones de madera */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <WoodenButton
            title="Jugar"
            subtitle="Empieza tu aventura"
            onClick={() => { window.location.href = '/acceso'; }}
          />
          <WoodenButton
            title="Iniciar sesión"
            onClick={() => { window.location.href = '/ingresar'; }}
          />
        </motion.div>
      </div>
    </main>
  );
}

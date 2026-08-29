'use client';

import { motion } from 'framer-motion';
import { WelcomeBackground } from './WelcomeBackground';

export function WelcomePage() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <WelcomeBackground />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 28, padding: 40,
      }}>
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
              src="/images/logo.svg"
              alt="EduPlay"
              style={{ width: 'clamp(100px, 22vw, 160px)', height: 'auto' }}
              draggable={false}
            />
          </motion.div>
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 900, margin: 0,
            fontFamily: "var(--font-baloo), system-ui, sans-serif",
            letterSpacing: '-0.01em',
          }}>
            <span style={{ color: '#1E2A3A' }}>Edu</span>
            <span style={{ color: '#30BCE6' }}>Play</span>
          </h1>
          <p style={{
            color: '#fff', fontSize: 16, margin: '8px 0 0', fontWeight: 700,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            Aprende, explora y conquista
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <WelcomeBtn
            title="Iniciar sesion"
            color="#F087A9"
            onClick={() => { window.location.href = '/ingresar'; }}
          />
        </motion.div>

        <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F087A9' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#30BCE6' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDDB33' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDF293' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E94930' }} />
        </div>
      </div>
    </main>
  );
}

function WelcomeBtn({ title, subtitle, color, onClick }: { title: string; subtitle?: string; color: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      style={{
        width: 260, padding: '16px 24px',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        color: '#fff', border: 'none', borderRadius: 20,
        cursor: 'pointer', textAlign: 'center',
        boxShadow: `0 6px 24px ${color}55`,
        fontFamily: "var(--font-baloo), system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2, fontWeight: 600 }}>{subtitle}</div>}
    </motion.button>
  );
}

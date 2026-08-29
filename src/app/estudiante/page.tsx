'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';

export default function EstudiantePage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 420, padding: '32px 24px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: '50%',
            background: '#fff', border: '2px solid #C8EFFA',
            color: '#30BCE6', marginBottom: 16,
          }}
          aria-label="Volver al inicio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </Link>

        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#FFE4ED', color: '#F087A9',
              padding: '8px 20px', borderRadius: 999,
              fontSize: 13, fontWeight: 900, letterSpacing: 0.5,
              marginBottom: 20,
            }}
          >
            COMIENZA TU AVENTURA
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 20,
            }}
          >
            <img
              src="/images/logo.svg"
              alt="EduPlay"
              style={{ width: 100, height: 100, objectFit: 'contain' }}
              draggable={false}
            />
            <span style={{
              fontSize: 34, fontWeight: 800, lineHeight: 1,
              fontFamily: "var(--font-baloo), system-ui, sans-serif",
              letterSpacing: '-0.01em',
            }}>
              <span style={{ color: '#1E2A3A' }}>Edu</span>
              <span style={{ color: '#30BCE6' }}>Play</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              color: '#1E2A3A', fontSize: 32, fontWeight: 900,
              fontFamily: "var(--font-baloo), system-ui, sans-serif", margin: '0 0 6px',
            }}
          >
            Iniciar sesión
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ color: '#6B7A94', fontSize: 15, margin: '0 0 28px', fontWeight: 700 }}
          >
            Guarda tu progreso y colecciona estrellas
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 380, margin: '0 auto' }}
        >
          <OptionCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 26, height: 26 }}>
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
            }
            title="Entrar con mi Cuenta"
            subtitle="Ingresa para seguir tu camino"
            color="#30BCE6"
            borderColor="#C8EFFA"
            href="/ingresar"
          />

          <OptionCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 26, height: 26 }}>
                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.47-5.47a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
              </svg>
            }
            title="Jugar como Invitado"
            subtitle="¡Prueba los juegos de inmediato!"
            color="#FF9F43"
            borderColor="#FFE0BF"
            href="/invitado"
          />
        </motion.div>
      </motion.div>
    </main>
  );
}

function OptionCard({ icon, title, subtitle, color, borderColor, href }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ scale: 1.03, y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          width: '100%', padding: '20px 20px', borderRadius: 24,
          background: '#fff', border: `3px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', gap: 16,
          cursor: 'pointer', textAlign: 'left',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${color}40`,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: '0 0 4px', fontSize: 20, fontWeight: 800,
            fontFamily: "var(--font-baloo), system-ui, sans-serif", color,
            lineHeight: 1.2, letterSpacing: '-0.01em',
          }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#6B7A94', fontWeight: 600 }}>
            {subtitle}
          </p>
        </div>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ width: 24, height: 24, color, flexShrink: 0 }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </motion.svg>
      </motion.div>
    </Link>
  );
}

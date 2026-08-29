'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';

export default function Home() {
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 420, padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <div style={{ 
            width: 200, 
            height: 200, 
            borderRadius: '50%', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="/images/logo.svg"
              alt="EduPlay"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable={false}
            />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontSize: 'clamp(42px, 10vw, 56px)', fontWeight: 800, margin: 0,
              fontFamily: "inherit", lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#30BCE6' }}>Edu</span>
            <span style={{ color: '#F087A9' }}>Play</span>
          </motion.h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ 
            color: '#6B7A94', 
            fontSize: 18, 
            margin: '0 0 32px', 
            fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          ¡Aprender es una aventura!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #FDF293 0%, #FDDB33 100%)',
            color: '#1E2A3A',
            padding: '10px 24px', borderRadius: 999,
            fontSize: 14, fontWeight: 700, letterSpacing: 1,
            marginBottom: 24,
            boxShadow: '0 4px 12px rgba(253, 219, 51, 0.3)',
            fontFamily: "inherit",
          }}
        >
          CONTINUAR COMO
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 380, margin: '0 auto' }}
        >
          <RoleCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 26, height: 26 }}>
                <path fillRule="evenodd" d="M10.5 3.798a5.483 5.483 0 0 0-4.152 2.202c-.45.586-.828 1.243-1.123 1.957-.3.725-.475 1.503-.475 2.319v.42a2.25 2.25 0 0 0 .3 1.125l.613 1.092a1.636 1.636 0 0 1-.35 2.074l-1.572 1.21a2.25 2.25 0 0 0-.812 1.738v1.636c0 .966.784 1.75 1.75 1.75h16.5a1.75 1.75 0 0 0 1.75-1.75v-1.636a2.25 2.25 0 0 0-.812-1.739l-1.572-1.21a1.636 1.636 0 0 1-.35-2.073l.613-1.093a2.25 2.25 0 0 0 .3-1.125v-.42c0-.816-.175-1.594-.475-2.319-.295-.714-.673-1.371-1.123-1.957A5.483 5.483 0 0 0 13.5 3.798c-.828-.653-1.866-1.05-3-1.05s-2.172.397-3 1.05Zm4.2 4.8a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm-7.5 0a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm10.5 0a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" clipRule="evenodd" />
              </svg>
            }
            title="Estudiante"
            subtitle="¡Entra a jugar y aprender!"
            color="#30BCE6"
            borderColor="#C8EFFA"
            onClick={() => router.push('/estudiante')}
          />

          <RoleCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 26, height: 26 }}>
                <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v4.5a.75.75 0 0 1-1.28.53l-3.45-3.45H5.25a3 3 0 0 1-3-3V5.25Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v9.75a1.5 1.5 0 0 0 1.5 1.5h4.5a.75.75 0 0 1 .53.22l2.22 2.22V15.75a.75.75 0 0 1 .75-.75h3.75a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H5.25Z" clipRule="evenodd" />
              </svg>
            }
            title="Profesor"
            subtitle="Gestiona tus clases y alumnos"
            color="#F087A9"
            borderColor="#FFE4ED"
            onClick={() => router.push('/login-docente')}
          />
        </motion.div>
      </motion.div>
    </main>
  );
}

function RoleCard({ icon, title, subtitle, color, borderColor, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
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
          fontFamily: "inherit", color,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: 14, 
          color: '#6B7A94', 
          fontWeight: 600,
          fontFamily: "inherit",
        }}>
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
    </motion.button>
  );
}

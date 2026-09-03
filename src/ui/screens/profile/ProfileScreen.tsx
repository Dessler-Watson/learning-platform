'use client';

import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';

const DATA = {
  name: 'Arthur',
  level: 8,
  cups: 325,
  playTime: '12h 40min',
  joined: 'Enero 2026',
  gamesPlayed: 47,
};

const c = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const it = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

export function ProfileScreen() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />

      <motion.div variants={c} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto', padding: '28px 18px 60px' }}>

        <motion.div variants={it} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/inicio'; }}
            style={{ width: 40, height: 40, borderRadius: 14, border: 'none', background: 'rgba(240,135,169,0.12)', color: '#344054', fontSize: 18, cursor: 'pointer' }}>&larr;</motion.button>
          <h1 style={{ color: '#344054', fontSize: 22, fontWeight: 800, margin: 0 }}>Mi Perfil</h1>
        </motion.div>

        <motion.div variants={it} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', boxShadow: '0 8px 30px rgba(240,135,169,0.3)', marginBottom: 14,
            border: '4px solid #F087A9',
          }}><img src="/images/logo.png" alt="EduPlay" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <h2 style={{ color: '#344054', fontSize: 24, fontWeight: 800, margin: '0 0 2px' }}>{DATA.name}</h2>
          <p style={{ color: '#6B7A94', fontSize: 13, fontWeight: 700, margin: 0 }}>Miembro desde {DATA.joined}</p>
        </motion.div>

        <motion.div variants={it} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18,
        }}>
          <StatBox icon="⭐" value={`Nivel ${DATA.level}`} color="#FDDB33" bg="rgba(253,219,51,0.15)" />
          <StatBox icon="🏆" value={`${DATA.cups}`} label="Copas" color="#FDDB33" bg="rgba(253,242,147,0.3)" />
          <StatBox icon="⏱" value={DATA.playTime} label="Jugado" color="#30BCE6" bg="rgba(48,188,230,0.1)" />
        </motion.div>

        <motion.div variants={it} style={{
          display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22,
        }}>
          <InfoRow icon="🎮" label="Partidas jugadas" value={DATA.gamesPlayed.toString()} />
          <InfoRow icon="🔥" label="Racha actual" value={`${6} dias`} accent="#E94930" />
          <InfoRow icon="📚" label="Preguntas respondidas" value="143" />
        </motion.div>

        <motion.div variants={it} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '15px', borderRadius: 18, border: 'none',
              background: 'linear-gradient(135deg, #F087A9, #D96B91)',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(240,135,169,0.3)',
            }}>✏️ Editar perfil</motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '15px', borderRadius: 18,
              border: '2px solid #E4EAF4', background: 'rgba(255,255,255,0.6)',
              color: '#344054', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>📷 Cambiar avatar</motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}

function StatBox({ icon, value, label, color, bg }: { icon: string; value: string; label?: string; color: string; bg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 20, background: bg, border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontSize: 15, fontWeight: 800 }}>{value}</div>
      {label && <div style={{ color: '#6B7A94', fontSize: 11, fontWeight: 700, marginTop: 2 }}>{label}</div>}
    </div>
  );
}

function InfoRow({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: '#6B7A94', fontSize: 13, fontWeight: 700 }}>{label}</span>
      </div>
      <span style={{ color: accent || '#344054', fontSize: 14, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

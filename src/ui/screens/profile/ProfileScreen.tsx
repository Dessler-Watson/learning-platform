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

        {/* Back + title */}
        <motion.div variants={it} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/inicio'; }}
            style={{ width: 40, height: 40, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</motion.button>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>Mi Perfil</h1>
        </motion.div>

        {/* Avatar + Name */}
        <motion.div variants={it} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', boxShadow: '0 8px 30px rgba(124,77,255,0.3)', marginBottom: 14,
          }}><img src="/images/logo.webp" alt="EquiMundo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 2px' }}>{DATA.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, margin: 0 }}>Miembro desde {DATA.joined}</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={it} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18,
        }}>
          <StatBox icon="⭐" value={`Nivel ${DATA.level}`} color="#FFD93D" />
          <StatBox icon="🏆" value={`${DATA.cups}`} label="Copas" color="#FFD700" />
          <StatBox icon="⏱" value={DATA.playTime} label="Jugado" color="#4FC3F7" />
        </motion.div>

        {/* Extra info */}
        <motion.div variants={it} style={{
          display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22,
        }}>
          <InfoRow icon="🎮" label="Partidas jugadas" value={DATA.gamesPlayed.toString()} />
          <InfoRow icon="🔥" label="Racha actual" value={`${6} días`} />
          <InfoRow icon="📚" label="Preguntas respondidas" value="143" />
        </motion.div>

        {/* Action buttons */}
        <motion.div variants={it} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '15px', borderRadius: 18, border: 'none',
              background: 'linear-gradient(135deg, #7C4DFF, #651FFF)',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}>✏️ Editar perfil</motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '15px', borderRadius: 18,
              border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>📷 Cambiar avatar</motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}

function StatBox({ icon, value, label, color }: { icon: string; value: string; label?: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontSize: 15, fontWeight: 800 }}>{value}</div>
      {label && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, marginTop: 2 }}>{label}</div>}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

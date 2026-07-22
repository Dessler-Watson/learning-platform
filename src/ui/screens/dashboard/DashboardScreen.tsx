'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';
import { SettingsModal } from '@/ui/screens/welcome/SettingsModal';

const DATA = {
  name: 'Arthur',
  level: 8,
  cups: 325,
  streak: 6,
  achievements: [
    { icon: '🏅', title: 'Primer juego', desc: 'Completaste tu primer juego', date: 'Hace 2 días', done: true },
    { icon: '📚', title: 'Sabio', desc: 'Respondiste 20 preguntas correctamente', date: 'Hace 1 día', done: true },
    { icon: '🏆', title: 'Copas de plata', desc: 'Alcanzaste las 300 copas', date: 'Hoy', done: true },
    { icon: '🌟', title: 'Racha imparable', desc: 'Mantén una racha de 10 días', date: '', done: false },
  ],
};

const c = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const it = { hidden: { y: 24, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

export function DashboardScreen() {
  const [settings, setSettings] = useState(false);

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />

      <motion.div variants={c} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '32px 18px 80px' }}>

        {/* ══════ HEADER ══════ */}
        <motion.div variants={it} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = '/perfil'; }}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 6px 20px rgba(124,77,255,0.35)',
              }}><img src="/images/logo.webp" alt="EquiMundo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            </motion.button>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, margin: 0 }}>¡Bienvenido!</p>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '2px 0 0' }}>{DATA.name}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setSettings(true)}
              style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>⚙️</motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, cursor: 'pointer', position: 'relative' }}>
              🔔
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#FF4B4B' }} />
            </motion.button>
          </div>
        </motion.div>

        {/* ══════ PROGRESS CARD ══════ */}
        <motion.div variants={it} style={{
          background: 'linear-gradient(135deg, rgba(124,77,255,0.15), rgba(255,107,157,0.08))',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '20px 16px',
          marginBottom: 18, backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <Stat icon="⭐" value={`Nivel ${DATA.level}`} color="#FFD93D" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <Stat icon="🏆" value={`${DATA.cups} Copas`} color="#FFD700" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <Stat icon="🔥" value={`${DATA.streak} días`} color="#FF6B9D" />
          </div>
        </motion.div>

        {/* Quick nav */}
        <motion.div variants={it} style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <NavPill icon="👤" label="Perfil" href="/perfil" />
          <NavPill icon="🏅" label="Logros" href="/logros" />
        </motion.div>

        {/* ══════ PLAY BUTTON ══════ */}
        <motion.div variants={it} style={{ marginBottom: 22 }}>
          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = '/juegos'; }}
            animate={{ boxShadow: ['0 0 0 0 rgba(124,77,255,0.5)', '0 0 0 18px rgba(124,77,255,0)', '0 0 0 0 rgba(124,77,255,0.5)'] }}
            transition={{ boxShadow: { repeat: Infinity, duration: 2.5 } }}
            style={{
              width: '100%', padding: 0, borderRadius: 24, border: 'none', cursor: 'pointer',
              overflow: 'hidden', position: 'relative', textAlign: 'left',
              background: 'linear-gradient(135deg, #1E1840, #2D1F5E)',
            }}
          >
            {/* Fondo ilustrativo */}
            <div style={{
              height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #7C4DFF22, #651FFF11)',
            }}>
              <span style={{ fontSize: 48, opacity: 0.8 }}>🎮</span>
            </div>
            {/* Texto del botón */}
            <div style={{ padding: '14px 20px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2 }}>¡JUGAR!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tu aventura te espera</div>
            </div>
          </motion.button>
        </motion.div>

        {/* ══════ ACHIEVEMENTS ══════ */}
        <motion.div variants={it}>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px 4px' }}>
            Últimos logros
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DATA.achievements.map((a, i) => (
              <motion.div key={i} whileHover={{ x: 6 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 18,
                  background: a.done ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  opacity: a.done ? 1 : 0.45,
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: a.done ? 'rgba(124,77,255,0.2)' : 'rgba(255,255,255,0.05)', fontSize: 20,
                }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>{a.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {a.date && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{a.date}</span>}
                  {a.done ? <span style={{ fontSize: 14 }}>✅</span> : <span style={{ fontSize: 14 }}>🔒</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </main>
  );
}

function Stat({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontSize: 15, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function NavPill({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={() => { window.location.href = href; }}
      style={{
        flex: 1, padding: '12px', borderRadius: 16, border: 'none',
        background: 'rgba(255,255,255,0.05)', color: '#fff',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      {icon} {label}
    </motion.button>
  );
}

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
    { icon: '🏅', title: 'Primer juego', desc: 'Completaste tu primer juego', date: 'Hace 2 dias', done: true },
    { icon: '📚', title: 'Sabio', desc: 'Respondiste 20 preguntas correctamente', date: 'Hace 1 dia', done: true },
    { icon: '🏆', title: 'Copas de plata', desc: 'Alcanzaste las 300 copas', date: 'Hoy', done: true },
    { icon: '🌟', title: 'Racha imparable', desc: 'Manten una racha de 10 dias', date: '', done: false },
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

        <motion.div variants={it} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = '/perfil'; }}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 6px 20px rgba(240,135,169,0.3)',
                border: '3px solid #F087A9',
              }}><img src="/images/logo.svg" alt="EduPlay" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            </motion.button>
            <div>
              <p style={{ color: '#6B7A94', fontSize: 12, fontWeight: 700, margin: 0 }}>Bienvenido!</p>
              <h2 style={{ color: '#344054', fontSize: 20, fontWeight: 800, margin: '2px 0 0', fontFamily: "var(--font-baloo), system-ui, sans-serif" }}>{DATA.name}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setSettings(true)}
              style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'rgba(48,188,230,0.1)', color: '#344054', fontSize: 18, cursor: 'pointer' }}>⚙️</motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'rgba(240,135,169,0.1)', color: '#344054', fontSize: 18, cursor: 'pointer', position: 'relative' }}>
              🔔
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#E94930' }} />
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={it} style={{
          background: 'linear-gradient(135deg, rgba(253,219,51,0.12), rgba(253,242,147,0.08))',
          border: '1px solid rgba(253,219,51,0.2)', borderRadius: 24, padding: '20px 16px',
          marginBottom: 18, backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <Stat icon="⭐" value={`Nivel ${DATA.level}`} color="#FDDB33" />
            <div style={{ width: 1, background: 'rgba(0,0,0,0.06)' }} />
            <Stat icon="🏆" value={`${DATA.cups} Copas`} color="#FDDB33" />
            <div style={{ width: 1, background: 'rgba(0,0,0,0.06)' }} />
            <Stat icon="🔥" value={`${DATA.streak} dias`} color="#E94930" />
          </div>
        </motion.div>

        <motion.div variants={it} style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <NavPill icon="👤" label="Perfil" href="/perfil" color="#F087A9" />
          <NavPill icon="🏅" label="Logros" href="/logros" color="#FDDB33" />
        </motion.div>

        <motion.div variants={it} style={{ marginBottom: 22 }}>
          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = '/juegos'; }}
            animate={{ boxShadow: ['0 0 0 0 rgba(240,135,169,0.4)', '0 0 0 18px rgba(240,135,169,0)', '0 0 0 0 rgba(240,135,169,0.4)'] }}
            transition={{ boxShadow: { repeat: Infinity, duration: 2.5 } }}
            style={{
              width: '100%', padding: 0, borderRadius: 24, border: 'none', cursor: 'pointer',
              overflow: 'hidden', position: 'relative', textAlign: 'left',
              background: 'linear-gradient(135deg, #F087A9, #D96B91)',
              boxShadow: '0 8px 32px rgba(240,135,169,0.3)',
            }}
          >
            <div style={{
              height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(253,219,51,0.15), rgba(253,242,147,0.1))',
            }}>
              <span style={{ fontSize: 48, opacity: 0.9 }}>🎮</span>
            </div>
            <div style={{ padding: '14px 20px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2, fontFamily: "var(--font-baloo), system-ui, sans-serif" }}>JUGAR!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Tu aventura te espera</div>
            </div>
          </motion.button>
        </motion.div>

        <motion.div variants={it}>
          <h3 style={{ color: '#6B7A94', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px 4px' }}>
            Ultimos logros
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DATA.achievements.map((a, i) => (
              <motion.div key={i} whileHover={{ x: 6 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 18,
                  background: a.done ? 'rgba(253,242,147,0.3)' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${a.done ? 'rgba(253,219,51,0.3)' : 'rgba(0,0,0,0.04)'}`,
                  opacity: a.done ? 1 : 0.5,
                  boxShadow: a.done ? '0 2px 8px rgba(253,219,51,0.15)' : 'none',
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: a.done ? 'rgba(253,219,51,0.2)' : 'rgba(0,0,0,0.04)', fontSize: 20,
                }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#344054', fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ color: '#6B7A94', fontSize: 11, marginTop: 1 }}>{a.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {a.date && <span style={{ color: '#A0ADC4', fontSize: 10 }}>{a.date}</span>}
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
      <div style={{ color, fontSize: 15, fontWeight: 800, fontFamily: "var(--font-baloo), system-ui, sans-serif" }}>{value}</div>
    </div>
  );
}

function NavPill({ icon, label, href, color }: { icon: string; label: string; href: string; color: string }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={() => { window.location.href = href; }}
      style={{
        flex: 1, padding: '12px', borderRadius: 16, border: 'none',
        background: `${color}20`, color: '#344054',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "var(--font-baloo), system-ui, sans-serif",
      }}>
      {icon} {label}
    </motion.button>
  );
}

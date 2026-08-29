'use client';

import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';

const ACHIEVEMENTS = [
  { icon: '🏅', name: 'Primer Juego', desc: 'Completa tu primer juego.', current: 1, max: 1, done: true },
  { icon: '📚', name: 'Matematico', desc: 'Responde 100 preguntas correctamente.', current: 100, max: 100, done: true },
  { icon: '🧭', name: 'Explorador', desc: 'Prueba todos los juegos disponibles.', current: 2, max: 2, done: true },
  { icon: '🔥', name: 'Constante', desc: 'Juega durante 7 dias seguidos.', current: 6, max: 7, done: false },
  { icon: '🏆', name: 'Coleccionista', desc: 'Obten 500 copas.', current: 325, max: 500, done: false },
  { icon: '⭐', name: 'Estrella', desc: 'Consigue 3 estrellas en un nivel.', current: 3, max: 3, done: true },
  { icon: '💎', name: 'Sabio', desc: 'Responde 50 preguntas sin fallar.', current: 28, max: 50, done: false },
  { icon: '🎯', name: 'Precision', desc: 'Alcanza 90% de precision en una partida.', current: 85, max: 90, done: false },
];

const done = ACHIEVEMENTS.filter((a) => a.done).length;
const total = ACHIEVEMENTS.length;
const pct = Math.round((done / total) * 100);

const c = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const it = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

export function AchievementsScreen() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />
      <motion.div variants={c} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 1, maxWidth: 460, margin: '0 auto', padding: '28px 18px 60px' }}>

        <motion.div variants={it} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/inicio'; }}
            style={{ width: 40, height: 40, borderRadius: 14, border: 'none', background: 'rgba(253,219,51,0.15)', color: '#344054', fontSize: 18, cursor: 'pointer' }}>&larr;</motion.button>
          <div>
            <h1 style={{ color: '#344054', fontSize: 22, fontWeight: 800, margin: 0, fontFamily: "inherit" }}>Logros</h1>
            <p style={{ color: '#6B7A94', fontSize: 12, fontWeight: 700, margin: '2px 0 0' }}>Desbloquea nuevas medallas mientras aprendes</p>
          </div>
        </motion.div>

        <motion.div variants={it} style={{
          display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22,
          padding: '18px 20px', borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(253,242,147,0.4), rgba(253,219,51,0.15))',
          border: '2px solid rgba(253,219,51,0.3)',
          boxShadow: '0 4px 16px rgba(253,219,51,0.15)',
        }}>
          <div style={{ fontSize: 40 }}>🏅</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#344054', fontSize: 20, fontWeight: 800, fontFamily: "inherit" }}>{done} de {total}</div>
            <div style={{ color: '#6B7A94', fontSize: 12, fontWeight: 700 }}>logros desbloqueados</div>
            <div style={{ marginTop: 8, height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #FDDB33, #F087A9)' }} />
            </div>
            <div style={{ color: '#A0ADC4', fontSize: 10, fontWeight: 700, marginTop: 4 }}>{pct}% completado</div>
          </div>
        </motion.div>

        {ACHIEVEMENTS.map((a, i) => (
          <motion.div key={i} variants={it} whileHover={{ x: 4 }}
            style={{
              display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 20, marginBottom: 8,
              background: a.done ? 'linear-gradient(135deg, rgba(253,242,147,0.35), rgba(253,219,51,0.15))' : 'rgba(255,255,255,0.4)',
              border: `2px solid ${a.done ? 'rgba(253,219,51,0.4)' : 'rgba(0,0,0,0.04)'}`,
              opacity: a.done ? 1 : 0.55,
              boxShadow: a.done ? '0 4px 12px rgba(253,219,51,0.2)' : 'none',
            }}
          >
            <motion.div
              animate={a.done ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.3 }}
              style={{
                width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: a.done ? 'rgba(253,219,51,0.25)' : 'rgba(0,0,0,0.04)',
                fontSize: 22, flexShrink: 0,
                boxShadow: a.done ? '0 0 16px rgba(253,219,51,0.3)' : 'none',
              }}>{a.icon}</motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#344054', fontSize: 14, fontWeight: 700 }}>{a.name}</div>
              <div style={{ color: '#6B7A94', fontSize: 11, marginTop: 1 }}>{a.desc}</div>
              {!a.done && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((a.current / a.max) * 100)}%` }} transition={{ duration: 0.6, delay: 0.4 }}
                      style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #30BCE6, #F087A9)' }} />
                  </div>
                  <div style={{ color: '#A0ADC4', fontSize: 10, fontWeight: 700, marginTop: 3 }}>
                    {a.current} / {a.max}
                  </div>
                </div>
              )}
            </div>
            <span style={{ fontSize: 16, flexShrink: 0, alignSelf: 'center' }}>
              {a.done ? '🏆' : '🔒'}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}

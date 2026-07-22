'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';

const NAMES = [
  'SuperLeón', 'PandaMágico', 'RayoAzul', 'AstroKid', 'ZorroValiente',
  'NinjaEstrella', 'DragónFeliz', 'CaballeroPixel', 'RobotTurbo', 'CapitánLuna',
  'TigreVeloz', 'MonoSaltarín', 'LoboPlateado', 'ÁguilaReal', 'PumaFeroz',
];

export function GuestNameScreen() {
  const [name, setName] = useState('');

  const randomName = () => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
  };

  const start = () => {
    const finalName = name.trim() || NAMES[Math.floor(Math.random() * NAMES.length)];
    window.location.href = '/inicio';
  };

  return (
    <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Background />
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
        style={{
          position: 'relative', zIndex: 1,
          background: 'rgba(22,22,34,0.92)', backdropFilter: 'blur(20px)',
          borderRadius: 28, padding: '32px 24px 28px', maxWidth: 380, width: '90%',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: 44, display: 'block' }}
          >
            👤
          </motion.span>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>¿Cómo te llamas?</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Elige un nombre para tu aventura</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 15))}
            placeholder="Escribe tu nombre..."
            maxLength={15}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 16,
              border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
              textAlign: 'center',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'right', margin: '4px 4px 0' }}>
            {name.length}/15
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={randomName}
          style={{
            width: '100%', padding: '12px', borderRadius: 16, border: '2px dashed rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.04)', color: '#FFD93D', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          🎲 Nombre aleatorio
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={start}
          style={{
            width: '100%', padding: '16px', borderRadius: 18, border: 'none',
            background: 'linear-gradient(135deg, #4BC94B, #33A033)',
            color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
          }}
        >
          Comenzar aventura
        </motion.button>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.4 }}>
          Tu progreso no se guardará porque estás jugando como invitado.
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = '/acceso'; }}
          style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
        >
          ← Volver
        </motion.button>
      </motion.div>
    </main>
  );
}

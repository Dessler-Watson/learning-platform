'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Dices, Pencil, Rocket } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';

const NAMES = [
  'SuperLeon', 'PandaMagico', 'RayoAzul', 'AstroKid', 'ZorroValiente',
  'NinjaEstrella', 'DragonFeliz', 'CaballeroPixel', 'RobotTurbo', 'CapitanLuna',
  'TigreVeloz', 'MonoSaltarin', 'LoboPlateado', 'AguilaReal', 'PumaFeroz',
];

export function GuestNameScreen() {
  const [name, setName] = useState('');

  const randomName = () => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
  };

  const start = () => {
    const finalName = name.trim() || NAMES[Math.floor(Math.random() * NAMES.length)];
    localStorage.setItem('eduplay_user', JSON.stringify({
      id_usuario: 0,
      nombre: finalName,
      avatar_id: 1,
      modo: 'invitado',
    }));
    window.location.href = '/inicio';
  };

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
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 24 }}
        >
          <Link
            href="/estudiante"
            onClick={() => audioManager.play('back')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', cursor: 'pointer',
              color: '#6B7A94', fontSize: 14, fontWeight: 800,
              padding: '12px 20px', borderRadius: 14,
              background: 'rgba(255,255,255,0.7)',
              border: '2px solid #E4EAF4',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        </motion.div>

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
            NUEVO JUGADOR
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              width: 190, height: 190, margin: '0 auto 20px',
              borderRadius: '50%', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <img
              src="/images/logo.png"
              alt="EduPlay"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable={false}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              color: '#1E2A3A', fontSize: 30, fontWeight: 900, margin: '0 0 6px',
            }}
          >
            ¿Cómo te llamas?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ color: '#6B7A94', fontSize: 15, margin: '0 0 24px', fontWeight: 700 }}
          >
            Elige un nombre para tu aventura
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{
              position: 'absolute', left: 16, top: 0, bottom: 0,
              display: 'flex', alignItems: 'center', color: '#FF9F43',
              pointerEvents: 'none',
            }}>
              <Pencil size={20} />
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 15))}
              placeholder="Escribe tu nombre..."
              maxLength={15}
              style={{
                width: '100%', padding: '15px 48px 15px 48px', borderRadius: 18,
                border: '2px solid #E4EAF4', background: '#fff',
                color: '#1E2A3A', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontWeight: 700,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#30BCE6'; e.target.style.boxShadow = '0 0 0 4px rgba(48,188,230,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E4EAF4'; e.target.style.boxShadow = 'none'; }}
            />
            <span style={{
              position: 'absolute', right: 16, top: 0, bottom: 0,
              display: 'flex', alignItems: 'center',
              color: '#A0ADC4', fontSize: 12, fontWeight: 800,
              pointerEvents: 'none',
            }}>
              {name.length}/15
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { audioManager.play('create'); randomName(); }}
            style={{
              width: '100%', padding: '14px', borderRadius: 18,
              border: '2px dashed #FDDB33', background: '#FFF8D6',
              color: '#D4A600', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <Dices size={20} />
            Nombre aleatorio
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { audioManager.play('start'); start(); }}
            disabled={!name.trim()}
            style={{
              width: '100%', padding: '16px', borderRadius: 18, border: 'none',
              background: '#8CD54D', color: '#fff',
              fontSize: 17, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(140,213,77,0.35)',
              opacity: name.trim() ? 1 : 0.6,
              transition: 'opacity 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            Comenzar aventura
            <Rocket size={22} />
          </motion.button>

          <p style={{
            color: '#F087A9', fontSize: 12, textAlign: 'center',
            margin: '14px 0 0', lineHeight: 1.4, fontWeight: 700,
          }}>
            Tu progreso no se guardará porque estás jugando como invitado.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}

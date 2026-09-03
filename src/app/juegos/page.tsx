'use client';

import { motion } from 'framer-motion';
import { TopBar } from '@/ui/components/navigation/TopBar';
import { Background } from '@/ui/components/primitives/Background';
import { GameCard, GameGrid } from '@/ui/components/primitives/GameCard';

const GAMES = [
  {
    title: 'El Camino de las Decisiones',
    description: 'Avanza por un camino flotante eligiendo la respuesta correcta en cada puerta gigante.',
    color: '#F087A9',
    colorSecondary: '#FDDB33',
    route: '/camino-decisiones',
    available: true,
    emoji: '🚪',
  },
  {
    title: 'La Lava del Conocimiento',
    description: 'Responde preguntas, haz crecer tu torre y evita que la lava te alcance.',
    color: '#E94930',
    colorSecondary: '#FDDB33',
    route: '/lava-conocimiento',
    available: true,
    emoji: '🌋',
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp = { hidden: { y: 30, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.5 } } };

export default function JuegosPage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <Background />
      <TopBar />

      <motion.div
        variants={container} initial="hidden" animate="show"
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 880, margin: '0 auto',
          padding: '80px 20px 60px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
        }}
      >
        <motion.div variants={fadeUp} style={{ textAlign: 'center' }}>
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: 40, display: 'block', marginBottom: 4 }}
          >
            🎮
          </motion.span>
          <h1 style={{ color: '#344054', fontSize: 28, fontWeight: 900, margin: '0 0 6px' }}>
            Elige tu aventura
          </h1>
          <p style={{ color: '#6B7A94', fontSize: 15, margin: 0 }}>
            Selecciona un minijuego para empezar a aprender
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GameGrid>
            {GAMES.map((game) => (
              <GameCard key={game.route} {...game} />
            ))}
          </GameGrid>
        </motion.div>

        <motion.button
          variants={fadeUp}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = '/inicio'; }}
          style={{
            background: 'none', border: 'none',
            color: '#6B7A94', fontSize: 14,
            cursor: 'pointer', fontWeight: 700, marginTop: 8,
          }}
        >
          &larr; Volver al inicio
        </motion.button>
      </motion.div>
    </main>
  );
}

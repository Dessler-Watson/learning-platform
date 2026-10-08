'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Dices, Sparkles, AlertTriangle, Gamepad2 } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';

type Difficulty = 'facil' | 'medio' | 'dificil' | 'experto' | 'caos';

const DIFFICULTIES: Array<{ id: Difficulty; label: string; desc: string; color: string }> = [
  { id: 'facil', label: 'Fácil', desc: '8 a 14 preguntas · ideas básicas', color: '#407516' },
  { id: 'medio', label: 'Medio', desc: '15 a 22 preguntas · nivel escolar', color: '#00A0B5' },
  { id: 'dificil', label: 'Difícil', desc: '23 a 30 preguntas · exigente', color: '#E85D70' },
  { id: 'experto', label: 'Experto', desc: '23 a 30 preguntas · reto máximo', color: '#F9A825' },
  { id: 'caos', label: 'Caos', desc: '15 a 30 preguntas · impredecible', color: '#6D28D9' },
];

/**
 * Crear sala Modo Caos (ETAPA 1): elige dificultad → POST /api/caos
 * (el servidor sortea el juego y genera las preguntas con IA) → lobby.
 */
export function ChaosCreateScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medio');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    audioManager.play('submit');
    try {
      const res = await fetch('/api/caos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', difficulty }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = '/ingresar';
        return;
      }
      if (!res.ok || !data?.sala?.code) {
        setError(data?.error || 'No se pudo crear la sala. Intenta de nuevo.');
        setLoading(false);
        return;
      }
      window.location.href = `/sala-espera?codigo=${encodeURIComponent(data.sala.code)}`;
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen px-4 pb-12 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-xl"
      >
        <button
          onClick={() => { audioManager.play('back'); window.location.href = '/inicio'; }}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2.5 text-sm font-black text-surface-500 shadow-card transition-colors hover:bg-white"
        >
          <ArrowLeft size={16} /> Volver al inicio
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-edu-pink-light/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-edu-pink">
          <Dices size={14} /> Modo Caos
        </div>
        <h1 className="font-baloo text-3xl font-black text-surface-800">Crear sala Caos</h1>
        <p className="mt-1 text-sm font-bold text-surface-500">
          Elige la dificultad. El servidor sortea el juego y genera las preguntas con IA
          (si la IA falla usa un banco local). Comparte el código con tus compañeros.
        </p>

        <div className="mt-5 grid gap-3">
          {DIFFICULTIES.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => { audioManager.play('click'); setDifficulty(d.id); setError(null); }}
              className={`flex items-center justify-between rounded-2xl border-2 bg-white/80 px-5 py-4 text-left shadow-card transition-colors ${difficulty === d.id ? '' : 'border-white/60'}`}
              style={difficulty === d.id ? { borderColor: d.color, boxShadow: `0 6px 0 ${d.color}33, 0 8px 20px ${d.color}26` } : undefined}
            >
              <div className="min-w-0">
                <div className="text-base font-black text-surface-800">{d.label}</div>
                <div className="text-xs font-bold text-surface-500">{d.desc}</div>
              </div>
              <span
                className="ml-3 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                style={{ background: difficulty === d.id ? d.color : '#C9BCB2' }}
              >
                {difficulty === d.id ? '✓' : ''}
              </span>
            </motion.button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-edu-pink-light/30 px-4 py-3 text-xs font-black text-edu-pink">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98, y: 2 }}
          onClick={crear}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#407516] px-6 py-3.5 text-sm font-black text-white shadow-game-sm disabled:opacity-70"
        >
          <Sparkles size={18} />
          {loading ? 'Creando sala y generando preguntas...' : 'Crear sala Caos'}
        </motion.button>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/70 p-4 text-xs font-bold text-surface-500 shadow-card">
          <Gamepad2 size={16} className="mt-0.5 flex-shrink-0 text-edu-blue" />
          <span>
            En el lobby verás la dificultad, el tema sorteado, cuántas preguntas se generaron y
            qué juego tocó. Necesitas al menos 2 jugadores para iniciar la partida.
          </span>
        </div>
      </motion.div>
    </main>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';
import { ArrowLeft, Trophy, BookOpen, Compass, Flame, Medal, Star, Gem, Target, Lock } from 'lucide-react';

const ACHIEVEMENTS = [
  { icon: Medal, name: 'Primer Juego', desc: 'Completa tu primer juego.', current: 1, max: 1, done: true, color: '#FFEF5A' },
  { icon: BookOpen, name: 'Matematico', desc: 'Responde 100 preguntas correctamente.', current: 100, max: 100, done: true, color: '#00A0B5' },
  { icon: Compass, name: 'Explorador', desc: 'Prueba todos los juegos disponibles.', current: 2, max: 2, done: true, color: '#98C54E' },
  { icon: Flame, name: 'Constante', desc: 'Juega durante 7 dias seguidos.', current: 6, max: 7, done: false, color: '#FFA000' },
  { icon: Trophy, name: 'Coleccionista', desc: 'Obten 500 copas.', current: 325, max: 500, done: false, color: '#FFEF5A' },
  { icon: Star, name: 'Estrella', desc: 'Consigue 3 estrellas en un nivel.', current: 3, max: 3, done: true, color: '#FFEF5A' },
  { icon: Gem, name: 'Sabio', desc: 'Responde 50 preguntas sin fallar.', current: 28, max: 50, done: false, color: '#00A0B5' },
  { icon: Target, name: 'Precision', desc: 'Alcanza 90% de precision en una partida.', current: 85, max: 90, done: false, color: '#EB5D70' },
];

const done = ACHIEVEMENTS.filter((a) => a.done).length;
const total = ACHIEVEMENTS.length;
const pct = Math.round((done / total) * 100);

const c = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const it = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

export function AchievementsScreen() {
  return (
    <main className="relative min-h-screen px-5 pb-16 pt-7">
      <Background />
      <motion.div variants={c} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-md">

        <motion.div variants={it} className="mb-5 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={() => { audioManager.play('back'); window.location.href = '/inicio'; }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-edu-yellow-light text-surface-700 shadow-card"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-surface-800">Logros</h1>
            <p className="text-xs font-black text-surface-500">Desbloquea nuevas medallas mientras aprendes</p>
          </div>
        </motion.div>

        <motion.div
          variants={it}
          className="mb-5 flex items-center gap-4 rounded-3xl border-2 border-edu-yellow/40 bg-gradient-to-r from-edu-yellow-light/50 to-edu-yellow/20 p-4"
          style={{ boxShadow: '0 6px 0 rgba(249,168,37,0.12), 0 8px 24px rgba(255,239,90,0.15)' }}
        >
          <div className="rounded-2xl bg-edu-yellow p-3 text-white shadow-glow-edu-yellow">
            <Trophy size={32} />
          </div>
          <div className="flex-1">
            <div className="text-xl font-black text-surface-800">{done} de {total}</div>
            <div className="text-xs font-black text-surface-500">logros desbloqueados</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-edu-yellow to-edu-pink" />
            </div>
            <div className="mt-1 text-[10px] font-black text-surface-400">{pct}% completado</div>
          </div>
        </motion.div>

        {ACHIEVEMENTS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={i}
              variants={it}
              whileHover={{ x: 4 }}
              className="mb-2 flex gap-3 rounded-2xl p-3"
              style={{
                background: a.done ? 'linear-gradient(135deg, rgba(255,245,168,0.4), rgba(255,239,90,0.15))' : 'rgba(255,255,255,0.6)',
                border: `2px solid ${a.done ? 'rgba(255,239,90,0.4)' : 'rgba(0,0,0,0.04)'}`,
                opacity: a.done ? 1 : 0.7,
                boxShadow: a.done ? '0 4px 12px rgba(255,239,90,0.15)' : 'none',
              }}
            >
              <motion.div
                animate={a.done ? { scale: [1, 1.12, 1] } : {}}
                transition={{ repeat: Infinity, duration: 3, delay: i * 0.3 }}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: a.done ? a.color : 'rgba(0,0,0,0.08)' }}
              >
                <Icon size={20} />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-surface-800">{a.name}</div>
                <div className="text-xs font-bold text-surface-500">{a.desc}</div>
                {!a.done && (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((a.current / a.max) * 100)}%` }} transition={{ duration: 0.6, delay: 0.4 }}
                        className="h-full rounded-full bg-gradient-to-r from-edu-blue to-edu-pink" />
                    </div>
                    <div className="mt-1 text-[10px] font-black text-surface-400">
                      {a.current} / {a.max}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center self-center">
                {a.done ? (
                  <Trophy size={18} className="text-edu-yellow" />
                ) : (
                  <Lock size={18} className="text-surface-300" />
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </main>
  );
}

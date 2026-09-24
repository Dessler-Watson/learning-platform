'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Search, Route, Flame, CheckCircle, Lock, X,
  BookOpen, Compass, Medal, Star, Target, Zap, TrendingUp, Award,
  Brain, Crown, Shield, Heart, GraduationCap, Sparkles, Waves, Mountain
} from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { ModeLogo, MODE_THEME } from '@/shared/lib/game-modes';
import { audioManager } from '@/shared/lib/audio';
import { useAchievementStore } from '@/stores/achievement.store';
import { ACHIEVEMENTS } from '@/shared/lib/achievements-data';
import type { AchievementDifficulty } from '@/shared/types/achievement';

type FilterType = 'all' | 'unlocked' | 'locked';
type ModeFilter = 'all' | 'decisiones' | 'lava' | 'tierras' | 'abismos';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ICON_MAP: Record<string, any> = {
  Route, CheckCircle, BookOpen, Compass, Flame, Star, Zap, TrendingUp,
  Target, Award, Brain, Medal, Trophy, Crown, Sparkles, Shield, Heart,
  GraduationCap, Waves, Mountain,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const DIFFICULTY_COLORS: Record<AchievementDifficulty, string> = {
  easy: '#98C54E',
  medium: '#FFA000',
  hard: '#EB5D70',
  legendary: '#9C27B0',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const c = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const it = { hidden: { y: 12, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.3 } } };

export function AchievementsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [guestBlocked, setGuestBlocked] = useState(false);

  const progress = useAchievementStore((s) => s.progress);
  const initialized = useAchievementStore((s) => s.initialized);
  const markAsReviewed = useAchievementStore((s) => s.markAsReviewed);
  const init = useAchievementStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('eduplay_user');
        const user = raw ? JSON.parse(raw) : null;
        if (user?.modo === 'invitado') {
          setGuestBlocked(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (initialized) {
      markAsReviewed();
    }
  }, [initialized, markAsReviewed]);

  const progressMap = useMemo(() => {
    const map = new Map<string, typeof progress[0]>();
    progress.forEach((p) => map.set(p.id, p));
    return map;
  }, [progress]);

  const unlockedCount = useMemo(() => {
    return progress.filter((p) => p.completed).length;
  }, [progress]);

  const overallPercent = useMemo(() => {
    return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
  }, [unlockedCount]);

  const filteredAchievements = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    return ACHIEVEMENTS.filter((def) => {
      const prog = progressMap.get(def.id);
      const isCompleted = prog?.completed ?? false;

      if (filter === 'unlocked' && !isCompleted) return false;
      if (filter === 'locked' && isCompleted) return false;

      if (modeFilter !== 'all' && def.mode !== modeFilter) return false;

      if (normalizedQuery) {
        const normalizedName = def.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedDesc = def.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!normalizedName.includes(normalizedQuery) && !normalizedDesc.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, filter, modeFilter, progressMap]);

  const decisionesAchievements = useMemo(() => {
    return filteredAchievements.filter((a) => a.mode === 'decisiones');
  }, [filteredAchievements]);

  const lavaAchievements = useMemo(() => {
    return filteredAchievements.filter((a) => a.mode === 'lava');
  }, [filteredAchievements]);

  const tierrasAchievements = useMemo(() => {
    return filteredAchievements.filter((a) => a.mode === 'tierras');
  }, [filteredAchievements]);

  const abismosAchievements = useMemo(() => {
    return filteredAchievements.filter((a) => a.mode === 'abismos');
  }, [filteredAchievements]);

  return (
    <main className="relative min-h-screen px-5 pb-10 pt-6">
      <Background />

      {guestBlocked ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto max-w-md pt-20 text-center"
        >
          <div className="card-game p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFEF5A]/20">
              <Trophy size={28} className="text-[#FFA000]" />
            </div>
            <h2 className="mb-2 text-xl font-black text-surface-800">Necesitas una cuenta</h2>
            <p className="text-sm font-bold text-surface-500 mb-6">
              Los logros se guardan en tu cuenta. Crea una cuenta para comenzar a desbloquear y guardar tus logros.
            </p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { audioManager.play('navigate'); router.push('/registro'); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#407516] px-6 py-3.5 text-sm font-black text-white"
                style={{ boxShadow: '0 6px 0 rgba(64, 117, 22, 0.4), 0 8px 24px rgba(64,117,22,0.3)' }}
              >
                Crear cuenta
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { audioManager.play('back'); router.push('/inicio'); }}
                className="w-full rounded-xl px-6 py-3 text-sm font-black text-surface-400"
              >
                Volver
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        {/* Header */}
        <header className="mb-5 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
                onClick={() => { audioManager.play('back'); router.push('/inicio'); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFEF5A] text-[#407516] shadow-card"
            style={{ boxShadow: '0 4px 0 rgba(64, 117, 22, 0.2), 0 6px 20px rgba(255, 239, 90, 0.25)' }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-surface-800">Logros</h1>
            <p className="text-xs font-bold text-surface-500">Desbloquea nuevas medallas mientras aprendes</p>
          </div>
        </header>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 flex items-center gap-4 rounded-3xl border-2 border-[#FFEF5A]/40 bg-gradient-to-r from-[#FFEF5A]/20 to-[#FFEF5A]/5 p-4"
          style={{ boxShadow: '0 6px 0 rgba(249,168,37,0.12), 0 8px 24px rgba(255,239,90,0.15)' }}
        >
          <div className="rounded-2xl bg-[#FFEF5A] p-3 text-[#8A6D00]">
            <Trophy size={28} />
          </div>
          <div className="flex-1">
            <div className="text-xl font-black text-surface-800">{unlockedCount} / {ACHIEVEMENTS.length}</div>
            <div className="text-xs font-black text-surface-500">logros desbloqueados</div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #FFA000, #FFEF5A)' }}
              />
            </div>
            <div className="mt-1 text-[10px] font-black text-surface-400">{overallPercent}% completado</div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar logros..."
            className="input-game w-full rounded-xl pl-10 pr-10 py-3 text-sm font-bold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Mode Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FilterChip label="Todos" active={modeFilter === 'all'} onClick={() => setModeFilter('all')} />
          <FilterChip
            label="Rumbo"
            active={modeFilter === 'decisiones'}
            onClick={() => setModeFilter('decisiones')}
            color={MODE_THEME.decisiones.color}
            icon={<ModeLogo mode="decisiones" size={16} shape="circle" showBox={false} />}
          />
          <FilterChip
            label="Bajo Presión"
            active={modeFilter === 'lava'}
            onClick={() => setModeFilter('lava')}
            color={MODE_THEME.lava.color}
            icon={<ModeLogo mode="lava" size={16} shape="circle" showBox={false} />}
          />
          <FilterChip
            label="Tierras"
            active={modeFilter === 'tierras'}
            onClick={() => setModeFilter('tierras')}
            color={MODE_THEME.tierras.color}
            icon={<ModeLogo mode="tierras" size={16} shape="circle" showBox={false} />}
          />
          <FilterChip
            label="Abismos"
            active={modeFilter === 'abismos'}
            onClick={() => setModeFilter('abismos')}
            color={MODE_THEME.abismos.color}
            icon={<ModeLogo mode="abismos" size={16} shape="circle" showBox={false} />}
          />
        </div>

        {/* Status Filters */}
        <div className="mb-4 flex items-center gap-2">
          <FilterChip label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip
            label="Desbloqueados"
            active={filter === 'unlocked'}
            onClick={() => setFilter('unlocked')}
            color="#98C54E"
            icon={<CheckCircle size={12} />}
          />
          <FilterChip
            label="Faltantes"
            active={filter === 'locked'}
            onClick={() => setFilter('locked')}
            color="#8A7A6A"
            icon={<Lock size={12} />}
          />
        </div>

        {/* Results count */}
        <p className="mb-3 text-xs font-bold text-surface-500">
          {filteredAchievements.length} logro{filteredAchievements.length !== 1 ? 's' : ''}
        </p>

        {/* Achievements List */}
        {filteredAchievements.length === 0 ? (
          <div className="card-game p-8 text-center">
            <Trophy size={32} className="mx-auto mb-3 text-surface-300" />
            <p className="text-sm font-bold text-surface-500">No se encontraron logros</p>
            <p className="text-xs text-surface-400">
              {searchQuery ? 'Intenta con otro termino' : 'No hay logros que coincidan con el filtro'}
            </p>
          </div>
        ) : (
          <motion.div variants={c} initial="hidden" animate="show" className="space-y-6">
            {/* Rumbo */}
            {decisionesAchievements.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ModeLogo mode="decisiones" size={26} shape="square" imgScale={1} />
                  <h2 className="text-sm font-black text-surface-700">Rumbo</h2>
                  <span className="text-[10px] font-bold text-surface-400">
                    ({decisionesAchievements.filter((a) => progressMap.get(a.id)?.completed).length}/{decisionesAchievements.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {decisionesAchievements.map((def) => (
                    <AchievementCard key={def.id} definition={def} progress={progressMap.get(def.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Bajo Presión */}
            {lavaAchievements.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ModeLogo mode="lava" size={26} shape="square" imgScale={1} />
                  <h2 className="text-sm font-black text-surface-700">Bajo Presión</h2>
                  <span className="text-[10px] font-bold text-surface-400">
                    ({lavaAchievements.filter((a) => progressMap.get(a.id)?.completed).length}/{lavaAchievements.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {lavaAchievements.map((def) => (
                    <AchievementCard key={def.id} definition={def} progress={progressMap.get(def.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Tierras Hundidas */}
            {tierrasAchievements.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ModeLogo mode="tierras" size={26} shape="square" imgScale={1} />
                  <h2 className="text-sm font-black text-surface-700">Tierras Hundidas</h2>
                  <span className="text-[10px] font-bold text-surface-400">
                    ({tierrasAchievements.filter((a) => progressMap.get(a.id)?.completed).length}/{tierrasAchievements.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {tierrasAchievements.map((def) => (
                    <AchievementCard key={def.id} definition={def} progress={progressMap.get(def.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Entre Abismos */}
            {abismosAchievements.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ModeLogo mode="abismos" size={26} shape="square" imgScale={1} />
                  <h2 className="text-sm font-black text-surface-700">Entre Abismos</h2>
                  <span className="text-[10px] font-bold text-surface-400">
                    ({abismosAchievements.filter((a) => progressMap.get(a.id)?.completed).length}/{abismosAchievements.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {abismosAchievements.map((def) => (
                    <AchievementCard key={def.id} definition={def} progress={progressMap.get(def.id)} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
      )}
    </main>
  );
}

function AchievementCard({
  definition,
  progress,
}: {
  definition: typeof ACHIEVEMENTS[0];
  progress?: { progress: number; completed: boolean; unlockedAt: number | null };
}) {
  const isCompleted = progress?.completed ?? false;
  const currentProgress = progress?.progress ?? 0;
  const percent = Math.min(100, Math.round((currentProgress / definition.goal) * 100));
  const Icon = ICON_MAP[definition.icon] || Trophy;
  const diffColor = DIFFICULTY_COLORS[definition.difficulty];

  return (
    <motion.div
      variants={it}
      whileHover={{ x: 3 }}
      className="flex gap-3 rounded-2xl p-3 transition-all"
      style={{
        background: isCompleted
          ? 'linear-gradient(135deg, rgba(255,245,168,0.4), rgba(255,239,90,0.15))'
          : 'rgba(255,255,255,0.6)',
        border: `2px solid ${isCompleted ? 'rgba(255,239,90,0.4)' : 'rgba(0,0,0,0.04)'}`,
        opacity: isCompleted ? 1 : 0.65,
        boxShadow: isCompleted ? '0 4px 12px rgba(255,239,90,0.15)' : 'none',
      }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: isCompleted ? diffColor : 'rgba(0,0,0,0.08)' }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-surface-800">{definition.name}</span>
          {isCompleted && (
            <span className="rounded-full bg-[#98C54E]/15 px-2 py-0.5 text-[9px] font-black text-[#98C54E]">
              Completado
            </span>
          )}
        </div>
        <div className="text-xs font-bold text-surface-500">{definition.description}</div>
        {!isCompleted && (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${diffColor}, ${diffColor}80)` }}
              />
            </div>
            <div className="mt-1 text-[10px] font-black text-surface-400">
              {currentProgress} / {definition.goal}
            </div>
          </div>
        )}
        {isCompleted && progress?.unlockedAt && (
          <div className="mt-1 text-[10px] font-bold text-surface-400">
            Desbloqueado: {formatDate(progress.unlockedAt)}
          </div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center self-center">
        {isCompleted ? (
          <Trophy size={18} className="text-[#FFEF5A]" />
        ) : (
          <Lock size={18} className="text-surface-300" />
        )}
      </div>
    </motion.div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition-all duration-200"
      style={{
        background: active
          ? color ? `${color}20` : 'rgba(0, 160, 181, 0.15)'
          : '#f5f0ea',
        color: active
          ? color || '#00A0B5'
          : '#8A7A6A',
        border: active
          ? `2px solid ${color || '#00A0B5'}`
          : '2px solid transparent',
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Star, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { LeagueBadge } from '@/ui/components/LeagueBadge';
import { useLeagueStore } from '@/stores/league.store';
import { LEAGUES, type League, isLeagueUnlocked, getLeagueByStars } from '@/lib/leagues';
import { audioManager } from '@/shared/lib/audio';

// ============================================================
// RANKING REAL — /api/ranking (PostgreSQL v_league_leaderboard)
// ============================================================

interface RankingPlayer {
  posicion: number;
  id: string;
  nombre: string;
  avatar: string | null;
  estrellas: number;
  liga: string;
  mineral: string;
  nivel: number;
  es_tu: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export function LeaguesScreen() {
  const stars = useLeagueStore((s) => s.stars);
  const initStars = useLeagueStore((s) => s.initStars);
  const getCurrentLeague = useLeagueStore((s) => s.getCurrentLeague);
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ nombre: string; avatar: string } | null>(null);

  const currentLeague = getCurrentLeague();

  useEffect(() => {
    initStars();
  }, [initStars]);

  useEffect(() => {
    const raw = localStorage.getItem('eduplay_user');
    if (raw) {
      const user = JSON.parse(raw);
      const avatarId = user.avatar_id || 1;
      setCurrentUser({
        nombre: user.nombre || 'Jugador',
        avatar: `/images/avatares/${['gueguense.png','leon.png','mascara.png','mariposa.png','nacatamal.png','guardabarranco.png','sacuanjoche.png','madrono.png','ideay.png','presion.png','abismo.png','rumbo.png','pantano.png'][avatarId] || 'gueguense.png'}`,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/ranking?limit=50', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setRankingError('No se pudo cargar el ranking');
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setRanking(Array.isArray(data.ranking) ? data.ranking : []);
          setRankingError(null);
        }
      } catch {
        if (!cancelled) setRankingError('Error de conexion');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const myEntry = useMemo(() => ranking.find((p) => p.es_tu), [ranking]);
  const playerPosition = myEntry?.posicion ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Space background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, #1a1040 0%, #0a0a1a 40%, #050510 100%)',
        }}
      >
        {/* Stars particles */}
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 pb-20 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => { audioManager.play('click'); window.location.href = '/inicio'; }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-white">Sistema de Ligas</h1>
            <p className="text-xs font-bold text-white/50">Tu camino de progresion</p>
          </div>
        </div>

        {/* Ver diseños de ligas button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { audioManager.play('click'); window.location.href = '/ligas/disenos'; }}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10"
        >
          <Palette size={18} className="text-purple-400" />
          <span className="text-sm font-black text-white">Ver diseños de ligas</span>
        </motion.button>

        {/* Current league summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <LeagueBadge league={currentLeague} size="lg" circular />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tu liga actual</p>
              <p className="text-xl font-black text-white">{currentLeague.fullName}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Star size={14} fill="#F9A825" stroke="#F9A825" />
                <span className="text-sm font-black text-white">{stars.toLocaleString('es-ES')}</span>
                <span className="text-xs font-bold text-white/40">estrellas</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* League progression path */}
        <div className="mb-10">
          <h2 className="mb-4 text-center text-sm font-black uppercase tracking-widest text-white/40">
            Camino de progresion
          </h2>

          <div className="relative">
            {/* Vertical line connecting leagues */}
            <div
              className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
              }}
            />

            {LEAGUES.map((league, idx) => {
              const unlocked = isLeagueUnlocked(stars, league);
              const isCurrent = league.id === currentLeague.id;
              const isLast = idx === LEAGUES.length - 1;
              const isEven = idx % 2 === 0;

              return (
                <motion.div
                  key={league.id}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.4 }}
                  className={`relative mb-4 flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Content side */}
                  <div className={`flex-1 ${isEven ? 'pr-6 text-right' : 'pl-6 text-left'}`}>
                    <div
                      className={`inline-block rounded-xl px-3 py-2 ${
                        isCurrent
                          ? 'border-2 bg-white/10 backdrop-blur-sm'
                          : unlocked
                          ? 'bg-white/5'
                          : 'bg-white/[0.02]'
                      }`}
                      style={
                        isCurrent
                          ? { borderColor: `${league.color}60` }
                          : {}
                      }
                    >
                      <p
                        className={`text-sm font-black ${
                          unlocked ? 'text-white' : 'text-white/30'
                        } ${isCurrent ? 'text-white' : ''}`}
                        style={isCurrent ? { color: league.color } : {}}
                      >
                        {league.fullName}
                      </p>
                      <p className={`text-[10px] font-bold ${unlocked ? 'text-white/50' : 'text-white/20'}`}>
                        {league.starsRequired.toLocaleString('es-ES')} estrellas
                      </p>
                    </div>
                  </div>

                  {/* Center node */}
                  <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
                    {isCurrent ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <LeagueBadge league={league} size="md" circular />
                      </motion.div>
                    ) : (
                      <LeagueBadge
                        league={league}
                        size="sm"
                        circular
                        locked={!unlocked}
                      />
                    )}
                  </div>

                  {/* Empty space for the other side */}
                  <div className="flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Ranking toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { audioManager.play('click'); setShowRanking(!showRanking); }}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-sm font-black text-white">TOP 50 Jugadores</span>
          </div>
          {showRanking ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
        </motion.button>

        <AnimatePresence>
          {showRanking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                {rankingError && (
                  <div className="px-4 py-6 text-center text-sm font-bold text-white/50">
                    {rankingError}
                  </div>
                )}
                {!rankingError && ranking.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm font-bold text-white/50">
                    Cargando ranking...
                  </div>
                )}
                {ranking.map((player, idx) => {
                  const league = getLeagueByStars(player.estrellas);
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 border-b border-white/5 px-4 py-3 ${
                        idx === ranking.length - 1 && !myEntry?.es_tu ? 'border-b-0' : ''
                      } ${player.es_tu ? 'bg-yellow-400/5' : ''}`}
                    >
                      <span className="w-6 text-center text-xs font-black text-white/40">
                        {player.posicion || idx + 1}
                      </span>
                      <img
                        src={player.avatar || '/images/avatares/gueguense.png'}
                        alt={player.nombre}
                        draggable={false}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">{player.nombre}</p>
                        <div className="flex items-center gap-1.5">
                          <LeagueBadge league={league} size="xs" circular />
                          <p className="text-[10px] font-bold" style={{ color: league.color }}>
                            {league.fullName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} fill="#F9A825" stroke="#F9A825" />
                        <span className="text-xs font-black text-white">
                          {player.estrellas.toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Player's own position */}
                <div className="border-t border-yellow-400/30 bg-yellow-400/10 px-4 py-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-yellow-400/60">
                    Tu posicion
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-black text-yellow-400">
                      #{playerPosition ?? '—'}
                    </span>
                    <img
                      src={myEntry?.avatar || currentUser?.avatar || '/images/avatares/gueguense.png'}
                      alt={myEntry?.nombre || currentUser?.nombre || 'Tu'}
                      draggable={false}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {myEntry?.nombre || currentUser?.nombre || 'Tu'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <LeagueBadge league={currentLeague} size="xs" circular />
                        <p className="text-[10px] font-bold" style={{ color: currentLeague.color }}>
                          {currentLeague.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} fill="#F9A825" stroke="#F9A825" />
                      <span className="text-sm font-black text-yellow-400">
                        {stars.toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Twinkle animation */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}

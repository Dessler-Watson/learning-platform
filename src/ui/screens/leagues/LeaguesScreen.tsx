'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { LeagueBadge } from '@/ui/components/LeagueBadge';
import { useLeagueStore } from '@/stores/league.store';
import { LEAGUES, type League, isLeagueUnlocked, getLeagueByStars } from '@/lib/leagues';
import { audioManager } from '@/shared/lib/audio';

// ============================================================
// MOCK RANKING DATA — stable for testing
// ============================================================

interface MockPlayer {
  id: string;
  nombre: string;
  avatar: string;
  stars: number;
}

const MOCK_RANKING: MockPlayer[] = [
  { id: 'r1', nombre: 'Sofia M.', avatar: '/images/avatares/leon.png', stars: 23800 },
  { id: 'r2', nombre: 'Carlos R.', avatar: '/images/avatares/mariposa.png', stars: 22100 },
  { id: 'r3', nombre: 'Ana L.', avatar: '/images/avatares/guardabarranco.png', stars: 20500 },
  { id: 'r4', nombre: 'Diego P.', avatar: '/images/avatares/madrono.png', stars: 19200 },
  { id: 'r5', nombre: 'Laura G.', avatar: '/images/avatares/nacatamal.png', stars: 18400 },
  { id: 'r6', nombre: 'Pedro S.', avatar: '/images/avatares/sacuanjoche.png', stars: 17600 },
  { id: 'r7', nombre: 'Camila R.', avatar: '/images/avatares/mariposa.png', stars: 16800 },
  { id: 'r8', nombre: 'Andres V.', avatar: '/images/avatares/leon.png', stars: 15900 },
  { id: 'r9', nombre: 'Isabella C.', avatar: '/images/avatares/guardabarranco.png', stars: 15100 },
  { id: 'r10', nombre: 'Mateo F.', avatar: '/images/avatares/madrono.png', stars: 14300 },
  { id: 'r11', nombre: 'Valentina T.', avatar: '/images/avatares/nacatamal.png', stars: 13500 },
  { id: 'r12', nombre: 'Nicolas A.', avatar: '/images/avatares/sacuanjoche.png', stars: 12700 },
  { id: 'r13', nombre: 'Gabriela N.', avatar: '/images/avatares/mariposa.png', stars: 11900 },
  { id: 'r14', nombre: 'Santiago P.', avatar: '/images/avatares/leon.png', stars: 11100 },
  { id: 'r15', nombre: 'Daniela P.', avatar: '/images/avatares/guardabarranco.png', stars: 10300 },
  { id: 'r16', nombre: 'Roberto G.', avatar: '/images/avatares/madrono.png', stars: 9500 },
  { id: 'r17', nombre: 'Patricia R.', avatar: '/images/avatares/nacatamal.png', stars: 8700 },
  { id: 'r18', nombre: 'Javier O.', avatar: '/images/avatares/sacuanjoche.png', stars: 7900 },
  { id: 'r19', nombre: 'Lucia H.', avatar: '/images/avatares/mariposa.png', stars: 7100 },
  { id: 'r20', nombre: 'Miguel T.', avatar: '/images/avatares/leon.png', stars: 6300 },
  { id: 'r21', nombre: 'Emma V.', avatar: '/images/avatares/guardabarranco.png', stars: 5500 },
  { id: 'r22', nombre: 'Daniel M.', avatar: '/images/avatares/madrono.png', stars: 4700 },
  { id: 'r23', nombre: 'Sofia L.', avatar: '/images/avatares/nacatamal.png', stars: 4000 },
  { id: 'r24', nombre: 'Sebastian R.', avatar: '/images/avatares/sacuanjoche.png', stars: 3400 },
  { id: 'r25', nombre: 'Mariana C.', avatar: '/images/avatares/mariposa.png', stars: 2900 },
  { id: 'r26', nombre: 'Adrian P.', avatar: '/images/avatares/leon.png', stars: 2500 },
  { id: 'r27', nombre: 'Paula S.', avatar: '/images/avatares/guardabarranco.png', stars: 2100 },
  { id: 'r28', nombre: 'Diego A.', avatar: '/images/avatares/madrono.png', stars: 1800 },
  { id: 'r29', nombre: 'Carla M.', avatar: '/images/avatares/nacatamal.png', stars: 1500 },
  { id: 'r30', nombre: 'Fernando G.', avatar: '/images/avatares/sacuanjoche.png', stars: 1200 },
  { id: 'r31', nombre: 'Ana P.', avatar: '/images/avatares/mariposa.png', stars: 1000 },
  { id: 'r32', nombre: 'Luis R.', avatar: '/images/avatares/leon.png', stars: 800 },
  { id: 'r33', nombre: 'Carmen V.', avatar: '/images/avatares/guardabarranco.png', stars: 600 },
  { id: 'r34', nombre: 'Roberto M.', avatar: '/images/avatares/madrono.png', stars: 450 },
  { id: 'r35', nombre: 'Laura S.', avatar: '/images/avatares/nacatamal.png', stars: 300 },
  { id: 'r36', nombre: 'Miguel A.', avatar: '/images/avatares/sacuanjoche.png', stars: 200 },
  { id: 'r37', nombre: 'Isabel C.', avatar: '/images/avatares/mariposa.png', stars: 150 },
  { id: 'r38', nombre: 'Carlos G.', avatar: '/images/avatares/leon.png', stars: 100 },
  { id: 'r39', nombre: 'Maria P.', avatar: '/images/avatares/guardabarranco.png', stars: 50 },
  { id: 'r40', nombre: 'Jose M.', avatar: '/images/avatares/madrono.png', stars: 25 },
  { id: 'r41', nombre: 'Teresa L.', avatar: '/images/avatares/nacatamal.png', stars: 15 },
  { id: 'r42', nombre: 'Ricardo V.', avatar: '/images/avatares/sacuanjoche.png', stars: 10 },
  { id: 'r43', nombre: 'Claudia S.', avatar: '/images/avatares/mariposa.png', stars: 5 },
  { id: 'r44', nombre: 'Fernando R.', avatar: '/images/avatares/leon.png', stars: 3 },
  { id: 'r45', nombre: 'Patricia M.', avatar: '/images/avatares/guardabarranco.png', stars: 2 },
  { id: 'r46', nombre: 'Jorge A.', avatar: '/images/avatares/madrono.png', stars: 1 },
  { id: 'r47', nombre: 'Sandra C.', avatar: '/images/avatares/nacatamal.png', stars: 0 },
  { id: 'r48', nombre: 'Manuel P.', avatar: '/images/avatares/sacuanjoche.png', stars: 0 },
  { id: 'r49', nombre: 'Rosa L.', avatar: '/images/avatares/mariposa.png', stars: 0 },
  { id: 'r50', nombre: 'Pedro G.', avatar: '/images/avatares/leon.png', stars: 0 },
];

// ============================================================
// COMPONENT
// ============================================================

export function LeaguesScreen() {
  const stars = useLeagueStore((s) => s.stars);
  const initStars = useLeagueStore((s) => s.initStars);
  const getCurrentLeague = useLeagueStore((s) => s.getCurrentLeague);
  const [showRanking, setShowRanking] = useState(false);
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
        avatar: `/images/avatares/${['gueguense.png','leon.png','mascara.png','mariposa.png','nacatamal.png','guardabarranco.png','sacuanjoche.png','madrono.png','ideay.png'][avatarId] || 'gueguense.png'}`,
      });
    }
  }, []);

  // Calculate player position
  const playerPosition = useMemo(() => {
    const allPlayers = [...MOCK_RANKING];
    // Insert current player
    const playerEntry: MockPlayer = {
      id: 'current',
      nombre: currentUser?.nombre || 'Tu',
      avatar: currentUser?.avatar || '/images/avatares/gueguense.png',
      stars,
    };
    allPlayers.push(playerEntry);
    allPlayers.sort((a, b) => b.stars - a.stars);
    const idx = allPlayers.findIndex(p => p.id === 'current');
    return idx >= 0 ? idx + 1 : allPlayers.length;
  }, [stars, currentUser]);

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
                {MOCK_RANKING.map((player, idx) => {
                  const league = getLeagueByStars(player.stars);
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 border-b border-white/5 px-4 py-3 ${
                        idx === MOCK_RANKING.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <span className="w-6 text-center text-xs font-black text-white/40">
                        {idx + 1}
                      </span>
                      <img
                        src={player.avatar}
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
                          {player.stars.toLocaleString('es-ES')}
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
                      #{playerPosition}
                    </span>
                    <img
                      src={currentUser?.avatar || '/images/avatares/gueguense.png'}
                      alt={currentUser?.nombre || 'Tu'}
                      draggable={false}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {currentUser?.nombre || 'Tu'}
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

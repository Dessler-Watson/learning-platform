'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Sparkles, GraduationCap, BookOpen, Gamepad2, PartyPopper } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { getMockRoom, MOCK_PLAYER_NAMES, type RoomData } from '@/lib/rooms';
import { avatarUrl } from '@/lib/avatares';

interface Player {
  id: string;
  nombre: string;
  avatar: string;
  esYo: boolean;
}

type Phase = 'filling' | 'full' | 'countdown' | 'go';

function loadCurrentUser(): { nombre: string; avatar: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('eduplay_user');
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    const avatarId = u.avatar_id || 1;
    return { nombre: u.nombre || 'Jugador', avatar: avatarUrl(avatarId) };
  } catch {
    return null;
  }
}

export function WaitingRoomScreen() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo');

  const room: RoomData = getMockRoom(codigo);

  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('filling');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const mostrarYo = useRef(false);
  const fullAnnounced = useRef(false);

  useEffect(() => {
    const current = loadCurrentUser();
    const yo: Player = {
      id: 'yo',
      nombre: current?.nombre || 'Jugador',
      avatar: current?.avatar || avatarUrl(1),
      esYo: true,
    };
    setPlayers([yo]);
    mostrarYo.current = true;
  }, []);

  useEffect(() => {
    if (!mostrarYo.current) return;
    const max = room.maxJugadores;
    const nombreList = MOCK_PLAYER_NAMES.filter(
      (n, i) => i < max - 1
    );

    nombreList.forEach((nombre, idx) => {
      const delay = 1800 + idx * 700;
      const t = setTimeout(() => {
        setPlayers(prev => {
          if (prev.length >= max) return prev;
          return [...prev, {
            id: `guest-${idx}`,
            nombre,
            avatar: avatarUrl(idx + 2),
            esYo: false,
          }];
        });
        setAnnouncement(`${nombre} se ha unido`);
        setTimeout(() => setAnnouncement(null), 1600);
      }, delay);
      timers.current.push(t);
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [room.maxJugadores]);

  useEffect(() => {
    if (players.length >= room.maxJugadores && !fullAnnounced.current) {
      fullAnnounced.current = true;
      setPhase('full');
      setAnnouncement(null);
      const t1 = setTimeout(() => {
        setPhase('countdown');
        startCountdown();
      }, 2000);
      timers.current.push(t1);
    }
  }, [players.length, room.maxJugadores]);

  const startCountdown = () => {
    const nums = [3, 2, 1];
    nums.forEach((n, i) => {
      const t = setTimeout(() => setCountdown(n), i * 900);
      timers.current.push(t);
    });
    const tGo = setTimeout(() => {
      setCountdown(null);
      setPhase('go');
    }, nums.length * 900);
    timers.current.push(tGo);

    const tRedirect = setTimeout(() => {
      window.location.href = '/camino-decisiones';
    }, nums.length * 900 + 1500);
    timers.current.push(tRedirect);
  };

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const pct = Math.round((players.length / room.maxJugadores) * 100);

  return (
    <main className="relative min-h-screen px-4 pb-12 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-lg"
      >
        {/* Volver */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, y: 2 }}
          onClick={() => { window.location.href = '/inicio'; }}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2.5 text-sm font-black text-surface-500 shadow-card transition-colors hover:bg-white"
        >
          <ArrowLeft size={16} /> Salir de la sala
        </motion.button>

        {/* Bienvenida */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-2 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-edu-pink-light/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-edu-pink">
            <Sparkles size={14} /> Bienvenido a la sala!
          </div>
          <h1 className="font-baloo text-3xl font-black text-surface-800">
            {room.nombre}
          </h1>
          <p className="mt-1 text-sm font-bold text-surface-500">
            Codigo: <span className="font-black tracking-wider text-edu-pink">{room.codigo}</span>
          </p>
        </motion.div>

        {/* Informacion de la sala */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card-game mt-5 p-4"
        >
          <InfoRow icon={<GraduationCap size={20} />} label="Docente" value={room.docente} color="#EB5D70" />
          <InfoRow icon={<BookOpen size={20} />} label="Curso" value={room.curso} color="#00A0B5" />
          <InfoRow icon={<Gamepad2 size={20} />} label="Actividad" value={room.actividad} color="#FFA000" />
        </motion.div>

        {/* Contador */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 flex items-center justify-center gap-3 rounded-3xl bg-edu-blue p-5 text-white shadow-game"
          style={{ boxShadow: '0 6px 0 rgba(0, 138, 157, 0.4), 0 10px 28px rgba(0,160,181,0.35)' }}
        >
          <Users size={24} />
          <span className="text-2xl font-black">
            {players.length} / {room.maxJugadores}
          </span>
          <span className="text-xs font-black uppercase tracking-widest opacity-90">
            Jugadores
          </span>
        </motion.div>

        {/* Jugadores */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mt-5"
        >
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-surface-500">
            Jugadores en la sala
          </p>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
            <AnimatePresence>
              {players.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl p-3 ${p.esYo ? 'bg-white' : 'bg-white/70'}`}
                  style={{
                    border: p.esYo ? '2px solid #EB5D70' : '2px solid rgba(0,0,0,0.05)',
                    boxShadow: p.esYo ? '0 6px 0 rgba(235,93,112,0.15), 0 8px 20px rgba(235,93,112,0.2)' : '0 4px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {p.esYo && (
                    <span className="absolute -top-2 right-3 rounded-full bg-edu-pink px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                      TU
                    </span>
                  )}
                  <div className="h-12 w-12 overflow-hidden rounded-full" style={{ background: '#fff7ef' }}>
                    <img src={p.avatar} alt={p.nombre} draggable={false} className="h-full w-full object-cover" />
                  </div>
                  <span className={`text-center text-[11px] font-black leading-tight ${p.esYo ? 'text-edu-pink' : 'text-surface-500'}`}>
                    {p.nombre}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Estado de espera / sala completa */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 text-center"
        >
          {phase === 'filling' && (
            <div>
              <p className="text-base font-black text-surface-500">
                Esperando al docente <Dots />
              </p>
              <p className="mt-1 text-xs font-bold text-surface-400">
                El juego comenzara cuando el docente este listo.
              </p>
            </div>
          )}

          {phase === 'full' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="inline-flex flex-col items-center gap-2"
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-black text-[#562F00] shadow-game"
                style={{ background: 'linear-gradient(135deg, #FFEF5A, #F9A825)', boxShadow: '0 6px 0 rgba(249,168,37,0.4), 0 10px 28px rgba(249,168,37,0.35)' }}
              >
                <PartyPopper size={22} /> TODOS ESTAN LISTOS!
              </div>
              <p className="text-xs font-bold text-surface-500">
                Sala completa! El docente dara comienzo...
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Aviso de jugador entrando */}
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="sticky bottom-5 z-10 mx-auto w-max max-w-[90%] rounded-full border-2 border-edu-blue/20 bg-white/95 px-5 py-2.5 text-sm font-black text-surface-500 shadow-lg"
            >
              <Sparkles size={14} className="mr-1 inline text-edu-blue" /> <span className="text-edu-blue">{announcement}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cuenta regresiva en pantalla completa */}
      <AnimatePresence>
        {(phase === 'countdown' || phase === 'go') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-80 flex items-center justify-center"
            style={{ background: 'rgba(30,20,10,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <AnimatePresence mode="wait">
              {phase === 'countdown' && countdown !== null && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="font-baloo text-[120px] font-black text-edu-yellow"
                  style={{ textShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
                >
                  {countdown}
                </motion.div>
              )}

              {phase === 'go' && (
                <motion.div
                  initial={{ scale: 2, opacity: 0, rotate: -6 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                  className="text-center"
                >
                  <div className="mb-2 flex justify-center text-edu-blue">
                    <Gamepad2 size={64} />
                  </div>
                  <div
                    className="font-baloo text-6xl font-black text-edu-yellow"
                    style={{ textShadow: '0 6px 30px rgba(0,0,0,0.4)' }}
                  >
                    VAMOS!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de progreso de llenado de la sala */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mx-auto mt-6 max-w-lg"
      >
        <div className="h-3 overflow-hidden rounded-full border border-black/5 bg-black/5">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-edu-pink to-edu-blue"
          />
        </div>
      </motion.div>
    </main>
  );
}

function InfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-wider text-surface-400">{label}</div>
        <div className="text-sm font-black leading-tight text-surface-800">{value}</div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="ml-1 inline-flex gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="inline-block text-lg text-edu-blue"
        >
          •
        </motion.span>
      ))}
    </span>
  );
}

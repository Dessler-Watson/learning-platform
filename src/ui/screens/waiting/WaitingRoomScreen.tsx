'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Sparkles, GraduationCap, BookOpen, Gamepad2, PartyPopper, AlertTriangle } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { LeagueBadge } from '@/ui/components/LeagueBadge';
import { gameRouteFor, type RoomData } from '@/lib/rooms';
import { avatarUrl } from '@/lib/avatares';
import { getCustomAvatar } from '@/lib/custom-avatar';

interface Player {
  id: string;
  nombre: string;
  avatar: string;
  esYo: boolean;
  stars: number;
}

type Phase = 'loading' | 'error' | 'waiting' | 'full' | 'countdown' | 'go' | 'closed';

interface RoomSnapshot {
  room: RoomData;
  players: Player[];
  myId: string;
  esHost: boolean;
  estado: string;
}

function mapPlayer(p: {
  user_id: string;
  display_name: string;
  avatar: string | null;
  avatar_sort: number | null;
  stars: number;
}, myId: string): Player {
  const esYo = p.user_id === myId;
  let avatar = p.avatar || avatarUrl((p.avatar_sort ?? 1) || 1);
  if (esYo) {
    avatar = getCustomAvatar() || avatar;
  }
  return {
    id: p.user_id,
    nombre: p.display_name || 'Jugador',
    avatar,
    esYo,
    stars: Number(p.stars) || 0,
  };
}

export function WaitingRoomScreen() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get('codigo');

  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const startedRef = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const pushTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  const beginCountdown = useCallback((modo: string) => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase('countdown');
    [3, 2, 1].forEach((n, i) => pushTimer(() => setCountdown(n), i * 900));
    pushTimer(() => {
      setCountdown(null);
      setPhase('go');
    }, 2700);
    pushTimer(() => {
      window.location.href = gameRouteFor(modo);
    }, 4200);
  }, []);

  const applySnapshot = useCallback((data: {
    sala: {
      id: string;
      code: string;
      name: string | null;
      mode_code: string;
      mode_name: string | null;
      status: string;
      max_players: number | null;
      docente: string | null;
      curso: string | null;
    };
    participantes: Array<{
      user_id: string;
      display_name: string;
      avatar: string | null;
      avatar_sort: number | null;
      stars: number;
    }>;
    usuario_id: string;
    es_host: boolean;
  }) => {
    const room: RoomData = {
      id: data.sala.id,
      codigo: data.sala.code,
      nombre: data.sala.name || `Sala ${data.sala.code}`,
      docente: data.sala.docente || 'Docente',
      curso: data.sala.curso || 'Curso',
      actividad: data.sala.mode_name || data.sala.mode_code,
      maxJugadores: data.sala.max_players ?? 8,
      estado: data.sala.status,
      modo: data.sala.mode_code,
    };
    const players = data.participantes.map((p) => mapPlayer(p, data.usuario_id));

    const nextIds = new Set(players.map((p) => p.id));
    if (prevIdsRef.current.size > 0) {
      for (const p of players) {
        if (!prevIdsRef.current.has(p.id) && !p.esYo) {
          setAnnouncement(`${p.nombre} se ha unido`);
          pushTimer(() => setAnnouncement(null), 1600);
        }
      }
    }
    prevIdsRef.current = nextIds;

    setSnapshot({ room, players, myId: data.usuario_id, esHost: data.es_host, estado: data.sala.status });

    if (data.sala.status === 'in_progress') {
      beginCountdown(data.sala.mode_code);
      return;
    }
    if (data.sala.status === 'finished' || data.sala.status === 'archived') {
      setPhase('closed');
      return;
    }

    if (players.length >= room.maxJugadores) {
      setPhase('full');
    } else {
      setPhase((prev) => (prev === 'full' ? prev : 'waiting'));
    }
  }, [beginCountdown]);

  const leaveRequestedRef = useRef(false);

  const loadRoom = useCallback(async (opts?: { join?: boolean }) => {
    if (!codigo) {
      setPhase('error');
      setErrorMsg('Código de sala requerido');
      return;
    }
    if (leaveRequestedRef.current) return;
    try {
      const joinQs = opts?.join === false ? '&join=0' : '';
      const res = await fetch(`/api/salas?code=${encodeURIComponent(codigo)}${joinQs}`, { cache: 'no-store' });
      if (res.status === 401) {
        setPhase('error');
        setErrorMsg('Debes iniciar sesión para entrar a la sala');
        return;
      }
      if (res.status === 404) {
        setPhase('error');
        setErrorMsg('Sala no encontrada. Verifica el código.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPhase('error');
        setErrorMsg(data.error || 'No se pudo cargar la sala');
        return;
      }
      const data = await res.json();
      applySnapshot(data);
    } catch {
      setPhase('error');
      setErrorMsg('Error de conexión. Intenta de nuevo.');
    }
  }, [codigo, applySnapshot]);

  useEffect(() => {
    sessionStorage.removeItem('eduplay_practice');
    clearTimers();
    prevIdsRef.current = new Set();
    startedRef.current = false;
    leaveRequestedRef.current = false;
    setPhase('loading');
    loadRoom({ join: true });
    pollRef.current = setInterval(() => {
      if (!startedRef.current && !leaveRequestedRef.current) loadRoom({ join: false });
    }, 2000);
    return () => {
      clearTimers();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadRoom]);

  const salir = async () => {
    leaveRequestedRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    if (snapshot?.room.id && snapshot.myId) {
      try {
        await fetch('/api/salas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leave', room_id: snapshot.room.id }),
        });
      } catch { /* best-effort */ }
    }
    window.location.href = '/inicio';
  };

  const room = snapshot?.room;
  const players = snapshot?.players ?? [];
  const pct = room ? Math.round((players.length / room.maxJugadores) * 100) : 0;

  if (phase === 'loading' && !snapshot) {
    return (
      <main className="relative min-h-screen px-4 pb-12 pt-6">
        <Background />
        <div className="relative z-10 mx-auto mt-24 max-w-lg text-center text-sm font-black text-surface-500">
          Cargando sala...
        </div>
      </main>
    );
  }

  if (phase === 'error' && !snapshot) {
    return (
      <main className="relative min-h-screen px-4 pb-12 pt-6">
        <Background />
        <div className="relative z-10 mx-auto mt-24 max-w-lg rounded-2xl bg-white/80 p-6 text-center shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-edu-pink-light/40 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-edu-pink">
            <AlertTriangle size={14} /> Sala no disponible
          </div>
          <p className="text-sm font-bold text-surface-500">{errorMsg}</p>
          <button
            onClick={() => { window.location.href = '/inicio'; }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2.5 text-sm font-black text-surface-500 shadow-card transition-colors hover:bg-white"
          >
            <ArrowLeft size={16} /> Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  if (!room) return null;

  return (
    <main className="relative min-h-screen px-4 pb-12 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-lg"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, y: 2 }}
          onClick={salir}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2.5 text-sm font-black text-surface-500 shadow-card transition-colors hover:bg-white"
        >
          <ArrowLeft size={16} /> Salir de la sala
        </motion.button>

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
                  <LeagueBadge stars={p.stars} size="xs" circular />
                  <span className={`text-center text-[11px] font-black leading-tight ${p.esYo ? 'text-edu-pink' : 'text-surface-500'}`}>
                    {p.nombre}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 text-center"
        >
          {(phase === 'waiting' || phase === 'loading') && (
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

          {phase === 'closed' && (
            <div>
              <p className="text-base font-black text-edu-pink">La sala ya termino</p>
              <button
                onClick={() => { window.location.href = '/inicio'; }}
                className="mt-3 rounded-xl border-2 border-surface-200 bg-white/70 px-4 py-2 text-sm font-black text-surface-500"
              >
                Volver al inicio
              </button>
            </div>
          )}

          {phase === 'error' && snapshot && (
            <p className="text-sm font-black text-edu-pink">{errorMsg}</p>
          )}
        </motion.div>

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

      <AnimatePresence>
        {(phase === 'countdown' || phase === 'go') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
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

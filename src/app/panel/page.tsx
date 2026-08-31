'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, DoorOpen, ArrowRight, Sparkles, Clock, Trash2, X, Flame } from 'lucide-react';
import { GameCard } from './components/shared/GameCard';
import { StatusBadge } from './components/shared/StatusBadge';
import { Button } from './ui/button';
import { salasService, juegosService, inicioService } from './services';
import { usePanelStore } from './store/usePanelStore';
import { audioManager } from './lib/audio';
import { Sala } from './types';
import { Actividad } from './types';
import { formatRelativeDate, cn, ESTADO_SALA_COLOR, ESTADO_SALA_LABEL } from './utils';
import { useClickLock } from './hooks/useClickLock';

const c = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const it = { hidden: { y: 24, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

const ACTIVITY_ICON_MAP: Record<string, typeof Sparkles> = {
  sala_creada: DoorOpen,
};

const ACTIVITY_COLOR_MAP: Record<string, string> = {
  sala_creada: 'text-cyan-500 bg-cyan-50 border border-cyan-100',
};

const ActivityItem = memo(function ActivityItem({ act, index, onDelete }: { act: Actividad; index: number; onDelete: (id: string) => void }) {
  const IconComp = ACTIVITY_ICON_MAP[act.tipo] || Clock;
  const colorClass = ACTIVITY_COLOR_MAP[act.tipo] || 'text-gray-400 bg-gray-50 border border-gray-100';
  const isSalaCreada = act.tipo === 'sala_creada';
  const clickLock = useClickLock(600);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-gray-50"
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', colorClass)}>
        <IconComp className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {isSalaCreada ? (
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{act.salaNombre}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{act.juegoNombre}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
              <span>{act.cursoNombre}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground truncate">{act.descripcion}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-gray-400">{formatRelativeDate(act.fecha)}</span>
      <button
        onClick={() => { if (clickLock()) onDelete(act.id); }}
        className="shrink-0 rounded-xl p-1.5 text-gray-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
        title="Eliminar registro"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
});

export default function InicioPage() {
  const router = useRouter();
  const teacherId = usePanelStore((s) => s.docente?.id);
  const docente = usePanelStore((s) => s.docente);
  const [stats, setStats] = useState({ totalCursos: 0, totalEstudiantes: 0, juegosActivos: 0, totalPreguntas: 0 });
  const [juegos, setJuegos] = useState<{ id: string; emoji: string; nombre: string; descripcion: string; color: string; estado: string; preguntasActivas: number }[]>([]);
  const [salaActiva, setSalaActiva] = useState<Sala | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    async function load() {
      const tid = teacherId!;
      const [est, jou, salasData, actData] = await Promise.all([
        inicioService.estadisticas(tid),
        juegosService.obtenerTodos(tid),
        salasService.obtenerTodas(tid),
        inicioService.actividad(tid),
      ]);
      setStats(est);
      setJuegos(jou);
      setActividades(actData);
      const activa = salasData.find((s) => s.estado === 'esperando' || s.estado === 'en_curso');
      setSalaActiva(activa ?? null);
      setLoading(false);
    }
    load();
  }, [teacherId]);

  const handleDeleteActivity = useCallback((id: string) => {
    audioManager.play('delete');
    setActividades((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    audioManager.play('delete');
    setActividades([]);
  }, []);

  const clickLock = useClickLock(600);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <motion.div variants={c} initial="hidden" animate="show" className="space-y-8">
        <motion.div variants={it} className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">
              Hola, <span className="text-cyan-500">{docente?.nombre?.split(' ')[0] ?? 'Docente'}</span>
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">Este es un resumen de la actividad de tus cursos y salas.</p>
        </motion.div>

        {salaActiva && (() => {
          const esLava = salaActiva.juegoId === 'juego-2';
          return (
            <motion.div
              variants={it}
              className={`group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md card-shimmer card-corner-decoration ${
                esLava
                  ? 'border-orange-200 bg-gradient-to-br from-orange-50/60 via-white to-red-50/40 hover:border-orange-300 card-lava-decoration'
                  : 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-cyan-50/40 hover:border-emerald-300'
              }`}
            >
              {/* Decorative elements */}
              <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-[0.04] pointer-events-none ${
                esLava ? 'bg-orange-400' : 'bg-emerald-400'
              }`} />
              <div className={`absolute -bottom-8 -left-8 h-24 w-24 rounded-full opacity-[0.03] pointer-events-none ${
                esLava ? 'bg-red-400' : 'bg-cyan-400'
              }`} />
              <div className="relative flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={ESTADO_SALA_LABEL[salaActiva.estado]}
                      className={ESTADO_SALA_COLOR[salaActiva.estado]}
                    />
                    {esLava && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                        <Flame className="h-3 w-3" /> Lava
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold tracking-tight text-foreground">{salaActiva.nombre}</h3>
                  <p className="text-sm text-gray-400">
                    Código: <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${esLava ? 'text-orange-500 bg-orange-50' : 'text-cyan-500 bg-cyan-50'}`}>{salaActiva.codigo}</span> · {salaActiva.participantes.length} estudiantes conectados
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`relative z-10 gap-2 ${
                    esLava
                      ? 'border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                      : 'border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300'
                  }`}
                  onClick={() => {
                    if (!clickLock()) return;
                    audioManager.play('click');
                    if (salaActiva.estado === 'esperando') router.push(`/panel/salas/${salaActiva.id}/lobby`);
                    else router.push(`/panel/salas/${salaActiva.id}/monitoreo`);
                  }}
                >
                  Entrar <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </div>
            </motion.div>
          );
        })()}

        {!salaActiva && (
          <motion.div
            variants={it}
            className="rounded-3xl border border-dashed border-cyan-200 bg-white/80 backdrop-blur-sm p-8 text-center shadow-sm card-corner-decoration"
          >
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-50 to-pink-50 border border-cyan-100">
              <DoorOpen className="h-6 w-6 text-cyan-400" />
            </div>
            <p className="text-sm font-bold text-foreground">No tienes salas activas</p>
            <p className="mt-1 text-xs text-gray-400">Crea una sala para comenzar a jugar con tus estudiantes</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { if (clickLock()) { audioManager.play('click'); router.push('/panel/salas/crear'); } }}
            >
              Crear sala
            </Button>
          </motion.div>
        )}

        {actividades.length > 0 && (
          <motion.section variants={it}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 border border-pink-100">
                  <Clock className="h-4 w-4 text-pink-500" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Actividad reciente</h2>
              </div>
              <button
                onClick={() => { if (clickLock()) handleClearAll(); }}
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-400 transition-all hover:bg-rose-50 hover:text-rose-500"
              >
                <X className="h-3.5 w-3.5" />
                Borrar historial
              </button>
            </div>
            <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-white p-4 shadow-sm card-shimmer">
              <div className="activity-scroll max-h-[360px] space-y-1 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {actividades.map((act, i) => (
                    <ActivityItem key={act.id} act={act} index={i} onDelete={handleDeleteActivity} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section variants={it}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100">
              <Sparkles className="h-4 w-4 text-cyan-500" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Juegos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {juegos.map((juego) => (
              <motion.div
                key={juego.id}
                variants={it}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <GameCard
                  nombre={juego.nombre}
                  descripcion={juego.descripcion}
                  color={juego.color}
                  juegoId={juego.id}
                  activo={juego.estado === 'activo'}
                  preguntasActivas={juego.preguntasActivas}
                  onCrearSala={() => router.push('/panel/salas/crear')}
                  onAdministrar={() => router.push(`/panel/juegos/${juego.id}/cursos`)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DoorOpen, Trash2, Flame } from 'lucide-react';
import { Button } from '../ui/button';
import { PageHeader } from '../components/shared/PageHeader';
import { SearchBar } from '../components/shared/SearchBar';
import { EmptyState } from '../components/shared/EmptyState';
import { StatusBadge } from '../components/shared/StatusBadge';
import { salasService } from '../services';
import { usePanelStore } from '../store/usePanelStore';
import { audioManager } from '../lib/audio';
import { Sala } from '../types';
import { formatDateTime, ESTADO_SALA_COLOR, ESTADO_SALA_LABEL } from '../utils';
import { useClickLock } from '../hooks/useClickLock';

const c = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const it = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

export default function SalasPage() {
  const router = useRouter();
  const teacherId = usePanelStore((s) => s.docente?.id);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const clickLock = useClickLock();

  useEffect(() => {
    if (!teacherId) return;
    salasService.obtenerTodas(teacherId).then((data) => {
      setSalas(data);
      setLoading(false);
    });
  }, [teacherId]);

  const filtered = salas.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (!clickLock()) return;
    audioManager.play('delete');
    await salasService.eliminar(id);
    setSalas((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A0B5] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <motion.div variants={c} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={it}>
          <PageHeader title="Salas" description="Gestiona las salas de juego">
            <Button
              onClick={() => { if (clickLock()) { audioManager.play('click'); router.push('/panel/salas/crear'); } }}
            >
              <Plus className="mr-1 h-4 w-4" /> Crear sala
            </Button>
          </PageHeader>
        </motion.div>

        <motion.div variants={it}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar salas..." />
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div variants={it}>
            <EmptyState
              iconComponent={DoorOpen}
              title="No hay salas"
              description={search ? 'No se encontraron salas con ese nombre.' : 'Crea tu primera sala para comenzar.'}
              action={!search ? (
                <Button variant="outline" onClick={() => router.push('/panel/salas/crear')}>
                  <Plus className="mr-1 h-4 w-4" /> Crear sala
                </Button>
              ) : undefined}
            />
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((sala) => {
                const esLava = sala.juegoId === 'juego-2';
                return (
                  <motion.div
                    key={sala.id}
                    variants={it}
                    layout
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className={`group card-shimmer card-corner-decoration rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden ${
                      esLava
                        ? 'border-orange-200 bg-gradient-to-br from-orange-50/60 via-white to-red-50/40 hover:border-orange-300 card-lava-decoration'
                        : 'border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-white hover:border-emerald-300 hover:shadow-glow-emerald'
                    }`}
                  >
                    {/* Subtle decorative dot */}
                    <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] pointer-events-none ${
                      esLava ? 'bg-orange-400' : 'bg-emerald-400'
                    }`} />
                    <div className={`absolute -bottom-6 -left-6 h-20 w-20 rounded-full opacity-[0.02] pointer-events-none ${
                       esLava ? 'bg-red-400' : 'bg-[#00A0B5]'
                    }`} />
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            label={ESTADO_SALA_LABEL[sala.estado]}
                            className={ESTADO_SALA_COLOR[sala.estado]}
                          />
                          {esLava && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                              <Flame className="h-3 w-3" /> Lava
                            </span>
                          )}
                          <span className="text-xs text-gray-400 font-medium">{formatDateTime(sala.createdAt)}</span>
                        </div>
                        <h3 className="font-bold tracking-tight text-foreground">{sala.nombre}</h3>
                        <p className="text-sm text-gray-400">
                          Código: <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${esLava ? 'text-[#FFA000] bg-[#FFA000]/10' : 'text-[#00A0B5] bg-[#00A0B5]/10'}`}>{sala.codigo}</span>
                          · {sala.participantes.length} participantes
                          · {sala.totalPreguntas} preguntas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {sala.estado === 'esperando' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={esLava ? 'border-orange-200 hover:bg-orange-50 hover:text-orange-600' : ''}
                            onClick={() => { if (clickLock()) { audioManager.play('click'); router.push(`/panel/salas/${sala.id}/lobby`); } }}
                          >
                            Lobby
                          </Button>
                        )}
                        {sala.estado === 'en_curso' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={esLava ? 'border-orange-200 hover:bg-orange-50 hover:text-orange-600' : ''}
                            onClick={() => { if (clickLock()) { audioManager.play('click'); router.push(`/panel/salas/${sala.id}/monitoreo`); } }}
                          >
                            Monitorear
                          </Button>
                        )}
                        {sala.estado === 'finalizada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={esLava ? 'border-orange-200 hover:bg-orange-50 hover:text-orange-600' : ''}
                            onClick={() => { if (clickLock()) { audioManager.play('click'); router.push(`/panel/salas/${sala.id}/resultados`); } }}
                          >
                            Resultados
                          </Button>
                        )}
                        <button
                          onClick={() => handleDelete(sala.id)}
                          className="rounded-xl p-1.5 text-gray-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                          title="Eliminar sala"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

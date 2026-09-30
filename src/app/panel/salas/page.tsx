'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DoorOpen, Trash2, ListChecks } from 'lucide-react';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { useToast } from '../ui/toast';
import { PageHeader } from '../components/shared/PageHeader';
import { SearchBar } from '../components/shared/SearchBar';
import { Pagination } from '../components/shared/Pagination';
import { EmptyState } from '../components/shared/EmptyState';
import { StatusBadge } from '../components/shared/StatusBadge';
import { ModeLogo, MODE_THEME, toGameModeId } from '@/shared/lib/game-modes';
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
  const { toast } = useToast();
  const teacherId = usePanelStore((s) => s.docente?.id);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busy, setBusy] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [seleccionandoTodas, setSeleccionandoTodas] = useState(false);
  const [showEliminarMuchosDialog, setShowEliminarMuchosDialog] = useState(false);
  const reqRef = useRef(0);
  const clickLock = useClickLock();

  const cargar = useCallback(async (page: number, q: string) => {
    const id = ++reqRef.current;
    setBusy(true);
    try {
      const data = await salasService.listar({ q: q.trim(), page, limit: 15 });
      if (id !== reqRef.current) return;
      setSalas(data.salas);
      setPagina(data.page);
      setTotalPaginas(data.totalPages);
      setLoading(false);
    } catch {
      if (id === reqRef.current) setLoading(false);
    } finally {
      if (id === reqRef.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    void cargar(1, '');
  }, [teacherId, cargar]);

  // Busqueda en servidor con debounce (siempre pagina 1)
  const searchDebounceRef = useRef(false);
  useEffect(() => {
    if (!searchDebounceRef.current) {
      searchDebounceRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setSeleccion([]);
      void cargar(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, cargar]);

  const handlePage = (page: number) => {
    if (page < 1 || page > totalPaginas || page === pagina || busy) return;
    audioManager.play('click');
    void cargar(page, search);
  };

  const seleccionables = salas.filter((s) => s.estado !== 'en_curso');
  const todosEnPagina = seleccionables.length > 0 && seleccionables.every((s) => seleccion.includes(s.id));

  const toggleTodos = () => {
    const idsPagina = seleccionables.map((s) => s.id);
    setSeleccion((prev) => {
      if (idsPagina.length > 0 && idsPagina.every((id) => prev.includes(id))) {
        return prev.filter((id) => !idsPagina.includes(id));
      }
      return Array.from(new Set([...prev, ...idsPagina]));
    });
  };

  const toggleUno = (id: string) => {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Selecciona TODAS las salas (todas las paginas, sin busqueda), excluyendo
  // las que estan en curso. El borrado se hace desde la barra roja existente.
  const seleccionarTodas = async () => {
    if (seleccionandoTodas || busy) return;
    audioManager.play('click');
    setSeleccionandoTodas(true);
    try {
      const ids: string[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const data = await salasService.listar({ q: '', page, limit: 100 });
        for (const s of data.salas) {
          if (s.estado !== 'en_curso' && !ids.includes(s.id)) ids.push(s.id);
        }
        totalPages = data.totalPages;
        page++;
      } while (page <= totalPages && page <= 50);
      if (ids.length === 0) {
        toast('No hay salas seleccionables', 'error');
      } else {
        setSeleccion(ids);
        toast(`${ids.length} sala${ids.length === 1 ? '' : 's'} seleccionada${ids.length === 1 ? '' : 's'}`, 'success');
      }
    } catch {
      toast('Error al cargar las salas', 'error');
    } finally {
      setSeleccionandoTodas(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!clickLock()) return;
    audioManager.play('delete');
    await salasService.eliminar(id);
    setSeleccion((prev) => prev.filter((x) => x !== id));
    await cargar(pagina, search);
  };

  const confirmarEliminarMuchos = async () => {
    if (seleccion.length === 0) return;
    setBusy(true);
    // La API admite maximo 200 ids por llamada: se borra por lotes.
    const ids = [...seleccion];
    let deleted = 0;
    let skipped = 0;
    let error: string | undefined;
    for (let i = 0; i < ids.length; i += 200) {
      const result = await salasService.eliminarMuchos(ids.slice(i, i + 200));
      if (!result.success) {
        error = result.error;
        break;
      }
      deleted += result.deleted;
      skipped += result.skipped;
    }
    setBusy(false);
    setShowEliminarMuchosDialog(false);
    if (!error) {
      if (skipped > 0) {
        toast(
          `${deleted} sala${deleted === 1 ? '' : 's'} eliminada${deleted === 1 ? '' : 's'} · ${skipped} omitida${skipped === 1 ? '' : 's'} (en curso o sin permiso)`,
          'success'
        );
      } else {
        toast(
          `${deleted} sala${deleted === 1 ? '' : 's'} eliminada${deleted === 1 ? '' : 's'}`,
          'success'
        );
      }
      setSeleccion([]);
      await cargar(pagina, search);
    } else {
      toast(error || 'Error al eliminar', 'error');
    }
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
              variant="outline"
              onClick={() => void seleccionarTodas()}
              disabled={busy || seleccionandoTodas || loading}
            >
              <ListChecks className="mr-1 h-4 w-4" />
              {seleccionandoTodas ? 'Seleccionando…' : 'Seleccionar todas'}
            </Button>
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

        {seleccion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
              <Trash2 className="h-4 w-4" />
              {seleccion.length} sala{seleccion.length === 1 ? '' : 's'} seleccionada{seleccion.length === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSeleccion([])}>
                Limpiar
              </Button>
              <Button
                size="sm"
                className="bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => { audioManager.play('delete'); setShowEliminarMuchosDialog(true); }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar seleccionados
              </Button>
            </div>
          </motion.div>
        )}

        {salas.length === 0 ? (
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
              {salas.map((sala) => {
                const modeId = toGameModeId(sala.juegoId);
                const esLava = modeId === 'lava';
                const theme = modeId ? MODE_THEME[modeId] : null;
                return (
                  <motion.div
                    key={sala.id}
                    variants={it}
                    layout
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className={`group card-shimmer card-corner-decoration rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden ${
                      seleccion.includes(sala.id) ? 'ring-2 ring-[#00A0B5]/40' : ''
                    } ${
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
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={seleccion.includes(sala.id)}
                        onChange={() => toggleUno(sala.id)}
                        disabled={sala.estado === 'en_curso'}
                        aria-label={`Seleccionar ${sala.nombre}`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#00A0B5] cursor-pointer disabled:opacity-40"
                      />
                      <div className="flex flex-1 items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            label={ESTADO_SALA_LABEL[sala.estado]}
                            className={ESTADO_SALA_COLOR[sala.estado]}
                          />
                          {theme && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ background: theme.bg, color: theme.colorDark }}
                            >
                              <ModeLogo mode={modeId} size={14} shape="circle" showBox={false} />
                              {theme.label}
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
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        <motion.div variants={it} className="flex justify-center">
          <Pagination page={pagina} totalPages={totalPaginas} disabled={busy} onPage={handlePage} />
        </motion.div>
      </motion.div>

      <ConfirmDialog
        open={showEliminarMuchosDialog}
        onOpenChange={setShowEliminarMuchosDialog}
        title="Eliminar salas seleccionadas"
        description={`¿Estás seguro de que deseas eliminar ${seleccion.length} sala${seleccion.length === 1 ? '' : 's'}? Se eliminará su historial de juego. Las salas con partida en curso se omitirán. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmarEliminarMuchos}
      />
    </div>
  );
}

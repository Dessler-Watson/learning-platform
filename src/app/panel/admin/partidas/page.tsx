'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, X, Gamepad2, Users, HelpCircle, PlayCircle, CalendarDays } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ConfirmDialog } from '../../ui/confirm-dialog';
import { useToast } from '../../ui/toast';
import { Pagination } from '../../components/shared/Pagination';
import { audioManager } from '../../lib/audio';
import { partidasService } from '../../services';
import { PartidaPublica } from '../../types';
import { MODE_THEME, GameModeId } from '@/shared/lib/game-modes';

const MODE_CHIPS: Array<{ id: GameModeId; label: string; color: string }> = (
  Object.values(MODE_THEME) as Array<{ id: GameModeId; label: string; color: string }>
);

function formatFecha(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPartidasPage() {
  const { toast } = useToast();

  const [partidas, setPartidas] = useState<PartidaPublica[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [qApplied, setQApplied] = useState<string | null>(null);
  const [modo, setModo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [showEliminarMuchosDialog, setShowEliminarMuchosDialog] = useState(false);
  const [selected, setSelected] = useState<PartidaPublica | null>(null);
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const reqRef = useRef(0);

  const cargarDatos = useCallback((page: number, q: string, mode: string) => {
    const reqId = ++reqRef.current;
    setCargandoLista(true);
    partidasService
      .listar({ q, mode, page, limit: 15 })
      .then((res) => {
        if (reqId !== reqRef.current) return;
        setPartidas(res.practicas);
        setPagina(res.page);
        setTotalPaginas(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => {
        if (reqId !== reqRef.current) return;
        setPartidas([]);
      })
      .finally(() => {
        if (reqId === reqRef.current) setCargandoLista(false);
      });
  }, []);

  // Búsqueda con debounce: reset a página 1; el filtro de modo se conserva.
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = busqueda.trim();
      if (q === qApplied) return;
      setQApplied(q);
      setSeleccion([]);
      setPagina(1);
      cargarDatos(1, q, modo);
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, qApplied, modo, cargarDatos]);

  const cambiarModo = useCallback((m: string) => {
    if (m === modo) return;
    setModo(m);
    setSeleccion([]);
    setPagina(1);
    cargarDatos(1, qApplied ?? '', m);
  }, [modo, qApplied, cargarDatos]);

  const cambiarPagina = useCallback(
    (p: number) => {
      if (p < 1 || p > totalPaginas || p === pagina || cargandoLista) return;
      setPagina(p);
      cargarDatos(p, qApplied ?? '', modo);
    },
    [pagina, totalPaginas, cargandoLista, qApplied, modo, cargarDatos]
  );

  const recargar = useCallback(
    () => cargarDatos(pagina, qApplied ?? '', modo),
    [pagina, qApplied, modo, cargarDatos]
  );

  const todosEnPagina = partidas.length > 0 && partidas.every((p) => seleccion.includes(p.id));

  const toggleTodos = useCallback(() => {
    setSeleccion((prev) => {
      const idsPagina = partidas.map((p) => p.id);
      if (idsPagina.length > 0 && idsPagina.every((id) => prev.includes(id))) {
        return prev.filter((id) => !idsPagina.includes(id));
      }
      return Array.from(new Set([...prev, ...idsPagina]));
    });
  }, [partidas]);

  const toggleUno = useCallback((id: string) => {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleEliminar = useCallback((p: PartidaPublica) => {
    audioManager.play('delete');
    setSelected(p);
    setShowEliminarDialog(true);
  }, []);

  const confirmarEliminar = useCallback(async () => {
    if (!selected) return;
    const result = await partidasService.eliminar(selected.id);
    if (result.success) {
      toast(`"${selected.titulo}" eliminada`, 'success');
      setShowEliminarDialog(false);
      setSelected(null);
      setSeleccion((prev) => prev.filter((id) => id !== selected.id));
      recargar();
    } else {
      toast(result.error || 'Error al eliminar', 'error');
    }
  }, [selected, toast, recargar]);

  const confirmarEliminarMuchos = useCallback(async () => {
    if (seleccion.length === 0) return;
    const ids = [...seleccion];
    setCargandoLista(true);
    const result = await partidasService.eliminarMuchos(ids);
    setCargandoLista(false);
    setShowEliminarMuchosDialog(false);
    if (result.success) {
      toast(
        result.deleted === 1 ? '1 partida eliminada' : `${result.deleted} partidas eliminadas`,
        'success'
      );
      setSeleccion([]);
      recargar();
    } else {
      toast(result.error || 'Error al eliminar', 'error');
    }
  }, [seleccion, toast, recargar]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partidas públicas</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona las prácticas publicadas por los jugadores</p>
        </div>
      </div>

      <Card variant="cyan">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, tema, creador o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-11"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modo:</span>
            <button
              onClick={() => cambiarModo('')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                modo === ''
                  ? 'bg-[#00A0B5] text-white border-[#00A0B5] shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              Todos
            </button>
            {MODE_CHIPS.map((m) => (
              <button
                key={m.id}
                onClick={() => cambiarModo(m.id)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all border"
                style={
                  modo === m.id
                    ? { backgroundColor: m.color, color: '#fff', borderColor: m.color, boxShadow: `0 2px 8px ${m.color}40` }
                    : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }
                }
              >
                {m.label}
              </button>
            ))}
          </div>

          {busqueda && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Filtro:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00A0B5]/10 px-3 py-1 text-xs font-medium text-[#00A0B5]">
                &quot;{busqueda}&quot;
                <button onClick={() => setBusqueda('')} className="hover:text-[#00A0B5]/80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {seleccion.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
            <Trash2 className="h-4 w-4" />
            {seleccion.length} partida{seleccion.length === 1 ? '' : 's'} seleccionada{seleccion.length === 1 ? '' : 's'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSeleccion([])}>
              Limpiar
            </Button>
            <Button
              size="sm"
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={() => setShowEliminarMuchosDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar seleccionados
            </Button>
          </div>
        </motion.div>
      )}

      <Card variant="emerald">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = seleccion.length > 0 && !todosEnPagina;
                      }}
                      checked={todosEnPagina}
                      onChange={toggleTodos}
                      disabled={partidas.length === 0}
                      aria-label="Seleccionar todos los de esta pagina"
                      className="h-4 w-4 rounded border-gray-300 accent-[#00A0B5] cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Creador</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Modo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Publicación</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Preguntas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Reproducciones</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cargandoLista && partidas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Gamepad2 className="h-8 w-8 text-gray-300 animate-pulse" />
                        <p className="text-sm text-gray-400">Cargando partidas...</p>
                      </div>
                    </td>
                  </tr>
                ) : partidas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Gamepad2 className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-400">No se encontraron partidas públicas</p>
                        <p className="text-xs text-gray-300">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  partidas.map((p) => {
                    const theme = MODE_THEME[p.modo as GameModeId];
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`group transition-colors ${seleccion.includes(p.id) ? 'bg-[#00A0B5]/5' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={seleccion.includes(p.id)}
                            onChange={() => toggleUno(p.id)}
                            aria-label={`Seleccionar ${p.titulo}`}
                            className="h-4 w-4 rounded border-gray-300 accent-[#00A0B5] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-white" style={{ backgroundColor: p.modoColor ?? theme?.color ?? '#00A0B5', borderColor: p.modoColor ?? theme?.color ?? '#00A0B5' }}>
                              <Gamepad2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{p.titulo}</p>
                              <p className="text-xs text-gray-400">
                                {p.tema ? `${p.tema} · ` : ''}#{p.code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            {p.creador}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: p.modoColor ?? theme?.color ?? '#00A0B5' }}
                          >
                            {p.modoNombre}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                            {formatFecha(p.fecha)}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-600">
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                            {p.preguntas}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#00A0B5]">
                            <PlayCircle className="h-4 w-4" />
                            {p.reproducciones}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEliminar(p)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
        <span>
          {total} partida{total === 1 ? '' : 's'} en total
        </span>
        <span>
          Mostrando {partidas.length} en esta pagina
        </span>
      </div>
      <Pagination page={pagina} totalPages={totalPaginas} disabled={cargandoLista} onPage={cambiarPagina} />

      <ConfirmDialog
        open={showEliminarDialog}
        onOpenChange={setShowEliminarDialog}
        title="Eliminar partida pública"
        description={`¿Estás seguro de que deseas eliminar "${selected?.titulo}"? Se borrarán sus preguntas y su historial de jugadas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmarEliminar}
      />

      <ConfirmDialog
        open={showEliminarMuchosDialog}
        onOpenChange={setShowEliminarMuchosDialog}
        title="Eliminar partidas seleccionadas"
        description={`¿Estás seguro de que deseas eliminar ${seleccion.length} partida${seleccion.length === 1 ? '' : 's'}? Se borrarán sus preguntas y su historial de jugadas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmarEliminarMuchos}
      />
    </div>
  );
}

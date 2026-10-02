'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, MoreVertical, Pencil, Copy, Trash2, ClipboardList, Sparkles, ArrowLeft, Book, HelpCircle } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import { Card, CardContent } from '../../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { ConfirmDialog } from '../../../ui/confirm-dialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { SearchBar } from '../../../components/shared/SearchBar';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Pagination } from '../../../components/shared/Pagination';

import { BackButton } from '../../../components/shared/BackButton';
import { ModeLogo } from '@/shared/lib/game-modes';
import { AIGenerateModal } from '../../../components/shared/AIGenerateModal';
import { GeneratedQuestion } from '../../../lib/aiGenerator';
import { usePanelStore } from '../../../store/usePanelStore';
import { useToast } from '../../../ui/toast';
import { audioManager } from '../../../lib/audio';
import { useClickLock } from '../../../hooks/useClickLock';
import { cursosService, juegosService, preguntasService, MAX_PREGUNTAS_POR_CURSO } from '../../../services';
import { CursoConDetalles } from '../../../services';
import { Curso, Juego } from '../../../types';
import { formatDateTime } from '../../../utils';

const st = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const it = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

interface CursoForm {
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'inactivo' | 'borrador';
}

const DEFAULT_FORM: CursoForm = { nombre: '', descripcion: '', estado: 'activo' };

export default function CursosPorJuegoPage() {
  const params = useParams();
  const router = useRouter();
  const gameModeId = params.id as string;
  const teacherId = usePanelStore((s) => s.docente?.id);
  const cursoCopiado = usePanelStore((s) => s.cursoCopiado);
  const setCursoCopiado = usePanelStore((s) => s.setCursoCopiado);
  const limpiarCursoCopiado = usePanelStore((s) => s.limpiarCursoCopiado);
  const { toast } = useToast();
  const clickLock = useClickLock();

  const [cursos, setCursos] = useState<CursoConDetalles[]>([]);
  const [juego, setJuego] = useState<Juego | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPreguntasStat, setTotalPreguntasStat] = useState(0);
  const [busy, setBusy] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [showEliminarMuchosDialog, setShowEliminarMuchosDialog] = useState(false);
  const reqRef = useRef(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [form, setForm] = useState<CursoForm>(DEFAULT_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Curso | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteName, setPasteName] = useState('');

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [aiModalOpen, setAiModalOpen] = useState(false);

  const [nombreError, setNombreError] = useState('');

  const cargar = useCallback(
    async (page: number, q: string) => {
      const id = ++reqRef.current;
      setBusy(true);
      try {
        const data = await cursosService.listar({ q: q.trim(), mode: gameModeId, page, limit: 15 });
        if (id !== reqRef.current) return;
        setCursos(data.cursos);
        setPagina(data.page);
        setTotalPaginas(data.totalPages);
        setTotal(data.total);
        setTotalPreguntasStat(data.totalPreguntas);
        setLoading(false);
      } catch {
        if (id === reqRef.current) setLoading(false);
      } finally {
        if (id === reqRef.current) setBusy(false);
      }
    },
    [gameModeId]
  );

  useEffect(() => {
    if (!teacherId) return;
    void cargar(1, '');
    void juegosService.obtenerPorId(gameModeId).then((j) => setJuego(j ?? null));
  }, [teacherId, gameModeId, cargar]);

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
    void cargar(page, search);
  };

  const todosEnPagina = cursos.length > 0 && cursos.every((c) => seleccion.includes(c.id));

  const toggleTodos = () => {
    const idsPagina = cursos.map((c) => c.id);
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

  const confirmarEliminarMuchos = async () => {
    if (seleccion.length === 0) return;
    setBusy(true);
    const result = await cursosService.eliminarMuchos([...seleccion]);
    setBusy(false);
    setShowEliminarMuchosDialog(false);
    if (result.success) {
      toast(
        `${result.deleted} curso${result.deleted === 1 ? '' : 's'} eliminado${result.deleted === 1 ? '' : 's'}`,
        'success'
      );
      setSeleccion([]);
      await cargar(pagina, search);
    } else {
      toast(result.error || 'Error al eliminar', 'error');
    }
  };

  const openCreate = () => {
    setEditingCurso(null);
    setForm(DEFAULT_FORM);
    setNombreError('');
    setFormOpen(true);
  };

  const openEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setForm({
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      estado: curso.estado,
    });
    setFormOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!teacherId || !clickLock()) return;
    if (!form.nombre.trim()) {
      toast('El nombre del curso es requerido.', 'error');
      return;
    }
    if (!editingCurso) {
      const existe = await cursosService.existeCursoConNombre(teacherId, gameModeId, form.nombre.trim());
      if (existe) {
        setNombreError('Este nombre ya existe, prueba con otro.');
        return;
      }
    }
    setNombreError('');
    audioManager.play('submit');
    if (editingCurso) {
      await cursosService.actualizar(editingCurso.id, form);
      toast('Curso actualizado correctamente.');
    } else {
      await cursosService.crear(teacherId, { ...form, gameModeId });
      toast('Curso creado correctamente.');
    }
    audioManager.play('success');
    setFormOpen(false);
    await cargar(pagina, search);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !clickLock()) return;
    await cursosService.eliminar(deleteTarget.id);
    toast('Curso eliminado.');
    setDeleteOpen(false);
    setDeleteTarget(null);
    setSeleccion((prev) => prev.filter((x) => x !== deleteTarget.id));
    await cargar(pagina, search);
  };

  const handleCopiar = async (cursoId: string) => {
    if (!clickLock()) return;
    const resultado = await cursosService.copiarCurso(cursoId);
    if (resultado) {
      setCursoCopiado(resultado.curso, resultado.preguntas);
      audioManager.play('copy');
      toast('Curso copiado. Ve a otro modo de juego para pegarlo.', 'info');
    }
    setMenuOpen(null);
  };

  const openPaste = () => {
    if (!cursoCopiado) return;
    setPasteName(`${cursoCopiado.curso.nombre} (Copia)`);
    setPasteOpen(true);
  };

  const handlePegar = async () => {
    if (!teacherId || !cursoCopiado || !clickLock()) return;
    const existe = await cursosService.existeCursoConNombre(teacherId, gameModeId, pasteName);
    if (existe) {
      toast('Ya existe un curso con ese nombre en este modo de juego.', 'error');
      return;
    }
    audioManager.play('submit');
    await cursosService.pegarCurso(teacherId, gameModeId, cursoCopiado, pasteName);
    limpiarCursoCopiado();
    setPasteOpen(false);
    toast('Curso pegado correctamente.');
    audioManager.play('success');
    await cargar(pagina, search);
  };

  const handleAiQuestionsGenerated = async (generated: GeneratedQuestion[], courseName: string) => {
    if (!teacherId) return;

    const nuevoCurso = await cursosService.crear(teacherId, {
      nombre: courseName || 'Curso generado con IA',
      descripcion: 'Curso creado automaticamente con IA',
      estado: 'activo',
      gameModeId,
    });

    for (const q of generated.slice(0, MAX_PREGUNTAS_POR_CURSO)) {
      const opciones: [string, string] = [q.optionA, q.optionB];
      const respuestaCorrecta = q.correctAnswer === 'A' ? opciones[0] : opciones[1];
      await preguntasService.crear(teacherId, {
        juegoId: gameModeId,
        cursoId: nuevoCurso.id,
        enunciado: q.question,
        opciones,
        respuestaCorrecta,
        estado: 'activa',
      });
    }

    toast(`Curso generado correctamente. Se agregaron ${Math.min(generated.length, MAX_PREGUNTAS_POR_CURSO)} preguntas.`);
    audioManager.play('success');
    await cargar(pagina, search);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A0B5] border-t-transparent" />
      </div>
    );
  }

  const totalCursos = total;
  const totalPreguntas = totalPreguntasStat;

  return (
    <div className="relative z-10">
      <motion.div variants={st} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={it}>
          <div className="flex items-center gap-3 mb-4">
            <BackButton onClick={() => router.push('/panel')} />
            {juego && (
              <div className="flex items-center gap-2">
                <ModeLogo mode={gameModeId} size={32} shape="square" />
                <span className="text-sm font-semibold text-foreground">{juego.nombre}</span>
              </div>
            )}
          </div>
          <PageHeader title="Cursos" description={`Gestiona los cursos de ${juego?.nombre ?? 'este modo de juego'}`}>
            <div className="flex items-center gap-2">
              {cursoCopiado && (
                <Button variant="outline" onClick={() => { audioManager.play('click'); openPaste(); }}>
                  <ClipboardList className="mr-1 h-4 w-4" /> Pegar curso
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400"
                onClick={() => { if (clickLock()) { audioManager.play('click'); setAiModalOpen(true); } }}
              >
                <Sparkles className="h-4 w-4 text-amber-500" /> Generar curso con IA
              </Button>
              <Button onClick={() => { if (clickLock()) { audioManager.play('click'); openCreate(); } }}>
                <Plus className="mr-1 h-4 w-4" /> Nuevo curso
              </Button>
            </div>
          </PageHeader>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          <motion.div variants={it}>
            <Card variant="cyan">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#00A0B5]/10">
                  <Book className="h-5 w-5 text-[#00A0B5]" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalCursos}</p>
                <p className="text-xs text-gray-400">Total cursos</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={it}>
            <Card variant="emerald">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#98C54E]/10">
                  <HelpCircle className="h-5 w-5 text-[#98C54E]" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalPreguntas}</p>
                <p className="text-xs text-gray-400">Total preguntas</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {cursoCopiado && (
          <motion.div variants={it}>
            <div className="flex items-center justify-between rounded-2xl border border-[#00A0B5]/30 bg-[#00A0B5]/5 px-4 py-3">
              <span className="text-sm font-medium text-[#00A0B5]">
                1 curso copiado: {cursoCopiado.curso.nombre} ({cursoCopiado.preguntas.length} preguntas)
              </span>
              <button onClick={() => { audioManager.play('click'); limpiarCursoCopiado(); }} className="text-xs font-semibold text-[#00A0B5] hover:text-[#00A0B5]/80">
                Limpiar
              </button>
            </div>
          </motion.div>
        )}

        <motion.div variants={it}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar cursos..." />
        </motion.div>

        {seleccion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
              <Trash2 className="h-4 w-4" />
              {seleccion.length} curso{seleccion.length === 1 ? '' : 's'} seleccionado{seleccion.length === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { audioManager.play('click'); setSeleccion([]); }}>
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

        {cursos.length === 0 ? (
          <motion.div variants={it}>
            <EmptyState
              iconComponent={BookOpen}
              title="No hay cursos"
              description={search ? 'No se encontraron cursos con ese nombre.' : 'Crea tu primer curso para comenzar.'}
              action={!search ? <Button variant="outline" onClick={() => { audioManager.play('modalOpen'); openCreate(); }}><Plus className="mr-1 h-4 w-4" /> Nuevo curso</Button> : undefined}
            />
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {cursos.map((curso) => {
                return (
                  <motion.div
                    key={curso.id}
                    variants={it}
                    layout
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative rounded-3xl border border-[#EB5D70]/20 bg-gradient-to-br from-white via-[#EB5D70]/5 to-white p-5 shadow-sm transition-all hover:shadow-glow-pink hover:border-[#EB5D70]/40 ${
                      seleccion.includes(curso.id) ? 'ring-2 ring-[#EB5D70]/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={seleccion.includes(curso.id)}
                          onChange={() => { audioManager.play('toggle'); toggleUno(curso.id); }}
                          aria-label={`Seleccionar ${curso.nombre}`}
                          className="h-4 w-4 rounded border-gray-300 accent-[#EB5D70] cursor-pointer"
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => { audioManager.play('click'); setMenuOpen(menuOpen === curso.id ? null : curso.id); }}
                          className="rounded-xl p-1.5 text-gray-300 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpen === curso.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => { audioManager.play('click'); setMenuOpen(null); }} />
                            <div className="absolute right-0 top-8 z-50 w-48 rounded-2xl border border-[#EB5D70]/20 bg-white py-1 shadow-md">
                              <button onClick={() => { audioManager.play('modalOpen'); openEdit(curso); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50">
                                <Pencil className="h-3.5 w-3.5 text-gray-400" /> Editar curso
                              </button>
                              <button onClick={() => { handleCopiar(curso.id); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50">
                                <Copy className="h-3.5 w-3.5 text-gray-400" /> Copiar curso
                              </button>
                              <button onClick={() => { router.push(`/panel/cursos/${curso.id}/preguntas`); setMenuOpen(null); audioManager.play('navigate'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50">
                                <ClipboardList className="h-3.5 w-3.5 text-gray-400" /> Ver preguntas
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              <button onClick={() => { audioManager.play('delete'); setDeleteTarget(curso); setDeleteOpen(true); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50">
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold tracking-tight text-foreground">{curso.nombre}</h3>
                    <p className="mt-1 text-sm text-gray-400 line-clamp-2">{curso.descripcion || 'Sin descripcion'}</p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>{curso.totalEstudiantes} estudiantes</span>
                      <span>{curso.totalPreguntas} preguntas</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{formatDateTime(curso.fechaCreacion)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => { audioManager.play('click'); router.push(`/panel/cursos/${curso.id}/preguntas`); }}
                    >
                      Administrar preguntas
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
          <span>{total} curso{total === 1 ? '' : 's'} en total</span>
          <span>Mostrando {cursos.length} en esta pagina</span>
        </div>
        <div className="flex justify-center">
          <Pagination page={pagina} totalPages={totalPaginas} disabled={busy} onPage={handlePage} />
        </div>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) audioManager.play('modalClose'); setFormOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCurso ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
            <DialogDescription>
              {editingCurso ? 'Modifica los datos del curso.' : 'Completa los datos para crear un nuevo curso.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                placeholder="Nombre del curso"
                value={form.nombre}
                onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setNombreError(''); }}
              />
              {nombreError && <p className="text-sm text-red-500">{nombreError}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Descripcion del curso (opcional)"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            {editingCurso && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v: 'activo' | 'inactivo' | 'borrador') => { audioManager.play('select'); setForm({ ...form, estado: v }); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { audioManager.play('back'); setFormOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingCurso ? 'Guardar cambios' : 'Crear curso'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar curso"
        description={`¿Estas seguro de que deseas eliminar "${deleteTarget?.nombre}" y todas sus preguntas? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        open={showEliminarMuchosDialog}
        onOpenChange={setShowEliminarMuchosDialog}
        title="Eliminar cursos seleccionados"
        description={`¿Estas seguro de que deseas eliminar ${seleccion.length} curso${seleccion.length === 1 ? '' : 's'} y todas sus preguntas? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmarEliminarMuchos}
      />

      {/* Paste Dialog */}
      <Dialog open={pasteOpen} onOpenChange={(v) => { if (!v) audioManager.play('modalClose'); setPasteOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pegar curso</DialogTitle>
            <DialogDescription>
              Se copiara "{cursoCopiado?.curso.nombre}" con {cursoCopiado?.preguntas.length} preguntas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre del curso</Label>
            <Input
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
              placeholder="Nombre del curso"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { audioManager.play('back'); setPasteOpen(false); }}>Cancelar</Button>
            <Button onClick={handlePegar}>Pegar curso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Modal */}
      <AIGenerateModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        gameModeName={juego?.nombre ?? 'Rumbo'}
        onQuestionsGenerated={handleAiQuestionsGenerated}
        cursosExistentes={cursos}
      />
    </div>
  );
}

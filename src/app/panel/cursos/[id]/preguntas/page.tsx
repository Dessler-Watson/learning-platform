'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import { Card, CardContent } from '../../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../ui/dialog';
import { ConfirmDialog } from '../../../ui/confirm-dialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { SearchBar } from '../../../components/shared/SearchBar';
import { EmptyState } from '../../../components/shared/EmptyState';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { BackButton } from '../../../components/shared/BackButton';
import { usePanelStore } from '../../../store/usePanelStore';
import { useToast } from '../../../ui/toast';
import { audioManager } from '../../../lib/audio';
import { useClickLock } from '../../../hooks/useClickLock';
import { preguntasService, cursosService } from '../../../services';
import { Pregunta, Curso } from '../../../types';

const c = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const it = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } };

interface PreguntaForm {
  enunciado: string;
  opcionA: string;
  opcionB: string;
  respuestaCorrecta: 'A' | 'B';
}

const DEFAULT_FORM: PreguntaForm = { enunciado: '', opcionA: '', opcionB: '', respuestaCorrecta: 'A' };

export default function PreguntasPage() {
  const router = useRouter();
  const params = useParams();
  const cursoId = params.id as string;
  const teacherId = usePanelStore((s) => s.docente?.id);
  const { toast } = useToast();
  const clickLock = useClickLock();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [search, setSearch] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState<Pregunta | null>(null);
  const [form, setForm] = useState<PreguntaForm>(DEFAULT_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Pregunta | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!teacherId || !cursoId) return;
    Promise.all([
      preguntasService.obtenerPorCurso(teacherId, cursoId),
      cursosService.obtenerPorId(cursoId),
    ]).then(([p, c]) => {
      setPreguntas(p);
      setCurso(c ?? null);
      setLoading(false);
    });
  }, [teacherId, cursoId]);

  const filtered = preguntas
    .filter((p) => p.enunciado.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortNewest ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id));

  const openCreate = () => {
    setEditingPregunta(null);
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEdit = (pregunta: Pregunta) => {
    setEditingPregunta(pregunta);
    setForm({
      enunciado: pregunta.enunciado,
      opcionA: pregunta.opciones[0],
      opcionB: pregunta.opciones[1],
      respuestaCorrecta: pregunta.respuestaCorrecta === pregunta.opciones[0] ? 'A' : 'B',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!teacherId || !clickLock()) return;
    if (!form.enunciado.trim() || !form.opcionA.trim() || !form.opcionB.trim()) {
      toast('Completa todos los campos.', 'error');
      return;
    }
    const correctAnswer = form.respuestaCorrecta === 'A' ? form.opcionA : form.opcionB;
    audioManager.play('submit');
    if (editingPregunta) {
      await preguntasService.actualizar(editingPregunta.id, {
        enunciado: form.enunciado,
        opciones: [form.opcionA, form.opcionB],
        respuestaCorrecta: correctAnswer,
      });
      toast('Pregunta actualizada.');
    } else {
      await preguntasService.crear(teacherId, {
        juegoId: curso?.gameModeId ?? '',
        cursoId,
        enunciado: form.enunciado,
        opciones: [form.opcionA, form.opcionB],
        respuestaCorrecta: correctAnswer,
        estado: 'activa',
      });
      toast('Pregunta creada.');
    }
    audioManager.play('success');
    setFormOpen(false);
    const updated = await preguntasService.obtenerPorCurso(teacherId, cursoId);
    setPreguntas(updated);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !clickLock()) return;
    audioManager.play('delete');
    await preguntasService.eliminar(deleteTarget.id);
    toast('Pregunta eliminada.');
    setDeleteOpen(false);
    setDeleteTarget(null);
    const updated = await preguntasService.obtenerPorCurso(teacherId!, cursoId);
    setPreguntas(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <motion.div variants={c} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={it}>
          <PageHeader title={curso?.nombre ?? 'Curso'} description={`${preguntas.length} preguntas`}>
            <div className="flex items-center gap-2">
              <Button onClick={() => { if (clickLock()) { audioManager.play('click'); openCreate(); } }}>
                <Plus className="mr-1 h-4 w-4" /> Nueva pregunta
              </Button>
              <BackButton onClick={() => router.push(`/panel/juegos/${curso?.gameModeId}/cursos`)} />
            </div>
          </PageHeader>
        </motion.div>

        <motion.div variants={it} className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar preguntas..." />
          </div>
          <button
            onClick={() => { audioManager.play('toggle'); setSortNewest(!sortNewest); }}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all"
          >
            {sortNewest ? 'Mas recientes' : 'Mas antiguas'}
          </button>
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div variants={it}>
            <EmptyState
              iconComponent={Plus}
              title="No hay preguntas"
              description={search ? 'No se encontraron preguntas.' : 'Agrega preguntas a este curso.'}
              action={!search ? <Button variant="outline" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Crear pregunta</Button> : undefined}
            />
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((pregunta, i) => (
                <motion.div
                  key={pregunta.id}
                  variants={it}
                  layout
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.005 }}
                  className="group rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm hover:shadow-glow-cyan transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <StatusBadge
                        label={pregunta.estado}
                        className={pregunta.estado === 'activa' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}
                      />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(pregunta)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setDeleteTarget(pregunta); setDeleteOpen(true); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-3">{pregunta.enunciado}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-xl px-3 py-2 text-xs font-medium ${pregunta.respuestaCorrecta === pregunta.opciones[0] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-500'}`}>
                      <span className="font-bold mr-1">A)</span> {pregunta.opciones[0]}
                    </div>
                    <div className={`rounded-xl px-3 py-2 text-xs font-medium ${pregunta.respuestaCorrecta === pregunta.opciones[1] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-500'}`}>
                      <span className="font-bold mr-1">B)</span> {pregunta.opciones[1]}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPregunta ? 'Editar pregunta' : 'Nueva pregunta'}</DialogTitle>
            <DialogDescription>
              {editingPregunta ? 'Modifica la pregunta.' : 'Crea una nueva pregunta para este curso.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pregunta</Label>
              <Textarea
                placeholder="Escribe la pregunta..."
                value={form.enunciado}
                onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Opcion A</Label>
              <Input
                placeholder="Opcion A"
                value={form.opcionA}
                onChange={(e) => setForm({ ...form, opcionA: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Opcion B</Label>
              <Input
                placeholder="Opcion B"
                value={form.opcionB}
                onChange={(e) => setForm({ ...form, opcionB: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Respuesta correcta</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, respuestaCorrecta: 'A' })}
                  className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                    form.respuestaCorrecta === 'A' ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  A) {form.opcionA || '...'}
                </button>
                <button
                  onClick={() => setForm({ ...form, respuestaCorrecta: 'B' })}
                  className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                    form.respuestaCorrecta === 'B' ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  B) {form.opcionB || '...'}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingPregunta ? 'Guardar cambios' : 'Crear pregunta'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar pregunta"
        description="Estas seguro de que deseas eliminar esta pregunta? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}

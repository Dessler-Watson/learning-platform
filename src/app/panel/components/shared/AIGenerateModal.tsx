'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Pencil, Trash2, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { useClickLock } from '../../hooks/useClickLock';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { cn } from '../../utils';
import { audioManager } from '../../lib/audio';
import { generateQuestions, GeneratedQuestion } from '../../lib/aiGenerator';

const LOADING_MESSAGES = [
  'Analizando el tema...',
  'Creando preguntas...',
  'Verificando respuestas...',
  'Preparando el curso...',
];

interface AIGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameModeName: string;
  onQuestionsGenerated: (questions: GeneratedQuestion[], courseName: string) => void;
  cursosExistentes?: { nombre: string }[];
}

export function AIGenerateModal({ open, onOpenChange, gameModeName, onQuestionsGenerated, cursosExistentes = [] }: AIGenerateModalProps) {
  const clickLock = useClickLock();
  const [step, setStep] = useState<'config' | 'loading' | 'review'>('config');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(10);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ question: '', optionA: '', optionB: '', correctAnswer: 'A' as 'A' | 'B' });
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 'loading') {
      setMessageIndex(0);
      intervalRef.current = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [step]);

  const reset = () => {
    setStep('config');
    setTopic('');
    setDescription('');
    setAmount(10);
    setQuestions([]);
    setError(null);
    setEditingIndex(null);
    setRegeneratingIndex(null);
    setConfirmDeleteIndex(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      audioManager.play('modalClose');
      reset();
    }
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      audioManager.play('error');
      setError('Introduce un nombre para el curso.');
      return;
    }
    const nombreExiste = cursosExistentes.some(
      (c) => c.nombre.trim().toLowerCase() === topic.trim().toLowerCase()
    );
    if (nombreExiste) {
      audioManager.play('error');
      setError('Ya existe un curso con ese nombre. Prueba con otro.');
      return;
    }
    if (amount < 1 || amount > 50) {
      audioManager.play('error');
      setError('La cantidad debe estar entre 1 y 50.');
      return;
    }

    audioManager.play('start');
    setError(null);
    setStep('loading');

    try {
      const result = await generateQuestions(topic, description, amount);
      setQuestions(result);
      setStep('review');
      audioManager.play('success');
    } catch (err) {
      audioManager.play('error');
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible generar las preguntas. Verifica la conexion e intentalo nuevamente.'
      );
      setStep('config');
    }
  };

  const startEdit = (index: number) => {
    audioManager.play('click');
    const q = questions[index];
    setEditForm({ question: q.question, optionA: q.optionA, optionB: q.optionB, correctAnswer: q.correctAnswer });
    setEditingIndex(index);
  };

  const saveEdit = () => {
    if (!editForm.question.trim() || !editForm.optionA.trim() || !editForm.optionB.trim()) {
      audioManager.play('error');
      return;
    }
    audioManager.play('confirm');
    setQuestions((prev) => prev.map((q, i) =>
      i === editingIndex
        ? { question: editForm.question.trim(), optionA: editForm.optionA.trim(), optionB: editForm.optionB.trim(), correctAnswer: editForm.correctAnswer }
        : q
    ));
    setEditingIndex(null);
  };

  const deleteQuestion = (index: number) => {
    audioManager.play('delete');
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setConfirmDeleteIndex(null);
  };

  const regenerateQuestion = async (index: number) => {
    audioManager.play('click');
    setRegeneratingIndex(index);
    try {
      const existing = questions.filter((_, i) => i !== index).map((q) => q.question);
      const result = await generateQuestions(topic, description, 1, existing);
      if (result.length > 0) {
        setQuestions((prev) => prev.map((q, i) => i === index ? result[0] : q));
        audioManager.play('confirm');
      }
    } catch {
      audioManager.play('error');
    }
    setRegeneratingIndex(null);
  };

  const handleAddToCourse = () => {
    if (questions.length === 0) return;
    audioManager.play('confirm');
    onQuestionsGenerated(questions, topic.trim());
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </span>
            Generar curso con IA
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 pr-1">
          <AnimatePresence mode="wait">
            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 py-2"
              >
                <p className="text-sm text-gray-500">
                  Configura las preguntas que la IA generara para tu curso.
                </p>

                <div className="space-y-2">
                  <Label>Nombre del curso</Label>
                  <Input
                    value={topic}
                    onChange={(e) => { setTopic(e.target.value); setError(null); }}
                    placeholder="Ej: Introduccion a los Derechos Humanos"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tema / instrucciones del curso</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe que quieres ensenar. Ej: Conceptos basicos sobre los derechos humanos, sus caracteristicas e importancia."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cantidad de preguntas</Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[5, 10, 15, 20, 25].map((n) => (
                      <button
                        key={n}
                        onClick={() => { audioManager.play('select'); setAmount(n); }}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200',
                          amount === n
                            ? 'border-[#00A0B5] bg-[#00A0B5]/10 text-[#00A0B5] shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-[#00A0B5]/40'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      className="w-20 text-center"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  <span className="font-medium text-foreground">Modo de juego:</span> {gameModeName}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-600"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-6"
              >
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-[#00A0B5]/20 border-t-[#00A0B5]" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-amber-500 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-foreground">{LOADING_MESSAGES[messageIndex]}</p>
                  <p className="text-sm text-gray-500">Generando {amount} preguntas...</p>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 py-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-foreground">{questions.length}</span> preguntas generadas. Revisa y edita antes de agregar.
                  </p>
                </div>

                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <motion.div
                      key={`${i}-${q.question.slice(0, 20)}`}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.02 }}
                      className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm"
                    >
                      {editingIndex === i ? (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Pregunta</Label>
                            <Textarea
                              value={editForm.question}
                              onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                              className="min-h-[60px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Opcion A</Label>
                            <Input
                              value={editForm.optionA}
                              onChange={(e) => setEditForm({ ...editForm, optionA: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Opcion B</Label>
                            <Input
                              value={editForm.optionB}
                              onChange={(e) => setEditForm({ ...editForm, optionB: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Respuesta correcta</Label>
                            <div className="flex gap-2">
                              {(['A', 'B'] as const).map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => { audioManager.play('select'); setEditForm({ ...editForm, correctAnswer: opt }); }}
                                  className={cn(
                                    'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                                    editForm.correctAnswer === opt
                                       ? 'border-[#00A0B5] bg-[#00A0B5]/10 text-[#00A0B5]'
                                       : 'border-gray-200 text-gray-500 hover:border-[#00A0B5]/40'
                                  )}
                                >
                                  <div className={cn(
                                    'h-3.5 w-3.5 rounded-full border-2 transition-all',
                                     editForm.correctAnswer === opt ? 'border-[#00A0B5] bg-[#00A0B5]' : 'border-gray-300'
                                  )} />
                                  Opcion {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <Button variant="ghost" size="sm" onClick={() => { audioManager.play('modalClose'); setEditingIndex(null); }}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={saveEdit}>
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-400 mb-1">Pregunta {i + 1}</p>
                              <p className="font-medium text-sm text-foreground">{q.question}</p>
                              <div className="mt-2 flex flex-col gap-1">
                                {(['A', 'B'] as const).map((label) => {
                                  const text = label === 'A' ? q.optionA : q.optionB;
                                  const isCorrect = q.correctAnswer === label;
                                  return (
                                    <div
                                      key={label}
                                      className={cn(
                                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs',
                                        isCorrect ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500'
                                      )}
                                    >
                                      {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                                      <span className="font-medium">{label})</span>
                                      <span className="truncate">{text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-0.5">
                              {regeneratingIndex === i ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#00A0B5]">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  Regenerando...
                                </div>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => startEdit(i)} title="Editar">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => regenerateQuestion(i)} title="Regenerar">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-rose-500 hover:text-rose-600"
                                    onClick={() => { audioManager.play('click'); setConfirmDeleteIndex(i); }}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {confirmDeleteIndex === i && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 flex items-center justify-end gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs">
                                  <span className="text-gray-500 flex-1">Eliminar esta pregunta?</span>
                                  <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteIndex(null)}>
                                    Cancelar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-rose-500 border-rose-200 hover:bg-rose-100"
                                    onClick={() => deleteQuestion(i)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 shrink-0">
          {step === 'config' && (
            <>
              <Button variant="outline" onClick={() => { if (!clickLock()) return; handleClose(false); }}>
                Cancelar
              </Button>
              <Button
                className="gap-2"
                onClick={() => { if (!clickLock()) return; handleGenerate(); }}
              >
                <Sparkles className="h-4 w-4" /> Generar preguntas
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" className="gap-1.5" onClick={() => { if (!clickLock()) return; audioManager.play('back'); setStep('config'); }}>
                <ChevronLeft className="h-4 w-4" /> Volver
              </Button>
              <Button
                className="gap-2"
                onClick={() => { if (!clickLock()) return; handleAddToCourse(); }}
                disabled={questions.length === 0}
              >
                <CheckCircle2 className="h-4 w-4" /> Agregar preguntas al curso
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Route, Flame, Sparkles, ArrowLeft, CheckCircle2, AlertTriangle, History, Trash2, Play } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';
import { generateQuestions, GeneratedQuestion } from '@/app/panel/lib/aiGenerator';

type GameMode = 'decisiones' | 'lava' | null;

interface HistoryEntry {
  id: string;
  topic: string;
  amount: number;
  questions: GeneratedQuestion[];
  mode: 'decisiones' | 'lava';
  createdAt: number;
}

const HISTORY_KEY = 'eduplay_practice_history';
const LOADING_MESSAGES = [
  'Analizando el tema...',
  'Creando preguntas...',
  'Verificando respuestas...',
  'Preparando tu practica...',
];

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export function PracticeScreen() {
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [topic, setTopic] = useState('');
  const [amount, setAmount] = useState(10);
  const [step, setStep] = useState<'config' | 'loading' | 'ready'>('config');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const startLoadingAnimation = () => {
    setMessageIndex(0);
    intervalRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
  };

  const stopLoadingAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const addToHistory = (topicText: string, amountNum: number, generated: GeneratedQuestion[], mode: 'decisiones' | 'lava') => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      topic: topicText,
      amount: amountNum,
      questions: generated,
      mode,
      createdAt: Date.now(),
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    saveHistory(updated);
  };

  const deleteHistoryEntry = (id: string) => {
    audioManager.play('delete');
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    audioManager.play('select');
    setTopic(entry.topic);
    setAmount(entry.amount);
    setQuestions(entry.questions);
    setShowHistory(false);
    setSelectedMode(entry.mode || 'decisiones');
    setStep('ready');
  };

  const handleGenerate = async () => {
    if (!selectedMode) {
      audioManager.play('error');
      setError('Selecciona un modo de juego.');
      return;
    }
    if (!topic.trim()) {
      audioManager.play('error');
      setError('Escribe un tema sobre el que quieres practicar.');
      return;
    }
    if (amount < 5 || amount > 30) {
      audioManager.play('error');
      setError('La cantidad debe estar entre 5 y 30.');
      return;
    }

    audioManager.play('start');
    setError(null);
    setStep('loading');
    startLoadingAnimation();

    try {
      const result = await generateQuestions(topic, '', amount);
      if (result.length === 0) {
        throw new Error('Gemini devolvio un formato inesperado. Intenta generar nuevamente.');
      }
      setQuestions(result);
      addToHistory(topic.trim(), amount, result, selectedMode!);
      setStep('ready');
      audioManager.play('success');
    } catch (err) {
      audioManager.play('error');
      setError(
        err instanceof Error
          ? err.message
          : 'No pudimos generar tus preguntas. Intentalo nuevamente en unos momentos.'
      );
      setStep('config');
    } finally {
      stopLoadingAnimation();
    }
  };

  const handleStartPractice = () => {
    if (questions.length === 0 || !selectedMode) return;
    audioManager.play('start');
    const data = { mode: selectedMode, questions, topic: topic.trim() };
    sessionStorage.setItem('eduplay_practice', JSON.stringify(data));
    window.location.href = '/practica/jugar';
  };

  const handleBack = () => {
    audioManager.play('back');
    window.location.href = '/inicio';
  };

  return (
    <main className="relative min-h-screen px-5 pb-10 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFEF5A] text-[#407516] shadow-card"
            style={{ boxShadow: '0 4px 0 rgba(64, 117, 22, 0.2), 0 6px 20px rgba(255, 239, 90, 0.25)' }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-surface-800">Modo práctica</h1>
            <p className="text-xs font-bold text-surface-500">Practica por tu cuenta</p>
          </div>
          {history.length > 0 && step === 'config' && !showHistory && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { audioManager.play('click'); setShowHistory(true); }}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#B2E0EF] px-4 text-[#006A7A] shadow-card"
              style={{ boxShadow: '0 4px 0 rgba(0, 106, 122, 0.2), 0 6px 20px rgba(178, 224, 239, 0.25)' }}
            >
              <History size={18} />
              <span className="text-xs font-black">{history.length}</span>
            </motion.button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {step === 'config' && !showHistory && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Selección de modo */}
              <div>
                <h3 className="mb-3 text-sm font-black text-surface-700">Selecciona el modo de juego</h3>
                <div className="grid grid-cols-2 gap-3">
                  <ModeCard
                    icon={<Route size={24} />}
                    label="Camino de las Decisiones"
                    description="Responde y avanza por el camino. +10 acierto, -5 error."
                    color="#FFA000"
                    bgColor="rgba(255, 160, 0, 0.1)"
                    selected={selectedMode === 'decisiones'}
                    onClick={() => { audioManager.play('select'); setSelectedMode('decisiones'); setError(null); }}
                  />
                  <ModeCard
                    icon={<Flame size={24} />}
                    label="La Lava del Conocimiento"
                    description="Responde para subir tu torre. La lava avanza si fallas."
                    color="#EB5D70"
                    bgColor="rgba(235, 93, 112, 0.1)"
                    selected={selectedMode === 'lava'}
                    onClick={() => { audioManager.play('select'); setSelectedMode('lava'); setError(null); }}
                  />
                </div>
              </div>

              {/* Tema */}
              <div className="card-game p-5">
                <h3 className="mb-3 text-sm font-black text-surface-700">Genera tus preguntas</h3>
                <label className="mb-1 block text-xs font-bold text-surface-500">Tema</label>
                <input
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setError(null); }}
                  placeholder="¿Sobre qué quieres practicar?"
                  className="input-game w-full rounded-xl px-4 py-3 text-sm font-bold"
                />
              </div>

              {/* Cantidad */}
              <div className="card-game p-5">
                <label className="mb-3 block text-xs font-bold text-surface-500">Cantidad de preguntas</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { audioManager.play('select'); setAmount(n); }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black transition-all duration-200"
                      style={{
                        borderColor: amount === n ? '#00A0B5' : 'rgba(0,0,0,0.08)',
                        background: amount === n ? 'rgba(0, 160, 181, 0.1)' : '#fff',
                        color: amount === n ? '#00A0B5' : '#8A7A6A',
                      }}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-2xl border-2 border-[#EB5D70]/20 bg-[#EB5D70]/5 p-4 text-sm font-bold text-[#EB5D70]"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Botón generar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={handleGenerate}
                className="w-full rounded-2xl px-6 py-4 text-base font-black text-white shadow-game"
                style={{
                  background: 'linear-gradient(90deg, #00A0B5 0%, #008A9D 100%)',
                  boxShadow: '0 6px 0 rgba(0, 100, 120, 0.35), 0 8px 24px rgba(0, 160, 181, 0.3)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  Generar preguntas
                </span>
              </motion.button>
            </motion.div>
          )}

          {step === 'config' && showHistory && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-surface-700">Mis preguntas guardadas</h3>
                <button
                  onClick={() => { audioManager.play('click'); setShowHistory(false); }}
                  className="text-xs font-bold text-[#00A0B5]"
                >
                  Volver a generar
                </button>
              </div>

              {history.length === 0 ? (
                <div className="card-game p-8 text-center">
                  <History size={32} className="mx-auto mb-3 text-surface-300" />
                  <p className="text-sm font-bold text-surface-500">Aun no tienes preguntas guardadas.</p>
                  <p className="text-xs text-surface-400">Genera preguntas y se guardaran automaticamente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-game p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#00A0B5]/15 text-[#00A0B5]">
                              <Sparkles size={12} />
                            </span>
                            <span className="text-xs font-black text-surface-800 truncate">{entry.topic}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-surface-400">
                            <span>{entry.questions.length} preguntas</span>
                            <span>{formatDate(entry.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => loadFromHistory(entry)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#98C54E]/15 text-[#98C54E]"
                            title="Usar estas preguntas"
                          >
                            <Play size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteHistoryEntry(entry.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EB5D70]/10 text-[#EB5D70]"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-game flex flex-col items-center justify-center py-16 gap-6"
            >
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-[#00A0B5]/20 border-t-[#00A0B5]" />
                <Sparkles size={24} className="absolute inset-0 m-auto text-[#FFA000] animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black text-surface-800">{LOADING_MESSAGES[messageIndex]}</p>
                <p className="text-sm font-bold text-surface-500">Generando {amount} preguntas...</p>
              </div>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Preguntas listas */}
              <div className="card-game p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#98C54E]/15"
                >
                  <CheckCircle2 size={32} className="text-[#98C54E]" />
                </motion.div>
                <h3 className="mb-1 text-xl font-black text-surface-800">¡Preguntas listas!</h3>
                <p className="text-sm font-bold text-surface-500">
                  {questions.length} preguntas generadas sobre &quot;{topic.trim()}&quot;
                </p>
              </div>

              {/* Modo seleccionado */}
              <div className="card-game p-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: selectedMode === 'decisiones' ? 'rgba(255, 160, 0, 0.15)' : 'rgba(235, 93, 112, 0.15)',
                    color: selectedMode === 'decisiones' ? '#FFA000' : '#EB5D70',
                  }}
                >
                  {selectedMode === 'decisiones' ? <Route size={20} /> : <Flame size={20} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-500">Jugarás en</p>
                  <p className="text-sm font-black text-surface-800">
                    {selectedMode === 'decisiones' ? 'Camino de las Decisiones' : 'La Lava del Conocimiento'}
                  </p>
                </div>
                <button
                  onClick={() => { audioManager.play('click'); setStep('config'); setQuestions([]); }}
                  className="ml-auto text-xs font-bold text-[#00A0B5]"
                >
                  Cambiar
                </button>
              </div>

              {/* Botón iniciar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={handleStartPractice}
                className="w-full rounded-2xl px-6 py-4 text-base font-black text-white shadow-game"
                style={{
                  background: 'linear-gradient(90deg, #98C54E 0%, #6B9832 100%)',
                  boxShadow: '0 6px 0 rgba(80, 130, 40, 0.35), 0 8px 24px rgba(152, 197, 78, 0.3)',
                }}
              >
                Iniciar práctica
              </motion.button>

              {/* Volver a configurar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { audioManager.play('back'); setStep('config'); setQuestions([]); }}
                className="w-full rounded-2xl border-2 border-surface-200 bg-white px-6 py-3 text-sm font-black text-surface-600 shadow-card"
              >
                Volver a configurar
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

function ModeCard({
  icon,
  label,
  description,
  color,
  bgColor,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="card-game p-4 text-left transition-all duration-200"
      style={{
        border: selected ? `2px solid ${color}` : '2px solid transparent',
        background: selected ? bgColor : '#fff',
        boxShadow: selected ? `0 4px 0 ${color}30, 0 6px 20px ${color}20` : undefined,
      }}
    >
      <div
        className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: bgColor, color }}
      >
        {icon}
      </div>
      <p className="mb-1 text-xs font-black text-surface-800 leading-tight">{label}</p>
      <p className="text-[10px] font-bold text-surface-500 leading-tight">{description}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-2 flex items-center gap-1 text-[10px] font-black"
          style={{ color }}
        >
          <CheckCircle2 size={12} />
          Seleccionado
        </motion.div>
      )}
    </motion.button>
  );
}

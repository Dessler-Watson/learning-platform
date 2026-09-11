'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, Flame, ArrowLeft, RotateCcw, ChevronDown, ChevronUp, Skull } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';

interface AnsweredQuestion {
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
  playerChoice: 'A' | 'B' | null;
  isCorrect: boolean;
  deathQuestion?: boolean;
}

interface PracticeResult {
  mode: 'decisiones' | 'lava';
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  eliminatedByLava: boolean;
  answeredQuestions: AnsweredQuestion[];
}

export function PracticeResultsScreen() {
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    audioManager.play('success');
    const raw = sessionStorage.getItem('eduplay_practice');
    const resultsRaw = sessionStorage.getItem('eduplay_practice_results');

    if (!raw) {
      window.location.href = '/practica';
      return;
    }

    try {
      const practiceData = JSON.parse(raw);
      const mode = practiceData.mode as 'decisiones' | 'lava';
      const answeredQuestions: AnsweredQuestion[] = resultsRaw ? JSON.parse(resultsRaw) : [];

      const correctAnswers = answeredQuestions.filter((q) => q.isCorrect).length;
      const incorrectAnswers = answeredQuestions.filter((q) => !q.isCorrect && q.playerChoice !== null).length;

      let eliminatedByLava = false;
      if (mode === 'lava') {
        try {
          const { useLavaStore } = require('@/stores/lava.store');
          const lavaState = useLavaStore.getState();
          const localPlayer = lavaState.players.find((p: { id: number }) => p.id === 0);
          eliminatedByLava = localPlayer?.eliminated ?? false;
        } catch {
          eliminatedByLava = false;
        }
      }

      setResult({
        mode,
        topic: practiceData.topic || 'Tu practica',
        totalQuestions: practiceData.questions?.length || 0,
        correctAnswers,
        incorrectAnswers,
        eliminatedByLava,
        answeredQuestions,
      });
    } catch {
      window.location.href = '/practica';
    }
  }, []);

  const handlePlayAgain = () => {
    audioManager.play('click');
    sessionStorage.removeItem('eduplay_practice');
    sessionStorage.removeItem('eduplay_practice_results');
    window.location.href = '/practica';
  };

  const handleGoHome = () => {
    audioManager.play('back');
    sessionStorage.removeItem('eduplay_practice');
    sessionStorage.removeItem('eduplay_practice_results');
    window.location.href = '/inicio';
  };

  if (!result) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4">
        <Background />
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-[#00A0B5]/20 border-t-[#00A0B5]" />
          <p className="text-lg font-black text-surface-800">Cargando resultados...</p>
        </div>
      </main>
    );
  }

  const accuracy = result.totalQuestions > 0
    ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
    : 0;

  return (
    <main className="relative min-h-screen px-5 pb-10 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        {/* Result card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          className="card-game overflow-hidden"
        >
          {/* Header */}
          <div
            className="px-6 py-8 text-center"
            style={{
              background: result.eliminatedByLava
                ? 'linear-gradient(180deg, rgba(235, 93, 112, 0.15) 0%, rgba(255,255,255,0) 100%)'
                : 'linear-gradient(180deg, rgba(152, 197, 78, 0.15) 0%, rgba(255,255,255,0) 100%)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: result.eliminatedByLava
                  ? 'rgba(235, 93, 112, 0.15)'
                  : 'rgba(152, 197, 78, 0.15)',
              }}
            >
              {result.eliminatedByLava ? (
                <Flame size={40} className="text-[#EB5D70]" />
              ) : (
                <Trophy size={40} className="text-[#98C54E]" />
              )}
            </motion.div>

            <h2 className="mb-2 text-2xl font-black text-surface-800">
              {result.eliminatedByLava ? 'La lava te alcanzó' : '¡Práctica completada!'}
            </h2>
            <p className="text-sm font-bold text-surface-500">
              {result.topic}
            </p>
          </div>

          {/* Stats */}
          <div className="px-6 pb-6">
            <div className="mb-4 text-center">
              <span className="text-4xl font-black text-surface-800">{result.totalQuestions}</span>
              <span className="ml-2 text-sm font-bold text-surface-500">preguntas</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-[#98C54E]/10 p-4 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-1 text-[#98C54E]" />
                <p className="text-2xl font-black text-surface-800">{result.correctAnswers}</p>
                <p className="text-xs font-bold text-surface-500">correctas</p>
              </div>
              <div className="rounded-2xl bg-[#EB5D70]/10 p-4 text-center">
                <XCircle size={24} className="mx-auto mb-1 text-[#EB5D70]" />
                <p className="text-2xl font-black text-surface-800">{result.incorrectAnswers}</p>
                <p className="text-xs font-bold text-surface-500">incorrectas</p>
              </div>
            </div>

            {/* Accuracy bar */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500">Precisión</span>
                <span className="text-xs font-black text-surface-700">{accuracy}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full rounded-full"
                  style={{
                    background: accuracy >= 70
                      ? 'linear-gradient(90deg, #98C54E, #6B9832)'
                      : accuracy >= 40
                        ? 'linear-gradient(90deg, #FFA000, #FF8F00)'
                        : 'linear-gradient(90deg, #EB5D70, #C94A5A)',
                  }}
                />
              </div>
            </div>

            {/* Toggle questions list */}
            {result.answeredQuestions.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => { audioManager.play('click'); setShowQuestions(!showQuestions); }}
                className="mb-4 flex w-full items-center justify-between rounded-2xl border-2 border-surface-200 bg-white px-4 py-3 text-sm font-black text-surface-700 shadow-card"
              >
                <span>Ver preguntas</span>
                {showQuestions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </motion.button>
            )}

            {/* Questions list */}
            <AnimatePresence>
              {showQuestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden space-y-2"
                >
                  {result.answeredQuestions.map((q, i) => {
                    const isDeath = q.deathQuestion === true;
                    return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-2xl border-2 p-3"
                      style={{
                        background: isDeath
                          ? 'rgba(233, 73, 48, 0.12)'
                          : q.playerChoice === null
                            ? 'rgba(138, 122, 106, 0.05)'
                            : q.isCorrect
                              ? 'rgba(152, 197, 78, 0.08)'
                              : 'rgba(235, 93, 112, 0.08)',
                        borderColor: isDeath
                          ? 'rgba(233, 73, 48, 0.6)'
                          : q.playerChoice === null
                            ? 'rgba(138, 122, 106, 0.15)'
                            : q.isCorrect
                              ? 'rgba(152, 197, 78, 0.25)'
                              : 'rgba(235, 93, 112, 0.25)',
                        boxShadow: isDeath ? '0 0 16px rgba(233, 73, 48, 0.3)' : undefined,
                      }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {isDeath ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E94930]">
                            <Skull size={12} className="text-white" />
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                            style={{
                              background: q.playerChoice === null
                                ? '#8A7A6A'
                                : q.isCorrect ? '#98C54E' : '#EB5D70',
                            }}
                          >
                            {i + 1}
                          </span>
                        )}
                        <p className={`text-xs font-bold leading-tight ${isDeath ? 'text-[#E94930]' : 'text-surface-800'}`}>{q.question}</p>
                      </div>
                      <div className="ml-7 space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`font-black ${q.correctAnswer === 'A' ? 'text-[#98C54E]' : 'text-surface-400'}`}>A)</span>
                          <span className={q.correctAnswer === 'A' ? 'font-bold text-surface-700' : 'text-surface-500'}>{q.optionA}</span>
                          {q.correctAnswer === 'A' && <CheckCircle2 size={12} className="text-[#98C54E]" />}
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`font-black ${q.correctAnswer === 'B' ? 'text-[#98C54E]' : 'text-surface-400'}`}>B)</span>
                          <span className={q.correctAnswer === 'B' ? 'font-bold text-surface-700' : 'text-surface-500'}>{q.optionB}</span>
                          {q.correctAnswer === 'B' && <CheckCircle2 size={12} className="text-[#98C54E]" />}
                        </div>
                        {q.playerChoice && (
                          <div className="pt-1 text-[10px] font-bold" style={{ color: q.isCorrect ? '#98C54E' : '#EB5D70' }}>
                            Tu respuesta: {q.playerChoice} {q.isCorrect ? '✓' : '✕'}
                          </div>
                        )}
                        {q.playerChoice === null && (
                          <div className="pt-1 text-[10px] font-bold text-surface-400">
                            No respondida
                          </div>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={handlePlayAgain}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black text-white shadow-game"
                style={{
                  background: 'linear-gradient(90deg, #00A0B5 0%, #008A9D 100%)',
                  boxShadow: '0 6px 0 rgba(0, 100, 120, 0.35), 0 8px 24px rgba(0, 160, 181, 0.3)',
                }}
              >
                <RotateCcw size={18} />
                Practicar de nuevo
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoHome}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-surface-200 bg-white px-6 py-3 text-sm font-black text-surface-600 shadow-card"
              >
                <ArrowLeft size={16} />
                Volver al inicio
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}

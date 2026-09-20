'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { audioManager } from '@/shared/lib/audio';
import type { GameQuestion } from '@/games/decision-road/types';
import { useGameStore } from '@/stores/game.store';
import { useLavaStore } from '@/stores/lava.store';

const GameCanvas = dynamic(() => import('@/engine/renderer/GameCanvas').then((m) => m.GameCanvas), { ssr: false });
const LavaCanvas = dynamic(() => import('@/engine/renderer/LavaCanvas').then((m) => m.LavaCanvas), { ssr: false });

interface PracticeData {
  mode: 'decisiones' | 'lava';
  questions: GameQuestion[];
  topic: string;
  practiceId?: string;
}

interface AnsweredQuestion {
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
  playerChoice: 'A' | 'B' | null;
  isCorrect: boolean;
  deathQuestion?: boolean;
}

function savePracticeResults(mode: string, questions: GameQuestion[]) {
  let answered: AnsweredQuestion[] = [];

  if (mode === 'decisiones') {
    const state = useGameStore.getState();
    answered = questions.map((q) => {
      const ans = state.answers.find((a) => a.questionId === q.id);
      return {
        question: q.statement || (q as GameQuestion & { question?: string }).question || '',
        optionA: q.optionA,
        optionB: q.optionB,
        correctAnswer: q.correctAnswer,
        playerChoice: ans?.choice ?? null,
        isCorrect: ans?.correct ?? false,
      };
    });
  } else {
    const state = useLavaStore.getState();
    const localPlayer = state.players[0];
    const wasEliminated = localPlayer?.eliminated ?? false;
    const deathIdx = wasEliminated ? state.currentQuestionIndex : -1;
    answered = questions.map((q, i) => {
      const historyEntry = state.answerHistory.find((h) => h.questionIndex === i);
      const wasAnswered = !!historyEntry;
      return {
        question: q.statement || (q as GameQuestion & { question?: string }).question || '',
        optionA: q.optionA,
        optionB: q.optionB,
        correctAnswer: q.correctAnswer,
        playerChoice: wasAnswered ? (historyEntry!.choice ?? null) : null,
        isCorrect: wasAnswered && historyEntry!.correct,
        deathQuestion: i === deathIdx,
      };
    });
  }

  sessionStorage.setItem('eduplay_practice_results', JSON.stringify(answered));
}

export function PracticeGameWrapper() {
  const [data, setData] = useState<PracticeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gamePhase = useGameStore((s) => s.phase);
  const lavaPhase = useLavaStore((s) => s.phase);

  useEffect(() => {
    audioManager.playWelcome();
    const raw = sessionStorage.getItem('eduplay_practice');
    if (!raw) {
      setError('No hay datos de practica. Volviendo al inicio...');
      setTimeout(() => { window.location.href = '/practica'; }, 2000);
      return;
    }

    try {
      const parsed: PracticeData = JSON.parse(raw);
      if (!parsed.questions || parsed.questions.length === 0) {
        setError('No se encontraron preguntas. Volviendo al inicio...');
        setTimeout(() => { window.location.href = '/practica'; }, 2000);
        return;
      }

      setData(parsed);

      const mappedQuestions: GameQuestion[] = parsed.questions.map((q: GameQuestion & { question?: string }, i: number) => ({
        id: String(i + 1),
        statement: q.statement || q.question || '',
        optionA: q.optionA,
        optionB: q.optionB,
        correctAnswer: q.correctAnswer,
        explanation: '',
        difficulty: 'basic' as const,
      }));

      if (parsed.mode === 'decisiones') {
        useGameStore.getState().setQuestions(mappedQuestions);
        useGameStore.getState().setPhase('intro');
      } else {
        useLavaStore.getState().setQuestions(mappedQuestions);
      }
    } catch {
      setError('Error al cargar la practica. Volviendo al inicio...');
      setTimeout(() => { window.location.href = '/practica'; }, 2000);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    const isPractice = !!sessionStorage.getItem('eduplay_practice');
    if (!isPractice) return;

    const shouldSave =
      (data.mode === 'decisiones' && (gamePhase === 'results' || gamePhase === 'completed')) ||
      (data.mode === 'lava' && lavaPhase === 'completed');

    if (shouldSave) {
      const mappedQuestions: GameQuestion[] = data.questions.map((q: GameQuestion & { question?: string }, i: number) => ({
        id: String(i + 1),
        statement: q.statement || q.question || '',
        optionA: q.optionA,
        optionB: q.optionB,
        correctAnswer: q.correctAnswer,
        explanation: '',
        difficulty: 'basic' as const,
      }));
      savePracticeResults(data.mode, mappedQuestions);
    }
  }, [gamePhase, lavaPhase, data]);

  if (error) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4">
        <div className="relative z-10 text-center">
          <p className="text-lg font-black text-surface-800">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4">
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-[#00A0B5]/20 border-t-[#00A0B5]" />
          <p className="text-lg font-black text-surface-800">Cargando practica...</p>
        </div>
      </main>
    );
  }

  return data.mode === 'decisiones' ? <GameCanvas /> : <LavaCanvas />;
}

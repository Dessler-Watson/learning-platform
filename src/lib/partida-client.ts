'use client';
import type { GameQuestion } from '@/games/decision-road/types';

export function getMatchRoomId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('sala');
  } catch {
    return null;
  }
}

export interface MatchOptionDTO {
  id: string;
  text: string;
}

export interface MatchQuestionDTO {
  position: number;
  id: string;
  prompt: string;
  explanation: string;
  difficulty: string;
  options: MatchOptionDTO[];
}

export interface MatchStateDTO {
  partida: { id: string; room_id: string; status: string; question_count: number; modo: string };
  yo: {
    score: number;
    xp: number;
    estado: string;
    respondidas: { question_id: string; position: number; is_correct: boolean | null; timed_out: boolean; points_delta: number }[];
  };
  preguntas: MatchQuestionDTO[];
}

function mapDifficulty(d: string): 'basic' | 'intermediate' | 'advanced' {
  if (d === 'dificil') return 'advanced';
  if (d === 'media') return 'intermediate';
  return 'basic';
}

export function toStoreQuestion(q: MatchQuestionDTO): GameQuestion {
  return {
    id: q.id,
    statement: q.prompt,
    optionA: q.options[0]?.text ?? '',
    optionB: q.options[1]?.text ?? '',
    correctAnswer: 'A',
    explanation: q.explanation ?? '',
    difficulty: mapDifficulty(q.difficulty),
    optionIds: [q.options[0]?.id ?? '', q.options[1]?.id ?? ''],
  };
}

export async function fetchMatchState(roomId: string): Promise<MatchStateDTO> {
  const res = await fetch(`/api/partida?room_id=${encodeURIComponent(roomId)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'No se pudo cargar la partida');
  return data as MatchStateDTO;
}

export interface MatchAnswerResult {
  correct: boolean;
  correct_option_id: string | null;
  points_delta: number;
  score: number;
  xp: number;
  question_position: number;
  eliminated: boolean;
  timed_out: boolean;
  status: string;
  state: { ticks?: number; platforms?: number } | null;
}

function normalize(data: Record<string, unknown>): MatchAnswerResult {
  const st = (data.state ?? null) as { ticks?: number; platforms?: number } | null;
  return {
    correct: data.correct === true,
    correct_option_id: typeof data.correct_option_id === 'string' ? data.correct_option_id : null,
    points_delta: Number(data.points_delta ?? 0),
    score: Number(data.score ?? 0),
    xp: Number(data.xp ?? 0),
    question_position: Number(data.question_position ?? -1),
    eliminated: data.eliminated === true,
    timed_out: data.timed_out === true,
    status: String(data.status ?? ''),
    state: st,
  };
}

export async function submitMatchAnswer(opts: {
  roomId: string;
  questionId: string;
  optionId?: string;
  timedOut?: boolean;
  responseTimeMs?: number;
}): Promise<MatchAnswerResult | null> {
  const payload = {
    action: 'answer',
    room_id: opts.roomId,
    question_id: opts.questionId,
    option_id: opts.optionId ?? null,
    timed_out: opts.timedOut === true,
    response_time_ms: opts.responseTimeMs ?? 0,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return normalize(data);
      if (res.status === 409 && data?.code === 'duplicate') {
        // Resync: el servidor ya registró la respuesta; devuelve el estado real.
        return normalize(data);
      }
      // Errores de estado (finalizada/eliminado/no participante): no reintentar.
      if (res.status === 409 || res.status === 403 || res.status === 404) return null;
      if (attempt === 0) continue;
      return null;
    } catch {
      if (attempt === 0) continue;
      return null;
    }
  }
  return null;
}

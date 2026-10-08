import { randomInt, randomUUID } from 'crypto';
import { getPool, queryOne } from '../db/client';
import { callModel, GEMINI_MODEL } from '../ai/gemini';
import { dignidadMujerQuestions } from '@/education/question-bank/dignidad-mujer';

/**
 * Generación de preguntas del Modo Caos (ETAPA 1).
 *
 * Un solo flujo server-side por sala:
 *   1. Reclama la sala atómicamente (pending → running: un único worker).
 *   2. Intenta Gemini (2 intentos) con un prompt que pide tema ALEATORIO y
 *      N preguntas (N según la dificultad de la sala).
 *   3. Si la IA falla o devuelve < 8 preguntas válidas, cae al banco local
 *      `dignidadMujerQuestions` (siempre disponible; tema fijo).
 *   4. Inserta preguntas + 2 opciones (1 correcta) en el curso sintético de la
 *      sala con sort_order barajado (mismo orden para todos los jugadores) y
 *      pasa chaos_rooms a 'ready' (o 'failed').
 *
 * La respuesta correcta solo vive en question_options.is_correct; esta capa
 * NUNCA devuelve opciones/correct al cliente (los endpoints /api/caos exponen
 * únicamente metadatos: dificultad, tema, cantidad y juego).
 */

export interface GeneratedCaosQuestion {
  prompt: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
  explanation: string | null;
}

const MIN_QUESTIONS = 8;
const MAX_QUESTIONS = 30;
const AI_ATTEMPTS = 2;
const AI_RETRY_DELAY_MS = 2000;
/**
 * Un worker 'running' sin actualizar durante este lapso se considera muerto
 * (crash del proceso) y puede ser reclamado. El heartbeat entre intentos de la
 * IA mantiene la sesión viva (cada intento ≤45s de timeout).
 */
const STALE_MS = 120_000;

function questionsTarget(difficulty: string): number {
  switch (difficulty) {
    case 'facil':
      return randomInt(8, 15); // 8..14
    case 'medio':
      return randomInt(15, 23); // 15..22
    case 'dificil':
    case 'experto':
      return randomInt(23, 31); // 23..30
    case 'caos':
      return randomInt(15, 31); // 15..30
    default:
      return 16;
  }
}

/** Dificultad pedida (selector Caos) → CHECK corto de questions. */
export function mapQuestionDifficulty(difficulty: string): 'facil' | 'media' | 'dificil' {
  const v = String(difficulty ?? '').trim().toLowerCase();
  if (v === 'facil') return 'facil';
  if (v === 'medio' || v === 'media') return 'media';
  return 'dificil'; // dificil / experto / caos
}

function buildChaosPrompt(difficulty: string, amount: number): string {
  return `Eres un generador de preguntas educativas para el "Modo Caos" de EduPlay.

Paso 1: elige UN solo tema educativo AL AZAR (varia mucho: ciencias, historia, geografia, literatura, salud, medio ambiente, tecnologia, arte, deportes, matematicas, cultura general...).
Dificultad solicitada: ${difficulty}
Paso 2: genera exactamente ${amount} preguntas SOBRE ESE TEMA.

REGLAS ESTRICTAS:
- Genera EXACTAMENTE ${amount} preguntas sobre el tema elegido.
- Cada pregunta debe tener exactamente DOS opciones: A y B.
- Las opciones A y B deben ser DIFERENTES entre si. NUNCA pongas la misma respuesta en ambas opciones.
- Solo una opcion puede ser correcta.
- Indica claramente cual es la respuesta correcta (solo "A" o "B").
- Evita preguntas ambiguas o confusas. Evita repetir preguntas.
- Manten un nivel educativo apropiado a la dificultad solicitada.
- No inventes informacion ajena al tema.
- Responde UNICAMENTE con el JSON solicitado, sin texto adicional.

Formato de respuesta JSON:
{
  "tema": "Nombre corto del tema elegido",
  "questions": [
    {
      "question": "Pregunta aqui?",
      "optionA": "Opcion A aqui (diferente a B)",
      "optionB": "Opcion B aqui (diferente a A)",
      "correctAnswer": "A"
    }
  ]
}`;
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

interface ParsedChaos {
  tema: string | null;
  questions: GeneratedCaosQuestion[];
}

function parseChaosResponse(raw: string): ParsedChaos {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const json = JSON.parse(cleaned);
    const list = json.questions;
    if (!Array.isArray(list)) return { tema: null, questions: [] };

    const used = new Set<string>();
    const questions: GeneratedCaosQuestion[] = [];
    for (const q of list as Array<Record<string, unknown>>) {
      if (
        typeof q.question !== 'string' ||
        typeof q.optionA !== 'string' ||
        typeof q.optionB !== 'string' ||
        (q.correctAnswer !== 'A' && q.correctAnswer !== 'B')
      ) continue;
      const a = normalizeText(q.optionA);
      const b = normalizeText(q.optionB);
      if (!a || !b || a === b) continue;
      const prompt = q.question.trim();
      const key = normalizeText(prompt);
      if (used.has(key)) continue;
      used.add(key);

      // Baraja A/B para que la posición de la correcta no sea predecible.
      const swap = randomInt(2) === 1;
      questions.push({
        prompt,
        optionA: (swap ? q.optionB : q.optionA).trim(),
        optionB: (swap ? q.optionA : q.optionB).trim(),
        correctAnswer: swap ? (q.correctAnswer === 'A' ? 'B' : 'A') : q.correctAnswer,
        explanation: null,
      });
      if (questions.length >= MAX_QUESTIONS) break;
    }
    const tema = typeof json.tema === 'string' && json.tema.trim() ? json.tema.trim().slice(0, 160) : null;
    return { tema, questions };
  } catch {
    return { tema: null, questions: [] };
  }
}

async function heartbeat(roomId: string): Promise<void> {
  await queryOne(
    `UPDATE chaos_rooms SET updated_at = now() WHERE room_id = $1 AND generation_status = 'running' RETURNING room_id`,
    [roomId]
  ).catch(() => null);
}

async function generateWithAI(roomId: string, difficulty: string, amount: number): Promise<ParsedChaos> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[caos generate] GEMINI_API_KEY no configurada; se usará el banco local');
    return { tema: null, questions: [] };
  }
  const prompt = buildChaosPrompt(difficulty, amount);
  for (let attempt = 1; attempt <= AI_ATTEMPTS; attempt++) {
    const result = await callModel(apiKey, GEMINI_MODEL, prompt);
    if ('content' in result) {
      const parsed = parseChaosResponse(result.content);
      if (parsed.questions.length >= MIN_QUESTIONS) return parsed;
      console.warn(`[caos generate] IA devolvió ${parsed.questions.length} preguntas válidas (< ${MIN_QUESTIONS})`);
    } else {
      console.warn(`[caos generate] intento ${attempt}/${AI_ATTEMPTS} falló:`, result.type, result.error);
      if (!result.overloaded) break; // auth/modelo: no reintentables
    }
    await heartbeat(roomId);
    if (attempt < AI_ATTEMPTS) await new Promise((r) => setTimeout(r, AI_RETRY_DELAY_MS));
  }
  return { tema: null, questions: [] };
}

function bankQuestions(amount: number): { tema: string; questions: GeneratedCaosQuestion[] } {
  const pool = [...dignidadMujerQuestions];
  // Fisher–Yates con crypto.randomInt.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const taken = pool.slice(0, Math.min(amount, pool.length));
  return {
    tema: 'Dignidad de la mujer',
    questions: taken.map((q) => {
      const swap = randomInt(2) === 1;
      const correctIsA = q.correctAnswer === 'A';
      return {
        prompt: q.statement,
        optionA: swap ? q.optionB : q.optionA,
        optionB: swap ? q.optionA : q.optionB,
        correctAnswer: (swap ? !correctIsA : correctIsA) ? 'A' : 'B',
        explanation: q.explanation || null,
      };
    }),
  };
}

/**
 * Reclama la generación de forma atómica (pending → running; un único worker,
 * y un 'running' viejo se recupera) y ejecuta el flujo completo.
 * Devuelve true si esta llamada reclamó la sala.
 */
export async function ensureChaosGeneration(roomId: string): Promise<boolean> {
  const claimed = await queryOne<{ difficulty: string }>(
    `UPDATE chaos_rooms
        SET generation_status = 'running', updated_at = now()
      WHERE room_id = $1
        AND (
          generation_status = 'pending'
          OR (generation_status = 'running' AND updated_at < now() - make_interval(secs => $2))
        )
      RETURNING difficulty`,
    [roomId, STALE_MS / 1000]
  );
  if (!claimed) return false; // ya generada (ready/failed) o en curso

  const room = await queryOne<{ teacher_id: string }>(
    `SELECT teacher_id FROM rooms WHERE id = $1 AND deleted_at IS NULL`,
    [roomId]
  );
  if (!room) {
    await finalizeGeneration(roomId, null, 'failed');
    return true;
  }

  try {
    const target = questionsTarget(claimed.difficulty);
    const ai = await generateWithAI(roomId, claimed.difficulty, target);
    const source: { tema: string; questions: GeneratedCaosQuestion[] } =
      ai.questions.length >= MIN_QUESTIONS
        ? { tema: ai.tema ?? 'Tema sorteado por IA', questions: ai.questions }
        : bankQuestions(target);
    if (source.questions.length === 0) {
      await finalizeGeneration(roomId, null, 'failed');
      return true;
    }
    await insertQuestions(roomId, room.teacher_id, claimed.difficulty, source);
    return true;
  } catch (err) {
    console.error('[caos generate] error insertando preguntas', err);
    await finalizeGeneration(roomId, null, 'failed').catch(() => undefined);
    return true;
  }
}

/**
 * Reintenta una generación abandonada ('pending' o 'running' sin heartbeat
 * durante STALE_MS, p.ej. crash del proceso). Disparado desde /api/caos.
 */
export async function maybeRetryStaleGeneration(roomId: string): Promise<void> {
  const row = await queryOne<{ stale: boolean }>(
    `SELECT (generation_status = 'pending' OR updated_at < now() - make_interval(secs => $2)) AS stale
       FROM chaos_rooms WHERE room_id = $1`,
    [roomId, STALE_MS / 1000]
  );
  if (!row?.stale) return;
  void ensureChaosGeneration(roomId).catch((err) =>
    console.error('[caos generate] reintento fallido', err)
  );
}

async function insertQuestions(
  roomId: string,
  authorId: string,
  difficulty: string,
  source: { tema: string; questions: GeneratedCaosQuestion[] }
): Promise<void> {
  const course = await queryOne<{ id: string }>(
    `SELECT course_id AS id FROM rooms WHERE id = $1 AND deleted_at IS NULL`,
    [roomId]
  );
  if (!course) throw new Error('Sala sin curso');

  const mappedDifficulty = mapQuestionDifficulty(difficulty);
  const questions = [...source.questions];
  // Orden de la partida: barajado una vez; identico para todos los jugadores
  // (getCourseQuestionIds ordena por sort_order de forma determinista).
  for (let i = questions.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = randomUUID();
      await client.query(
        `INSERT INTO questions (id, course_id, author_id, kind, prompt, explanation, difficulty, points, status, sort_order)
         VALUES ($1, $2, $3, 'single_choice', $4, $5, $6, 10, 'active', $7)`,
        [id, course.id, authorId, q.prompt, q.explanation, mappedDifficulty, i]
      );
      const correctIsA = q.correctAnswer === 'A';
      await client.query(
        `INSERT INTO question_options (question_id, text, sort_order, is_correct)
         VALUES ($1, $2, 0, $3), ($1, $4, 1, $5)`,
        [id, q.optionA, correctIsA, q.optionB, !correctIsA]
      );
    }
    await client.query('COMMIT');
    await finalizeGeneration(roomId, source.tema, 'ready', questions.length);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

async function finalizeGeneration(
  roomId: string,
  tema: string | null,
  status: 'ready' | 'failed',
  count?: number
): Promise<void> {
  await queryOne(
    `UPDATE chaos_rooms
        SET tema = coalesce($2, tema),
            question_count = coalesce($3, question_count),
            generation_status = $4,
            updated_at = now()
      WHERE room_id = $1 AND generation_status IN ('pending', 'running')
      RETURNING room_id`,
    [roomId, tema, count ?? null, status]
  );
}

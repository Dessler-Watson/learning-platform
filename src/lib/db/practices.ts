import { randomBytes } from 'crypto';
import { query, queryOne, getPool } from './client';

export class PracticeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PracticeValidationError';
  }
}

export interface PracticeSummary {
  id: string;
  code: string;
  title: string;
  description: string | null;
  topic: string | null;
  mode_code: string;
  mode_name: string;
  question_count: number;
  is_public: boolean;
  created_at: string;
  created_by: string;
  creator_name: string;
  play_count: number;
  correct_answers: number;
  incorrect_answers: number;
  last_played_at: string | null;
}

export interface PracticeQuestionRow {
  id: string;
  question_text: string;
  options_raw: Array<{ id: string; text: string }>;
  correct_option_id: string | null;
  correct_index: number | null;
  explanation: string | null;
  sort_order: number;
}

export interface PracticeAnswerInput {
  index: number;
  choice: 'A' | 'B' | null;
}

export interface GradedPracticeAnswer {
  position: number;
  questionId: string;
  optionId: string | null;
  isCorrect: boolean | null;
}

export interface GradedPractice {
  correct: number;
  incorrect: number;
  total: number;
  score: number;
  answers: GradedPracticeAnswer[];
}

export interface PracticeResultSummary {
  id: string;
  practice_id: string;
  score: number;
  correct: number;
  total: number;
  completed_at: string;
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function freeCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateCode();
    const clash = await queryOne(`SELECT 1 FROM practices WHERE code = $1`, [code]);
    if (!clash) return code;
  }
  throw new Error('No se pudo generar código de práctica');
}

const PRACTICE_SELECT = `
  SELECT p.id, p.code, p.title, p.description, p.topic, gm.code AS mode_code, gm.name AS mode_name,
         (SELECT count(*)::int FROM questions q WHERE q.practice_id = p.id AND q.deleted_at IS NULL) AS question_count,
         (p.status = 'published') AS is_public, p.created_at::text AS created_at, p.creator_id AS created_by,
         coalesce(u.nombre, 'Docente') AS creator_name,
         p.play_count,
         coalesce(vs.correct_answers, 0) AS correct_answers,
         coalesce(vs.incorrect_answers, 0) AS incorrect_answers,
         vs.last_played_at::text AS last_played_at
  FROM practices p
  JOIN game_modes gm ON gm.id = p.game_mode_id
  LEFT JOIN users u ON u.id = p.creator_id
  LEFT JOIN v_practice_stats vs ON vs.practice_id = p.id
`;

export async function listPractices(userId: string): Promise<PracticeSummary[]> {
  return query<PracticeSummary>(
    `${PRACTICE_SELECT} WHERE p.creator_id = $1 AND p.deleted_at IS NULL ORDER BY p.created_at DESC`,
    [userId]
  );
}

export async function listPublicPractices(): Promise<PracticeSummary[]> {
  return query<PracticeSummary>(
    `${PRACTICE_SELECT} WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.deleted_at IS NULL
     ORDER BY p.published_at DESC`
  );
}

export async function getPractice(practiceId: string): Promise<PracticeSummary | null> {
  return queryOne<PracticeSummary>(
    `${PRACTICE_SELECT} WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [practiceId]
  );
}

export async function listResults(userId: string, practiceId?: string): Promise<PracticeResultSummary[]> {
  const params: unknown[] = [userId];
  let where = `pp.user_id = $1 AND p.deleted_at IS NULL`;
  if (practiceId) {
    params.push(practiceId);
    where += ` AND pp.practice_id = $2`;
  }
  return query<PracticeResultSummary>(
    `SELECT pp.id, pp.practice_id, pp.score, pp.correct_count AS correct, pp.total_questions AS total,
            coalesce(pp.finished_at, pp.started_at)::text AS completed_at
     FROM practice_plays pp
     JOIN practices p ON p.id = pp.practice_id
     WHERE ${where}
     ORDER BY coalesce(pp.finished_at, pp.started_at) DESC`,
    params
  );
}

export async function createPractice(input: {
  createdBy: string;
  title: string;
  description?: string | null;
  topic?: string | null;
  modeCode: string;
  isPublic?: boolean;
  questions: Array<{ question_text: string; options: string[]; correct_index: number; explanation?: string | null }>;
}): Promise<string> {
  const mode = await queryOne<{ id: string }>(`SELECT id FROM game_modes WHERE code = $1`, [input.modeCode]);
  if (!mode) throw new Error(`Modo no encontrado: ${input.modeCode}`);

  const isPublic = Boolean(input.isPublic);
  let lastError: unknown = null;

  // Práctica + preguntas + opciones se insertan en UNA sola transacción:
  // o se crea completa, o no se crea nada (código única reintentado si choca).
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = await freeCode();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const created = await client.query<{ id: string }>(
        `INSERT INTO practices (code, creator_id, game_mode_id, title, description, topic, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::practice_status, CASE WHEN $8::boolean THEN now() ELSE NULL END)
         RETURNING id`,
        [code, input.createdBy, mode.id, input.title, input.description ?? null, input.topic ?? input.title, isPublic ? 'published' : 'private', isPublic]
      );
      const practiceId = created.rows[0].id;

      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        const question = await client.query<{ id: string }>(
          `INSERT INTO questions (course_id, practice_id, author_id, prompt, explanation, sort_order)
           VALUES (NULL, $1, $2, $3, $4, $5)
           RETURNING id`,
          [practiceId, input.createdBy, q.question_text, q.explanation ?? null, i]
        );
        const questionId = question.rows[0].id;
        for (let o = 0; o < q.options.length; o++) {
          await client.query(
            `INSERT INTO question_options (question_id, text, sort_order, is_correct)
             VALUES ($1, $2, $3, $4)`,
            [questionId, q.options[o], o, o === q.correct_index]
          );
        }
      }

      await client.query('COMMIT');
      return practiceId;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { /* conexión rota: ya abajo */ }
      lastError = err;
      if ((err as { code?: string }).code === '23505' && attempt < 2) continue;
      throw err;
    } finally {
      client.release();
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No se pudo crear la práctica');
}

export async function publishPractice(practiceId: string, userId: string): Promise<boolean> {
  const result = await query(
    `UPDATE practices SET status = 'published', published_at = COALESCE(published_at, now())
     WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL AND status <> 'published'
     RETURNING id`,
    [practiceId, userId]
  );
  return result.length > 0;
}

export async function unpublishPractice(practiceId: string, userId: string): Promise<boolean> {
  const result = await query(
    `UPDATE practices SET status = 'private'
     WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL AND status = 'published'
     RETURNING id`,
    [practiceId, userId]
  );
  return result.length > 0;
}

export async function deletePractice(practiceId: string, userId: string): Promise<boolean> {
  const result = await query(
    `UPDATE practices SET deleted_at = now()
     WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [practiceId, userId]
  );
  return result.length > 0;
}

export async function getPracticeQuestions(practiceId: string): Promise<PracticeQuestionRow[]> {
  return query<PracticeQuestionRow>(
    `SELECT q.id, q.prompt AS question_text,
            (SELECT coalesce(json_agg(json_build_object('id', o.id, 'text', o.text) ORDER BY o.sort_order), '[]'::json)
             FROM question_options o WHERE o.question_id = q.id) AS options_raw,
            (SELECT o.id FROM question_options o WHERE o.question_id = q.id AND o.is_correct LIMIT 1) AS correct_option_id,
            (SELECT o.sort_order FROM question_options o WHERE o.question_id = q.id AND o.is_correct LIMIT 1) AS correct_index,
            q.explanation, q.sort_order
     FROM questions q
     WHERE q.practice_id = $1 AND q.deleted_at IS NULL
     ORDER BY q.sort_order, q.id`,
    [practiceId]
  );
}

/**
 * El servidor califica: recibe las elecciones del cliente (posición + A/B/null)
 * y las compara contra is_correct en BD. El front NUNCA envía aciertos ni score.
 */
export function gradePracticeAnswers(
  questions: PracticeQuestionRow[],
  answers: PracticeAnswerInput[]
): GradedPractice {
  const choiceByPosition = new Map<number, 'A' | 'B'>();
  for (const a of answers) {
    if (!Number.isInteger(a.index) || a.index < 0 || a.index >= questions.length) {
      throw new PracticeValidationError(`Respuesta fuera de rango: ${a.index}`);
    }
    if (a.choice !== null) choiceByPosition.set(a.index, a.choice);
  }

  const graded: GradedPracticeAnswer[] = [];
  let correct = 0;
  let incorrect = 0;

  for (let position = 0; position < questions.length; position++) {
    const q = questions[position];
    const choice = choiceByPosition.get(position) ?? null;
    if (choice === null) {
      graded.push({ position, questionId: q.id, optionId: null, isCorrect: null });
      continue;
    }
    const optionIndex = choice === 'A' ? 0 : 1;
    const optionId = q.options_raw[optionIndex]?.id ?? null;
    const isCorrect = q.correct_index === optionIndex;
    if (isCorrect) correct += 1;
    else incorrect += 1;
    graded.push({ position, questionId: q.id, optionId, isCorrect });
  }

  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, incorrect, total, score, answers: graded };
}

export async function recordPracticeResult(input: {
  userId: string;
  practiceId: string;
  graded: GradedPractice;
}): Promise<string> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const play = await client.query<{ id: string }>(
      `INSERT INTO practice_plays (practice_id, user_id, score, correct_count, incorrect_count, total_questions, finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       RETURNING id`,
      [input.practiceId, input.userId, input.graded.score, input.graded.correct, input.graded.incorrect, input.graded.total]
    );
    const playId = play.rows[0].id;
    for (const a of input.graded.answers) {
      await client.query(
        `INSERT INTO practice_answers (play_id, question_id, option_id, question_position, is_correct)
         VALUES ($1, $2, $3, $4, $5)`,
        [playId, a.questionId, a.optionId, a.position, a.isCorrect]
      );
    }
    // play_count es la caché de ordenación; se incrementa en el mismo commit
    // del play (la verdad exacta es COUNT(practice_plays) / v_practice_stats).
    await client.query(`UPDATE practices SET play_count = play_count + 1 WHERE id = $1`, [input.practiceId]);
    await client.query('COMMIT');
    return playId;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* conexión rota: ya abajo */ }
    throw err;
  } finally {
    client.release();
  }
}

export async function getPracticeStats(userId: string) {
  return queryOne<{ total: number; avg_score: number; best_score: number; total_time: number }>(
    `SELECT count(*)::int AS total,
            COALESCE(avg(score), 0)::int AS avg_score,
            COALESCE(max(score), 0)::int AS best_score,
            COALESCE(sum(coalesce(duration_ms, 0)), 0)::int AS total_time
     FROM practice_plays WHERE user_id = $1`,
    [userId]
  );
}

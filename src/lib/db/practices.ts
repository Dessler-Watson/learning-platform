import { randomBytes } from 'crypto';
import { query, queryOne } from './client';

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
         p.play_count
  FROM practices p
  JOIN game_modes gm ON gm.id = p.game_mode_id
  LEFT JOIN users u ON u.id = p.creator_id
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
  const code = await freeCode();

  const isPublic = Boolean(input.isPublic);
  const created = await queryOne<{ id: string }>(
    `INSERT INTO practices (code, creator_id, game_mode_id, title, description, topic, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::practice_status, CASE WHEN $8::boolean THEN now() ELSE NULL END)
     RETURNING id`,
    [code, input.createdBy, mode.id, input.title, input.description ?? null, input.topic ?? input.title, isPublic ? 'published' : 'private', isPublic]
  );
  if (!created) throw new Error('No se pudo crear la práctica');

  for (const q of input.questions) {
    const question = await queryOne<{ id: string }>(
      `INSERT INTO questions (course_id, practice_id, author_id, prompt, explanation, sort_order)
       VALUES (NULL, $1, $2, $3, $4, $5)
       RETURNING id`,
      [created.id, input.createdBy, q.question_text, q.explanation ?? null, 0]
    );
    if (!question) continue;
    for (let i = 0; i < q.options.length; i++) {
      await query(
        `INSERT INTO question_options (question_id, text, sort_order, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [question.id, q.options[i], i, i === q.correct_index]
      );
    }
    // keep sort_order sequential by re-indexing after insert is fine; set once
    await query(
      `UPDATE questions SET sort_order = (
         SELECT coalesce(max(sort_order), 0) + 1 FROM questions WHERE practice_id = $1
       ) WHERE id = $2`,
      [created.id, question.id]
    );
  }
  return created.id;
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

export async function getPracticeQuestions(practiceId: string) {
  return query(
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

export async function recordPracticeResult(input: {
  userId: string;
  practiceId: string;
  score: number;
  correct: number;
  total: number;
  incorrect?: number;
}): Promise<string> {
  const created = await queryOne<{ id: string }>(
    `INSERT INTO practice_plays (practice_id, user_id, score, correct_count, incorrect_count, total_questions, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     RETURNING id`,
    [
      input.practiceId,
      input.userId,
      input.score,
      input.correct,
      input.incorrect ?? Math.max(0, input.total - input.correct),
      input.total,
    ]
  );
  if (!created) throw new Error('No se pudo guardar el resultado');
  await query(`UPDATE practices SET play_count = play_count + 1 WHERE id = $1`, [input.practiceId]);
  return created.id;
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

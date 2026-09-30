import { query, queryOne } from './client';

export interface CourseRow {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  created_at: string;
  status: string;
  teacher_id: string;
  mode_code: string;
}

const COURSE_SELECT = `
  SELECT c.id, c.name, c.description, c.status::text AS status, c.teacher_id,
         gm.code AS mode_code, c.created_at::text AS created_at,
         gm.code AS subject, NULL::text AS grade_level, gm.code AS code
  FROM courses c
  JOIN game_modes gm ON gm.id = c.game_mode_id
`;

export async function listCourses(filters?: { subject?: string; search?: string; teacherId?: string }): Promise<CourseRow[]> {
  const where: string[] = ['c.deleted_at IS NULL'];
  const params: unknown[] = [];
  if (filters?.teacherId) {
    params.push(filters.teacherId);
    where.push(`c.teacher_id = $${params.length}`);
  }
  if (filters?.subject) {
    params.push(filters.subject);
    where.push(`gm.code = $${params.length}`);
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    where.push(`(c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
  }
  return query<CourseRow>(`${COURSE_SELECT} WHERE ${where.join(' AND ')} ORDER BY c.name`, params);
}

export async function getCourse(id: string): Promise<CourseRow | null> {
  return queryOne<CourseRow>(`${COURSE_SELECT} WHERE c.id = $1 AND c.deleted_at IS NULL`, [id]);
}

export interface CoursesPage {
  cursos: CourseRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalPreguntas: number;
}

export const COURSE_PAGE_LIMIT_DEFAULT = 15;
export const COURSE_PAGE_LIMIT_MAX = 100;

/**
 * Listado paginado con busqueda ILIKE (nombre/descripcion), filtro opcional
 * por modo (gm.code) y orden estable (name, id). page se recorta a la ultima
 * pagina valida. totalPreguntas agrega las preguntas activas de todos los
 * cursos que cumplen el filtro (no solo de la pagina).
 */
export async function listCoursesPage(
  filters?: { teacherId?: string; search?: string; mode?: string },
  opts?: { page?: number; limit?: number }
): Promise<CoursesPage> {
  const where: string[] = ['c.deleted_at IS NULL'];
  const params: unknown[] = [];
  if (filters?.teacherId) {
    params.push(filters.teacherId);
    where.push(`c.teacher_id = $${params.length}`);
  }
  if (filters?.mode) {
    params.push(filters.mode);
    where.push(`gm.code = $${params.length}`);
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    where.push(`(c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
  }
  const whereSql = where.join(' AND ');

  const countRow = await queryOne<{ total: number }>(
    `SELECT count(*)::int AS total
     FROM courses c
     JOIN game_modes gm ON gm.id = c.game_mode_id
     WHERE ${whereSql}`,
    params
  );
  const total = countRow?.total ?? 0;

  const pregRow = await queryOne<{ total_preguntas: number }>(
    `SELECT coalesce(sum(n), 0)::int AS total_preguntas
     FROM (
       SELECT (SELECT count(*) FROM questions q
               WHERE q.course_id = c.id AND q.deleted_at IS NULL AND q.status = 'active') AS n
       FROM courses c
       JOIN game_modes gm ON gm.id = c.game_mode_id
       WHERE ${whereSql}
     ) sub`,
    params
  );
  const totalPreguntas = pregRow?.total_preguntas ?? 0;

  const rawPage = opts?.page ?? 1;
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawLimit = opts?.limit ?? COURSE_PAGE_LIMIT_DEFAULT;
  const limit =
    Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= COURSE_PAGE_LIMIT_MAX
      ? rawLimit
      : COURSE_PAGE_LIMIT_DEFAULT;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const effPage = Math.min(page, totalPages);

  params.push(limit, (effPage - 1) * limit);
  const cursos = await query<CourseRow>(
    `${COURSE_SELECT} WHERE ${whereSql} ORDER BY c.name, c.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { cursos, total, page: effPage, limit, totalPages, totalPreguntas };
}

export async function listCourseQuestions(courseId: string) {
  return query(
    `SELECT q.id, q.prompt AS question_text,
            (SELECT coalesce(json_agg(json_build_object('id', o.id, 'text', o.text) ORDER BY o.sort_order), '[]'::json)
             FROM question_options o WHERE o.question_id = q.id) AS options,
            (SELECT o.sort_order FROM question_options o WHERE o.question_id = q.id AND o.is_correct LIMIT 1) AS correct_index,
            q.explanation, q.difficulty
     FROM questions q
     WHERE q.course_id = $1 AND q.deleted_at IS NULL AND q.status = 'active'
     ORDER BY q.sort_order, q.id`,
    [courseId]
  );
}

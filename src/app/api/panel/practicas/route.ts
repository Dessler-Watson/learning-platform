import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne, getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PAGE_LIMIT_DEFAULT = 15;
const PAGE_LIMIT_MAX = 100;
const BULK_MAX_IDS = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAdmin(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== 'admin') {
    return { session: null, res: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { session, res: null as NextResponse | null };
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function GET(req: NextRequest) {
  try {
    const { session, res } = await requireAdmin(req);
    if (res || !session) return res!;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim().slice(0, 100);
    const mode = (searchParams.get('mode') ?? '').trim().slice(0, 40);

    const pageRaw = searchParams.get('page');
    const limitRaw = searchParams.get('limit');
    const page = pageRaw === null ? 1 : Number(pageRaw);
    const limit = limitRaw === null ? PAGE_LIMIT_DEFAULT : Number(limitRaw);
    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: 'page inválida' }, { status: 400 });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > PAGE_LIMIT_MAX) {
      return NextResponse.json({ error: 'limit inválido' }, { status: 400 });
    }

    const params: unknown[] = [];
    let where = `p.status = 'published' AND p.published_at IS NOT NULL AND p.deleted_at IS NULL`;

    if (q) {
      const normalized = normalizeSearchText(q);
      const normalizedCode = normalized.replace('#', '');
      params.push(`%${escapeLike(normalized)}%`);
      const textPattern = `$${params.length}`;
      let codePattern = textPattern;
      if (normalizedCode !== normalized) {
        params.push(`%${escapeLike(normalizedCode)}%`);
        codePattern = `$${params.length}`;
      }
      where += ` AND (
        translate(lower(p.title), 'áéíóúüñ', 'aeiouun') LIKE ${textPattern}
        OR translate(lower(coalesce(p.topic, '')), 'áéíóúüñ', 'aeiouun') LIKE ${textPattern}
        OR translate(lower(coalesce(u.nombre, '')), 'áéíóúüñ', 'aeiouun') LIKE ${textPattern}
        OR lower(p.code) LIKE ${codePattern}
      )`;
    }

    if (mode) {
      params.push(mode);
      where += ` AND gm.code = $${params.length}`;
    }

    const countRow = await queryOne<{ total: number }>(
      `SELECT count(*)::int AS total
       FROM practices p
       JOIN game_modes gm ON gm.id = p.game_mode_id
       LEFT JOIN users u ON u.id = p.creator_id
       WHERE ${where}`,
      params
    );
    const total = countRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const rows = await query<{
      id: string;
      code: string;
      title: string;
      topic: string | null;
      creator_name: string;
      mode_code: string;
      mode_name: string;
      mode_color: string | null;
      published_at: string;
      question_count: number;
      play_count: number;
    }>(
      `SELECT p.id, p.code, p.title, p.topic,
              coalesce(u.nombre, 'Docente') AS creator_name,
              gm.code AS mode_code, gm.name AS mode_name, gm.color AS mode_color,
              coalesce(p.published_at, p.created_at)::text AS published_at,
              (SELECT count(*)::int FROM questions q
                WHERE q.practice_id = p.id AND q.deleted_at IS NULL) AS question_count,
              p.play_count
       FROM practices p
       JOIN game_modes gm ON gm.id = p.game_mode_id
       LEFT JOIN users u ON u.id = p.creator_id
       WHERE ${where}
       ORDER BY p.published_at DESC, p.id DESC
       LIMIT ${limit} OFFSET ${(safePage - 1) * limit}`,
      params
    );

    return NextResponse.json({
      practicas: rows.map((r) => ({
        id: r.id,
        code: r.code,
        titulo: r.title,
        tema: r.topic,
        creador: r.creator_name,
        modo: r.mode_code,
        modoNombre: r.mode_name,
        modoColor: r.mode_color,
        fecha: r.published_at,
        preguntas: r.question_count,
        reproducciones: r.play_count,
      })),
      page: safePage,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error('[panel practicas GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, res } = await requireAdmin(req);
    if (res || !session) return res!;

    const body = await req.json();
    const action = String(body.action ?? '');

    let ids: string[] = [];
    let single = false;
    if (action === 'delete') {
      const id = String(body.id ?? '');
      if (!id || !UUID_RE.test(id)) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
      ids = [id];
      single = true;
    } else if (action === 'bulk_delete') {
      const rawIds = body.ids;
      if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > BULK_MAX_IDS) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
      ids = rawIds.map((v: unknown) => String(v));
      if (ids.some((id) => !UUID_RE.test(id))) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Borrado físico en transacción: questions/practice_plays cascaden a
    // question_options/practice_answers sin dejar huérfanos. Solo prácticas
    // publicadas (mismo alcance que el listado); nunca toca partidas de sala
    // (participant_answers solo referencia preguntas de curso).
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const del = await client.query<{ id: string }>(
        `DELETE FROM practices
         WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL AND status = 'published'
         RETURNING id`,
        [ids]
      );
      const deletedIds = del.rows.map((r) => r.id);
      if (deletedIds.length > 0) {
        await client.query(
          `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
           SELECT $1, 'practice', p_id, 'deleted', jsonb_build_object('bulk', $2::boolean)
           FROM unnest($3::uuid[]) AS p_id`,
          [session.id, !single, deletedIds]
        );
      }
      await client.query('COMMIT');

      if (single && deletedIds.length === 0) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, deleted: deletedIds.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[panel practicas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

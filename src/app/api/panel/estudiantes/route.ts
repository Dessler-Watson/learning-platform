import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne, getPool, hashPassword, revokeAllUserSessions } from '@/lib/db';

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

export async function GET(req: NextRequest) {
  try {
    const { session, res } = await requireAdmin(req);
    if (res || !session) return res!;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();

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
    let where = `u.is_guest = false AND u.deleted_at IS NULL AND r.code = 'student'`;
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (u.nombre ILIKE $1 OR coalesce(u.email, '') ILIKE $1)`;
    }

    const countRow = await queryOne<{ total: number }>(
      `SELECT count(*)::int AS total
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE ${where}`,
      params
    );
    const total = countRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const rows = await query<{
      id: string;
      nombre: string;
      email: string | null;
      status: string;
      created_at: string;
      last_seen: string | null;
      stars: number;
    }>(
      `SELECT u.id, u.nombre, u.email, u.status::text AS status,
              u.created_at::text AS created_at,
              (SELECT max(created_at)::text FROM audit_events ae WHERE ae.actor_id = u.id) AS last_seen,
              coalesce(plp.stars, 0)::int AS stars
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN player_league_progress plp ON plp.user_id = u.id
       WHERE ${where}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ${limit} OFFSET ${(safePage - 1) * limit}`,
      params
    );

    const resumenRow = await queryOne<{ total: number; activos: number; suspendidos: number; estrellas: number }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE u.status = 'active')::int AS activos,
              count(*) FILTER (WHERE u.status = 'suspended')::int AS suspendidos,
              coalesce(sum(coalesce(plp.stars, 0)), 0)::int AS estrellas
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN player_league_progress plp ON plp.user_id = u.id
       WHERE u.is_guest = false AND u.deleted_at IS NULL AND r.code = 'student'`
    );

    return NextResponse.json({
      estudiantes: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        correo: r.email ?? '',
        estado: r.status === 'active' ? 'activo' : r.status === 'inactive' ? 'inactivo' : 'suspendido',
        fechaRegistro: r.created_at.split('T')[0],
        ultimaActividad: r.last_seen ?? r.created_at,
        estrellas: r.stars,
      })),
      page: safePage,
      limit,
      total,
      totalPages,
      resumen: {
        total: resumenRow?.total ?? 0,
        activos: resumenRow?.activos ?? 0,
        suspendidos: resumenRow?.suspendidos ?? 0,
        estrellas: resumenRow?.estrellas ?? 0,
      },
    });
  } catch (err) {
    console.error('[panel estudiantes GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, res } = await requireAdmin(req);
    if (res || !session) return res!;

    const body = await req.json();
    const action = String(body.action ?? '');

    if (action === 'update') {
      const id = String(body.id ?? '');
      if (!id) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

      const target = await queryOne<{ id: string; role: string }>(
        `SELECT u.id, r.code AS role FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND u.deleted_at IS NULL AND r.code = 'student' AND u.is_guest = false`,
        [id]
      );
      if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

      if (body.correo != null || body.email != null) {
        const newEmail = String(body.correo ?? body.email ?? '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
          return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
        }
        const conflict = await queryOne(
          `SELECT 1 FROM users WHERE lower(email) = lower($1) AND id <> $2 AND deleted_at IS NULL`,
          [newEmail, id]
        );
        if (conflict) return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 });
      }

      if (body.nombre != null && !String(body.nombre).trim()) {
        return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
      }

      if (body.contrasena || body.password) {
        const password = String(body.contrasena ?? body.password);
        if (password.length < 6) return NextResponse.json({ error: 'Contraseña muy corta' }, { status: 400 });
        const hash = await hashPassword(password);
        await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [id, hash]);
        await revokeAllUserSessions(id);
      }

      await query(
        `UPDATE users SET
           nombre = COALESCE(NULLIF(trim($2), ''), nombre),
           email = COALESCE(NULLIF(lower(trim($3)), ''), email),
           status = COALESCE($4::user_status, status)
         WHERE id = $1`,
        [
          id,
          body.nombre != null ? String(body.nombre) : null,
          body.correo != null || body.email != null ? String(body.correo ?? body.email) : null,
          body.estado != null
            ? body.estado === 'activo'
              ? 'active'
              : body.estado === 'inactivo'
                ? 'inactive'
                : 'suspended'
            : null,
        ]
      );

      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'user', $2, 'updated', '{}'::jsonb)`,
        [session.id, id]
      );

      return NextResponse.json({ ok: true });
    }

    if (action === 'delete') {
      const id = String(body.id ?? '');
      if (!id) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      if (id === session.id) {
        return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
      }

      const target = await queryOne<{ id: string }>(
        `SELECT u.id FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND u.deleted_at IS NULL AND r.code = 'student' AND u.is_guest = false`,
        [id]
      );
      if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

      // Soft delete: conserva match_participants / participant_answers / logros / ligas
      // y evita violar FKs RESTRICT/NO ACTION (courses.teacher_id, practices.creator_id).
      await query(
        `UPDATE users SET deleted_at = now(), status = 'inactive' WHERE id = $1`,
        [id]
      );
      await revokeAllUserSessions(id);
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'user', $2, 'deleted', '{}'::jsonb)`,
        [session.id, id]
      );

      return NextResponse.json({ ok: true });
    }

    if (action === 'bulk_delete') {
      const rawIds = body.ids;
      if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > BULK_MAX_IDS) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
      const ids = rawIds.map((v: unknown) => String(v));
      if (ids.some((id: string) => !UUID_RE.test(id))) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }
      if (ids.includes(session.id)) {
        return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
      }

      // Soft delete transaccional: conserva match_participants / participant_answers
      // / logros / ligas y evita violar FKs RESTRICT/NO ACTION.
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const upd = await client.query<{ id: string }>(
          `UPDATE users SET deleted_at = now(), status = 'inactive'
           WHERE id = ANY($1::uuid[]) AND is_guest = false AND deleted_at IS NULL
             AND role_id IN (SELECT id FROM roles WHERE code = 'student')
           RETURNING id`,
          [ids]
        );
        const deletedIds = upd.rows.map((r) => r.id);
        if (deletedIds.length > 0) {
          await client.query(
            `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
             SELECT $1, 'user', u_id, 'deleted', jsonb_build_object('bulk', true)
             FROM unnest($2::uuid[]) AS u_id`,
            [session.id, deletedIds]
          );
          await client.query(
            `UPDATE user_sessions SET revoked_at = now()
             WHERE user_id = ANY($1::uuid[]) AND revoked_at IS NULL`,
            [deletedIds]
          );
        }
        await client.query('COMMIT');
        return NextResponse.json({ ok: true, deleted: deletedIds.length });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel estudiantes POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

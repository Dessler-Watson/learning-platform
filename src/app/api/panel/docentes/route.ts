import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne, getPool, hashPassword, revokeAllUserSessions } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PAGE_LIMIT_DEFAULT = 15;
const PAGE_LIMIT_MAX = 100;
const BULK_MAX_IDS = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const institucion = (searchParams.get('institucion') ?? '').trim();

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
    let where = `u.is_guest = false AND u.deleted_at IS NULL AND r.code IN ('teacher', 'admin')`;
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (u.nombre ILIKE $${params.length} OR coalesce(u.email, '') ILIKE $${params.length})`;
    }
    if (institucion) {
      params.push(institucion);
      where += ` AND lower(coalesce(i.name, '')) = lower($${params.length})`;
    }

    const countRow = await queryOne<{ total: number }>(
      `SELECT count(*)::int AS total
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN institutions i ON i.id = u.institution_id
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
      role: string;
      institution: string | null;
      status: string;
      created_at: string;
      last_seen: string | null;
    }>(
      `SELECT u.id, u.nombre, u.email, r.code AS role, i.name AS institution,
              u.status::text AS status, u.created_at::text AS created_at,
              (SELECT max(created_at)::text FROM audit_events ae WHERE ae.actor_id = u.id) AS last_seen
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN institutions i ON i.id = u.institution_id
       WHERE ${where}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ${limit} OFFSET ${(safePage - 1) * limit}`,
      params
    );

    const resumenRow = await queryOne<{
      total: number;
      docentes: number;
      admins: number;
      activos: number;
      en_linea: number;
    }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE r.code = 'teacher')::int AS docentes,
              count(*) FILTER (WHERE r.code = 'admin')::int AS admins,
              count(*) FILTER (WHERE u.status = 'active')::int AS activos,
              count(*) FILTER (
                WHERE coalesce(
                  (SELECT max(created_at) FROM audit_events ae WHERE ae.actor_id = u.id),
                  u.created_at
                ) > now() - interval '5 minutes'
              )::int AS en_linea
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.is_guest = false AND u.deleted_at IS NULL AND r.code IN ('teacher', 'admin')`
    );

    const instituciones = await query<{ institution: string | null }>(
      `SELECT DISTINCT i.name AS institution FROM institutions i
       WHERE i.deleted_at IS NULL AND i.name IS NOT NULL ORDER BY 1`
    );

    return NextResponse.json({
      docentes: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        correo: r.email ?? '',
        contrasena: '',
        institucion: r.institution ?? '',
        rol: r.role === 'admin' ? 'admin' : 'docente',
        estado: r.status === 'active' ? 'activo' : r.status === 'inactive' ? 'inactivo' : 'suspendido',
        fechaRegistro: r.created_at.split('T')[0],
        ultimaActividad: r.last_seen ?? r.created_at,
      })),
      instituciones: instituciones.map((i) => i.institution).filter(Boolean),
      page: safePage,
      limit,
      total,
      totalPages,
      resumen: {
        total: resumenRow?.total ?? 0,
        docentes: resumenRow?.docentes ?? 0,
        admins: resumenRow?.admins ?? 0,
        activos: resumenRow?.activos ?? 0,
        enLinea: resumenRow?.en_linea ?? 0,
      },
    });
  } catch (err) {
    console.error('[panel docentes GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await req.json();
    const action = String(body.action ?? 'create');

    if (action === 'create') {
      const nombre = String(body.nombre ?? '').trim();
      const email = String(body.correo ?? body.email ?? '').trim().toLowerCase();
      const password = String(body.contrasena ?? body.password ?? '');
      const institution = String(body.institucion ?? body.institution ?? '').trim();
      const roleCode = body.rol === 'admin' ? 'admin' : 'teacher';
      if (!nombre || !email || password.length < 6) {
        return NextResponse.json({ error: 'Datos inválidos (mín. 6 caracteres en contraseña)' }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
      }
      const exists = await queryOne(`SELECT 1 FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL`, [email]);
      if (exists) return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 });
      const roleRow = await queryOne<{ id: string }>(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
      if (!roleRow) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
      let instId: string | null = null;
      if (institution) {
        const existing = await queryOne<{ id: string }>(
          `SELECT id FROM institutions WHERE lower(name) = lower($1) AND deleted_at IS NULL`,
          [institution]
        );
        if (existing) {
          instId = existing.id;
        } else {
          const createdInst = await queryOne<{ id: string }>(
            `INSERT INTO institutions (name) VALUES ($1) RETURNING id`,
            [institution]
          );
          instId = createdInst?.id ?? null;
        }
      }
      const password_hash = await hashPassword(password);
      const created = await queryOne<{ id: string }>(
        `INSERT INTO users (nombre, email, password_hash, role_id, institution_id, status, is_guest)
         VALUES ($1, $2, $3, $4, $5, 'active', false)
         RETURNING id`,
        [nombre, email, password_hash, roleRow.id, instId]
      );
      if (!created) return NextResponse.json({ error: 'No se pudo crear' }, { status: 500 });
      await query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
         VALUES ($1, 'user', $2, 'created', jsonb_build_object('email', coalesce($3::text, '')))`,
        [session.id, created.id, email]
      );
      return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
    }

    if (action === 'exists') {
      const email = String(body.correo ?? body.email ?? '').trim().toLowerCase();
      const exists = await queryOne(`SELECT 1 FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL`, [email]);
      return NextResponse.json({ existe: Boolean(exists) });
    }

    if (action === 'update') {
      const id = String(body.id ?? '');
      const target = await queryOne<{ id: string; role: string }>(
        `SELECT u.id, r.code AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1 AND u.deleted_at IS NULL`,
        [id]
      );
      if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      if (target.role !== 'teacher' && target.role !== 'admin') {
        return NextResponse.json({ error: 'Solo se pueden modificar docentes o administradores' }, { status: 400 });
      }
      if (body.correo != null || body.email != null) {
        const newEmail = String(body.correo ?? body.email ?? '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
          return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
        }
        const dup = await queryOne<{ id: string }>(
          `SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2 AND deleted_at IS NULL LIMIT 1`,
          [newEmail, id]
        );
        if (dup) {
          return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
        }
      }
      if (body.contrasena || body.password) {
        const password = String(body.contrasena ?? body.password);
        if (password.length < 6) return NextResponse.json({ error: 'Contraseña muy corta' }, { status: 400 });
        const hash = await hashPassword(password);
        await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [id, hash]);
        await revokeAllUserSessions(id);
      }
      let roleUuid: string | null = null;
      if (body.rol != null) {
        const roleCode = body.rol === 'admin' ? 'admin' : 'teacher';
        const roleRow = await queryOne<{ id: string }>(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
        roleUuid = roleRow?.id ?? null;
      }
      let instUuid: string | null = null;
      if (body.institucion != null || body.institution != null) {
        const institution = String(body.institucion ?? body.institution ?? '').trim();
        if (institution) {
          const existing = await queryOne<{ id: string }>(
            `SELECT id FROM institutions WHERE lower(name) = lower($1) AND deleted_at IS NULL`,
            [institution]
          );
          if (existing) {
            instUuid = existing.id;
          } else {
            const createdInst = await queryOne<{ id: string }>(
              `INSERT INTO institutions (name) VALUES ($1) RETURNING id`,
              [institution]
            );
            instUuid = createdInst?.id ?? null;
          }
        }
      }
      await query(
        `UPDATE users SET
           nombre = COALESCE($2, nombre),
           email = COALESCE(lower($3), email),
           institution_id = COALESCE($4, institution_id),
           role_id = COALESCE($5, role_id),
           status = COALESCE($6::user_status, status)
         WHERE id = $1`,
        [
          id,
          body.nombre != null ? String(body.nombre) : null,
          body.correo != null ? String(body.correo) : null,
          instUuid,
          roleUuid,
          body.estado != null
            ? body.estado === 'activo'
              ? 'active'
              : body.estado === 'inactivo'
                ? 'inactive'
                : 'suspended'
            : null,
        ]
      );
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete') {
      const id = String(body.id ?? '');
      if (id === session.id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
      await query(
        `UPDATE users SET deleted_at = now(), status = 'inactive'
         WHERE id = $1 AND role_id IN (SELECT id FROM roles WHERE code IN ('teacher','admin'))`,
        [id]
      );
      await revokeAllUserSessions(id);
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

      // Soft delete transaccional: conserva courses.teacher_id / practices.creator_id
      // y otras FKs RESTRICT/NO ACTION.
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const upd = await client.query<{ id: string }>(
          `UPDATE users SET deleted_at = now(), status = 'inactive'
           WHERE id = ANY($1::uuid[]) AND is_guest = false AND deleted_at IS NULL
             AND role_id IN (SELECT id FROM roles WHERE code IN ('teacher', 'admin'))
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
    console.error('[panel docentes POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

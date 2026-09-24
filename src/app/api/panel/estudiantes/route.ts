import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, query, queryOne, hashPassword, revokeAllUserSessions } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const params: unknown[] = [];
    let where = `u.is_guest = false AND u.deleted_at IS NULL AND r.code = 'student'`;
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (u.nombre ILIKE $1 OR coalesce(u.email, '') ILIKE $1)`;
    }

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
       ORDER BY u.created_at DESC`,
      params
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

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[panel estudiantes POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

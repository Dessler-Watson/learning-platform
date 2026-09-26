import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_NAME = 120;

async function institutionOf(userId: string): Promise<string> {
  const row = await queryOne<{ name: string | null }>(
    `SELECT i.name FROM users u LEFT JOIN institutions i ON i.id = u.institution_id WHERE u.id = $1`,
    [userId]
  );
  return row?.name ?? '';
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
        institution: await institutionOf(user.id),
      },
    });
  } catch (err) {
    console.error('[panel/auth/me]', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

// Actualización del propio perfil (docente/admin): persiste en PostgreSQL.
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();

    const nombreRaw = body.nombre != null ? String(body.nombre).trim() : null;
    if (nombreRaw !== null) {
      if (!nombreRaw) return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
      if (nombreRaw.length > MAX_NAME) {
        return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME} caracteres` }, { status: 400 });
      }
    }

    const correoRaw = body.correo != null ? String(body.correo).trim().toLowerCase() : null;
    if (correoRaw !== null && correoRaw !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoRaw)) {
        return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
      }
      const conflict = await queryOne(
        `SELECT 1 FROM users WHERE lower(email) = lower($1) AND id <> $2 AND deleted_at IS NULL`,
        [correoRaw, user.id]
      );
      if (conflict) return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 });
    }

    let instUuid: string | null = null;
    const institucionRaw = body.institucion != null ? String(body.institucion).trim() : null;
    if (institucionRaw) {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM institutions WHERE lower(name) = lower($1) AND deleted_at IS NULL`,
        [institucionRaw]
      );
      if (existing) {
        instUuid = existing.id;
      } else {
        const createdInst = await queryOne<{ id: string }>(
          `INSERT INTO institutions (name) VALUES ($1) RETURNING id`,
          [institucionRaw]
        );
        instUuid = createdInst?.id ?? null;
      }
    }

    if (nombreRaw == null && (correoRaw == null || correoRaw === '') && !institucionRaw) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    await queryOne(
      `UPDATE users SET
         nombre = COALESCE($2, nombre),
         email = COALESCE($3, email),
         institution_id = COALESCE($4, institution_id)
       WHERE id = $1
       RETURNING id`,
      [
        user.id,
        nombreRaw,
        correoRaw !== null && correoRaw !== '' ? correoRaw : null,
        instUuid,
      ]
    );
    await queryOne(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, metadata)
       VALUES ($1, 'user', $1, 'updated', '{"via":"perfil"}'::jsonb)
       RETURNING id`,
      [user.id]
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        nombre: nombreRaw ?? user.nombre,
        apellido: user.apellido,
        email: correoRaw && correoRaw !== '' ? correoRaw : user.email,
        role: user.role,
        institution: await institutionOf(user.id),
      },
    });
  } catch (err) {
    console.error('[panel/auth/me POST]', err);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}

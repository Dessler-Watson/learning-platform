import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, hashPassword, listAvatars, query, queryOne } from '@/lib/db';
import { getSessionUser } from '@/lib/db/sessions';

export const dynamic = 'force-dynamic';

function calcularEdad(fechaISO: string): number {
  const nac = new Date(`${fechaISO}T00:00:00`);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rol = searchParams.get('rol');
    const estado = searchParams.get('estado');

    const params: unknown[] = [];
    const where: string[] = ['u.deleted_at IS NULL'];
    if (rol) {
      params.push(rol);
      where.push(`r.code = $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      where.push(`u.status = $${params.length}`);
    }

    const rows = await query(
      `SELECT u.id AS id_usuario, a.sort_order AS avatar_id, u.nombre, coalesce(u.apellido, '') AS apellido,
              u.email AS correo, r.code AS rol, u.status AS estado,
              u.created_at::text AS fecha_registro,
              u.birth_date::text AS fecha_nacimiento, u.sex AS sexo,
              a.name AS avatar_nombre
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN avatars a ON a.id = u.avatar_id
       WHERE ${where.join(' AND ')}
       ORDER BY u.created_at DESC`,
      params
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[usuarios GET]', err);
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : '';
    const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const avatarId = Number(body.avatar_id) || 1;
    const fechaNacimiento = typeof body.fecha_nacimiento === 'string' ? body.fecha_nacimiento.trim() : '';
    const sexo = typeof body.sexo === 'string' ? body.sexo.trim().toLowerCase() : '';

    if (!nombre || !apellido || !correo || !password) {
      return NextResponse.json({ error: 'Nombre, apellido, correo y contraseña son obligatorios' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
    }
    if (fechaNacimiento && calcularEdad(fechaNacimiento) < 3) {
      return NextResponse.json({ error: 'Debes tener al menos 3 anos para usar la aplicacion' }, { status: 400 });
    }

    const existing = await getUserByEmail(correo);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }

    const avatares = await listAvatars();
    const avatarOk = avatares.some((a) => a.sort_order === avatarId);

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      roleCode: 'student',
      nombre,
      apellido,
      email: correo,
      passwordHash,
      avatarSort: avatarOk ? avatarId : 1,
      birthDate: fechaNacimiento || null,
      sex: sexo || null,
    });

    const avatar = avatares.find((a) => a.sort_order === (avatarOk ? avatarId : 1));
    return NextResponse.json(
      {
        success: true,
        usuario: {
          id_usuario: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          correo: user.email,
          avatar: {
            id_avatar: avatar?.sort_order ?? 1,
            nombre: avatar?.name ?? 'Güegüense',
            imagen: avatar?.image ?? 'gueguense.png',
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[usuarios POST]', err);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}

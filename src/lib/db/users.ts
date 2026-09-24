import { query, queryOne } from './client';

export interface DbUser {
  id: string;
  role_id: string;
  role: 'student' | 'teacher' | 'admin';
  institution_id: string | null;
  institution_name: string | null;
  avatar_id: string | null;
  avatar_sort: number | null;
  avatar_name: string | null;
  avatar_image: string | null;
  custom_avatar: string | null;
  nombre: string;
  apellido: string | null;
  email: string | null;
  password_hash: string | null;
  is_guest: boolean;
  status: string;
  birth_date: string | null;
  sex: string | null;
  last_login_at: string | null;
  created_at: string;
}

const USER_COLUMNS = `
  u.id, r.code AS role, u.role_id, u.institution_id, i.name AS institution_name,
  u.avatar_id, a.sort_order AS avatar_sort, a.name AS avatar_name, a.image AS avatar_image,
  u.custom_avatar, u.nombre, u.apellido, u.email, u.password_hash,
  u.is_guest, u.status, u.birth_date::text AS birth_date, u.sex,
  u.last_login_at::text AS last_login_at, u.created_at::text AS created_at
`;

const USER_FROM = `
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN institutions i ON i.id = u.institution_id
  LEFT JOIN avatars a ON a.id = u.avatar_id
`;

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT ${USER_COLUMNS} ${USER_FROM}
     WHERE lower(u.email) = lower($1) AND u.deleted_at IS NULL`,
    [email]
  );
}

export async function getUserById(id: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT ${USER_COLUMNS} ${USER_FROM} WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id]
  );
}

export async function createUser(input: {
  roleCode: 'student' | 'teacher' | 'admin';
  nombre: string;
  apellido?: string | null;
  email?: string | null;
  passwordHash?: string | null;
  avatarSort?: number | null;
  institutionName?: string | null;
  isGuest?: boolean;
  birthDate?: string | null;
  sex?: string | null;
}): Promise<DbUser> {
  const role = await queryOne<{ id: string }>(`SELECT id FROM roles WHERE code = $1`, [input.roleCode]);
  if (!role) throw new Error(`Rol no encontrado: ${input.roleCode}`);

  let institutionId: string | null = null;
  if (input.institutionName?.trim()) {
    const inst = await queryOne<{ id: string }>(
      `INSERT INTO institutions (name) VALUES ($1)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [input.institutionName.trim()]
    );
    if (inst) {
      institutionId = inst.id;
    } else {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM institutions WHERE lower(name) = lower($1) AND deleted_at IS NULL`,
        [input.institutionName.trim()]
      );
      institutionId = existing?.id ?? null;
    }
  }

  let avatarId: string | null = null;
  if (input.avatarSort != null) {
    const av = await queryOne<{ id: string }>(
      `SELECT id FROM avatars WHERE sort_order = $1 LIMIT 1`,
      [input.avatarSort]
    );
    avatarId = av?.id ?? null;
  }

  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO users (role_id, institution_id, avatar_id, nombre, apellido, email, password_hash, is_guest, birth_date, sex)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10)
     RETURNING id`,
    [
      role.id,
      institutionId,
      avatarId,
      input.nombre,
      input.apellido ?? null,
      input.email ?? null,
      input.passwordHash ?? null,
      input.isGuest ?? false,
      input.birthDate ?? null,
      input.sex ?? null,
    ]
  );
  if (!inserted) throw new Error('No se pudo crear el usuario');
  const created = await getUserById(inserted.id);
  if (!created) throw new Error('Usuario creado pero no encontrado');
  return created;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
}

export async function updateProfile(
  userId: string,
  patch: {
    nombre?: string;
    apellido?: string;
    avatarSort?: number;
    customAvatar?: string | null;
    passwordHash?: string;
    email?: string;
  }
): Promise<DbUser | null> {
  if (patch.avatarSort != null) {
    const av = await queryOne<{ id: string }>(`SELECT id FROM avatars WHERE sort_order = $1`, [patch.avatarSort]);
    await query(`UPDATE users SET avatar_id = $2 WHERE id = $1`, [userId, av?.id ?? null]);
  }
  if (patch.customAvatar !== undefined) {
    await query(`UPDATE users SET custom_avatar = $2 WHERE id = $1`, [userId, patch.customAvatar]);
  }
  if (patch.nombre !== undefined) {
    await query(`UPDATE users SET nombre = $2 WHERE id = $1`, [userId, patch.nombre]);
  }
  if (patch.apellido !== undefined) {
    await query(`UPDATE users SET apellido = $2 WHERE id = $1`, [userId, patch.apellido]);
  }
  if (patch.passwordHash !== undefined) {
    await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [userId, patch.passwordHash]);
  }
  if (patch.email !== undefined) {
    await query(`UPDATE users SET email = lower($2) WHERE id = $1`, [userId, patch.email]);
  }
  return getUserById(userId);
}

export async function listAvatars(): Promise<Array<{ id: string; sort_order: number; name: string; image: string }>> {
  return query(`SELECT id, sort_order, name, image FROM avatars WHERE active ORDER BY sort_order`);
}

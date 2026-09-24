import { randomBytes } from 'crypto';
import { getPool, query, queryOne } from './client';

export interface RoomRow {
  id: string;
  code: string;
  name: string | null;
  mode_code: string;
  mode_name: string | null;
  teacher_id: string;
  course_id: string;
  max_players: number | null;
  status: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  docente: string | null;
  curso: string | null;
}

export interface RoomParticipant {
  user_id: string;
  display_name: string;
  avatar_id: string | null;
  avatar_sort: number | null;
  avatar: string | null;
  stars: number;
  status: string;
}

const ROOM_SELECT = `
  SELECT r.id, r.code, r.name, gm.code AS mode_code, gm.name AS mode_name,
         r.teacher_id, r.course_id, r.max_players, r.status::text AS status,
         r.created_at::text AS created_at,
         r.started_at::text AS started_at, r.finished_at::text AS finished_at,
         tu.nombre AS docente, c.name AS curso
  FROM rooms r
  JOIN game_modes gm ON gm.id = r.game_mode_id
  LEFT JOIN users tu ON tu.id = r.teacher_id
  LEFT JOIN courses c ON c.id = r.course_id
`;

export function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function ensureSystemCourse(): Promise<string> {
  const mode = await queryOne<{ id: string }>(
    `SELECT id FROM game_modes ORDER BY sort_order LIMIT 1`
  );
  if (!mode) throw new Error('No hay game_modes sembrados');
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM courses WHERE lower(name) = 'partidas libres' AND deleted_at IS NULL LIMIT 1`
  );
  if (existing) return existing.id;
  const created = await queryOne<{ id: string }>(
    `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
     SELECT u.id, $1, 'Partidas libres', 'Sistema: salas de estudiantes', 'active'
     FROM users u
     WHERE u.is_guest = false AND u.deleted_at IS NULL
     ORDER BY u.created_at
     LIMIT 1
     RETURNING id`,
    [mode.id]
  );
  if (created) return created.id;
  const anyUser = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1`
  );
  if (!anyUser) throw new Error('No hay usuarios para el curso del sistema');
  const c = await queryOne<{ id: string }>(
    `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
     VALUES ($1, $2, 'Partidas libres', 'Sistema: salas de estudiantes', 'active')
     RETURNING id`,
    [anyUser.id, mode.id]
  );
  if (!c) throw new Error('No se pudo crear el curso del sistema');
  return c.id;
}

export async function getRoomByCode(code: string): Promise<RoomRow | null> {
  return queryOne<RoomRow>(`${ROOM_SELECT} WHERE upper(r.code) = upper($1) AND r.deleted_at IS NULL`, [code]);
}

export async function getRoomById(id: string): Promise<RoomRow | null> {
  return queryOne<RoomRow>(`${ROOM_SELECT} WHERE r.id = $1 AND r.deleted_at IS NULL`, [id]);
}

export async function listParticipants(roomId: string): Promise<RoomParticipant[]> {
  return query<RoomParticipant>(
    `SELECT rp.user_id, rp.display_name, rp.avatar_id, a.sort_order AS avatar_sort,
            coalesce(u.custom_avatar, nullif(concat('/images/avatares/', a.image), '/images/avatares/')) AS avatar,
            coalesce(plp.stars, 0)::int AS stars,
            rp.status::text AS status
     FROM room_participants rp
     LEFT JOIN users u ON u.id = rp.user_id
     LEFT JOIN avatars a ON a.id = coalesce(rp.avatar_id, u.avatar_id)
     LEFT JOIN player_league_progress plp ON plp.user_id = rp.user_id
     WHERE rp.room_id = $1 AND rp.left_at IS NULL
     ORDER BY rp.joined_at`,
    [roomId]
  );
}

export async function createRoom(input: {
  hostId: string;
  name: string;
  modeCode: string;
  maxPlayers?: number;
  courseId?: string;
}): Promise<RoomRow> {
  const mode = await queryOne<{ id: string }>(`SELECT id FROM game_modes WHERE code = $1`, [input.modeCode]);
  if (!mode) throw new Error(`Modo no encontrado: ${input.modeCode}`);

  const courseId = input.courseId ?? (await ensureSystemCourse());
  const name = String(input.name ?? '').trim().slice(0, 120) || 'Sala';
  const maxPlayers =
    input.maxPlayers != null && Number.isFinite(input.maxPlayers)
      ? Math.min(50, Math.max(1, Math.trunc(input.maxPlayers)))
      : 8;

  const user = await queryOne<{ nombre: string; apellido: string | null }>(
    `SELECT nombre, apellido FROM users WHERE id = $1`,
    [input.hostId]
  );
  const displayName = user
    ? `${user.nombre}${user.apellido ? ' ' + user.apellido : ''}`
    : 'Host';

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const room = await client.query<{ id: string }>(
        `INSERT INTO rooms (teacher_id, course_id, game_mode_id, name, code, max_players, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'waiting')
         RETURNING id`,
        [input.hostId, courseId, mode.id, name, code, maxPlayers]
      );
      const roomId = room.rows[0]?.id;
      if (!roomId) throw new Error('No se pudo crear la sala');
      await client.query(
        `INSERT INTO room_participants (room_id, user_id, display_name, status)
         VALUES ($1, $2, $3, 'waiting')`,
        [roomId, input.hostId, displayName]
      );
      await client.query('COMMIT');
      const full = await queryOne<RoomRow>(`${ROOM_SELECT} WHERE r.id = $1`, [roomId]);
      if (!full) throw new Error('Sala no encontrada tras crear');
      return full;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      const code = (err as { code?: string }).code;
      if (code === '23505') {
        lastErr = err;
        continue;
      }
      throw err;
    } finally {
      client.release();
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error('No se pudo generar un código de sala único');
}

export async function joinRoom(roomId: string, userId: string): Promise<{ joined: boolean; reason?: string }> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const roomRes = await client.query<{
      id: string;
      status: string;
      max_players: number | null;
      deleted_at: string | null;
    }>(
      `SELECT id, status::text AS status, max_players, deleted_at::text AS deleted_at
       FROM rooms WHERE id = $1 FOR UPDATE`,
      [roomId]
    );
    const room = roomRes.rows[0];
    if (!room || room.deleted_at) {
      await client.query('ROLLBACK');
      return { joined: false, reason: 'Sala no encontrada' };
    }

    if (room.status !== 'waiting') {
      await client.query('ROLLBACK');
      const reason =
        room.status === 'finished' || room.status === 'archived'
          ? 'La sala ya finalizó'
          : 'La sala ya inició';
      return { joined: false, reason };
    }

    const existing = await client.query(
      `SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [roomId, userId]
    );
    if (existing.rowCount) {
      await client.query('COMMIT');
      return { joined: true };
    }

    if (room.max_players != null) {
      const countRes = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM room_participants WHERE room_id = $1 AND left_at IS NULL`,
        [roomId]
      );
      if ((countRes.rows[0]?.n ?? 0) >= room.max_players) {
        await client.query('ROLLBACK');
        return { joined: false, reason: 'Sala llena' };
      }
    }

    const user = await client.query<{ nombre: string; apellido: string | null; avatar_id: string | null }>(
      `SELECT nombre, apellido, avatar_id FROM users WHERE id = $1`,
      [userId]
    );
    const u = user.rows[0];
    const displayName = u ? `${u.nombre}${u.apellido ? ' ' + u.apellido : ''}` : 'Jugador';

    await client.query(
      `INSERT INTO room_participants (room_id, user_id, display_name, avatar_id, status)
       VALUES ($1, $2, $3, $4, 'waiting')
       ON CONFLICT (room_id, user_id) DO UPDATE SET left_at = NULL, display_name = EXCLUDED.display_name`,
      [roomId, userId, displayName, u?.avatar_id ?? null]
    );
    await client.query('COMMIT');
    return { joined: true };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function leaveRoom(roomId: string, userId: string): Promise<boolean> {
  const result = await query(
    `UPDATE room_participants SET left_at = now()
     WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
     RETURNING room_id`,
    [roomId, userId]
  );
  return result.length > 0;
}

export async function startRoom(
  roomId: string,
  actorId: string,
  opts?: { isAdmin?: boolean }
): Promise<{ ok: boolean; reason?: 'not_found' | 'forbidden' | 'bad_status' }> {
  const result = await query(
    `UPDATE rooms SET status = 'in_progress', started_at = now()
     WHERE id = $1
       AND deleted_at IS NULL
       AND status = 'waiting'
       AND (teacher_id = $2 OR $3::boolean)
     RETURNING id, status::text AS status`,
    [roomId, actorId, opts?.isAdmin === true]
  );
  if (result.length > 0) return { ok: true };

  const room = await getRoomById(roomId);
  if (!room) return { ok: false, reason: 'not_found' };
  if (!opts?.isAdmin && room.teacher_id !== actorId) return { ok: false, reason: 'forbidden' };
  return { ok: false, reason: 'bad_status' };
}

export async function finishRoom(
  roomId: string,
  actorId: string,
  opts?: { isAdmin?: boolean }
): Promise<{
  ok: boolean;
  reason?: 'not_found' | 'forbidden' | 'bad_status';
  ranking?: Array<{ user_id: string; display_name: string }>;
}> {
  const result = await query<{ id: string }>(
    `UPDATE rooms SET status = 'finished', finished_at = coalesce(finished_at, now())
     WHERE id = $1
       AND deleted_at IS NULL
       AND status IN ('waiting', 'in_progress')
       AND (teacher_id = $2 OR $3::boolean)
     RETURNING id`,
    [roomId, actorId, opts?.isAdmin === true]
  );
  if (result.length === 0) {
    const room = await getRoomById(roomId);
    if (!room) return { ok: false, reason: 'not_found' };
    if (!opts?.isAdmin && room.teacher_id !== actorId) return { ok: false, reason: 'forbidden' };
    return { ok: false, reason: 'bad_status' };
  }

  const ranking = await query<{ user_id: string; display_name: string }>(
    `SELECT user_id, display_name FROM room_participants WHERE room_id = $1 AND left_at IS NULL ORDER BY joined_at`,
    [roomId]
  );
  return { ok: true, ranking };
}

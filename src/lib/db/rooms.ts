import { randomBytes } from 'crypto';
import { query, queryOne } from './client';

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
  if (!created) {
    // No registered users yet: use any user (guest)
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
  return created.id;
}

async function findFreeRoomCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateRoomCode();
    const clash = await queryOne(
      `SELECT 1 FROM rooms WHERE upper(code) = $1 AND deleted_at IS NULL`,
      [code]
    );
    if (!clash) return code;
  }
  throw new Error('No se pudo generar un código de sala único');
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
  const code = await findFreeRoomCode();
  const displayName = await queryOne<{ nombre: string }>(
    `SELECT nombre FROM users WHERE id = $1`,
    [input.hostId]
  );

  const room = await queryOne<{ id: string }>(
    `INSERT INTO rooms (teacher_id, course_id, game_mode_id, name, code, max_players, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'waiting')
     RETURNING id`,
    [input.hostId, courseId, mode.id, input.name, code, input.maxPlayers ?? 8]
  );
  if (!room) throw new Error('No se pudo crear la sala');

  await query(
    `INSERT INTO room_participants (room_id, user_id, display_name, status)
     VALUES ($1, $2, $3, 'waiting')`,
    [room.id, input.hostId, displayName?.nombre ?? 'Host']
  );

  const full = await queryOne<RoomRow>(`${ROOM_SELECT} WHERE r.id = $1`, [room.id]);
  if (!full) throw new Error('Sala no encontrada tras crear');
  return full;
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

export async function joinRoom(roomId: string, userId: string): Promise<{ joined: boolean; reason?: string }> {
  const room = await getRoomById(roomId);
  if (!room) return { joined: false, reason: 'Sala no encontrada' };

  const existing = await queryOne(
    `SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [roomId, userId]
  );
  if (existing) return { joined: true };

  if (room.status !== 'waiting') return { joined: false, reason: 'La sala ya inició' };

  if (room.max_players != null) {
    const countRow = await queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM room_participants WHERE room_id = $1 AND left_at IS NULL`,
      [roomId]
    );
    if ((countRow?.n ?? 0) >= room.max_players) {
      return { joined: false, reason: 'Sala llena' };
    }
  }

  const user = await queryOne<{ nombre: string; apellido: string | null; avatar_id: string | null }>(
    `SELECT nombre, apellido, avatar_id FROM users WHERE id = $1`,
    [userId]
  );
  const displayName = user ? `${user.nombre}${user.apellido ? ' ' + user.apellido : ''}` : 'Jugador';

  await query(
    `INSERT INTO room_participants (room_id, user_id, display_name, avatar_id, status)
     VALUES ($1, $2, $3, $4, 'waiting')
     ON CONFLICT (room_id, user_id) DO UPDATE SET left_at = NULL, display_name = EXCLUDED.display_name`,
    [roomId, userId, displayName, user?.avatar_id ?? null]
  );
  return { joined: true };
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

export async function startRoom(roomId: string, hostId: string): Promise<boolean> {
  const result = await query(
    `UPDATE rooms SET status = 'in_progress', started_at = now()
     WHERE id = $1 AND teacher_id = $2 AND status = 'waiting' AND deleted_at IS NULL
     RETURNING id`,
    [roomId, hostId]
  );
  return result.length > 0;
}

export async function finishRoom(roomId: string, hostId: string): Promise<{ ok: boolean; ranking?: Array<{ user_id: string; display_name: string }> }> {
  const room = await getRoomById(roomId);
  if (!room) return { ok: false };
  if (room.teacher_id !== hostId) return { ok: false };

  await query(
    `UPDATE rooms SET status = 'finished', finished_at = now() WHERE id = $1`,
    [roomId]
  );

  const ranking = await query<{ user_id: string; display_name: string }>(
    `SELECT user_id, display_name FROM room_participants WHERE room_id = $1 AND left_at IS NULL ORDER BY joined_at`,
    [roomId]
  );
  return { ok: true, ranking };
}

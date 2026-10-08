import { randomInt } from 'crypto';
import { getPool, query, queryOne } from './client';
import { generateRoomCode, getRoomById, joinRoom, type RoomRow } from './rooms';
import { GAME_ROUTES } from '../rooms';
import { drawChaosModifiers, normalizeChaosModifiers, type ChaosModifierId } from '../chaos/modifiers';

/**
 * Modo Caos — datos de sala (ETAPA 1).
 *
 * Una sala Caos nace con:
 *  1. un curso sintético propio (`Caos <codigo>`): questions exige exactamente
 *     un dueño (course_id XOR practice_id) y participant_answers referencia a
 *     questions, así que cada sala necesita su banco de preguntas;
 *  2. la fila `chaos_rooms` con la dificultad pedida, el juego sorteado
 *     server-side y el estado de la generación de preguntas;
 *  3. al creador como primer participante (el host se resuelve por
 *     room.teacher_id, igual que en las salas docentes).
 *
 * La generación de preguntas (IA Gemini + fallback al banco local) corre en
 * background vía src/lib/chaos/generator.ts; aquí solo se persiste el estado.
 */

export const CHAOS_DIFFICULTIES = ['facil', 'medio', 'dificil', 'experto', 'caos'] as const;
export type ChaosDifficulty = (typeof CHAOS_DIFFICULTIES)[number];

/** Los 4 juegos con ruta propia (fuente única: src/lib/rooms.ts). */
export const CHAOS_GAME_CODES = Object.keys(GAME_ROUTES);

export interface ChaosRoomRow {
  room_id: string;
  difficulty: string;
  tema: string | null;
  generation_status: string;
  question_count: number;
  game_code: string;
  modifiers: ChaosModifierId[];
}

export function isChaosDifficulty(raw: unknown): raw is ChaosDifficulty {
  return typeof raw === 'string' && (CHAOS_DIFFICULTIES as readonly string[]).includes(raw);
}

export async function getChaosRoom(roomId: string): Promise<ChaosRoomRow | null> {
  const row = await queryOne<ChaosRoomRow & { modifiers: unknown }>(
    `SELECT room_id, difficulty, tema, generation_status::text AS generation_status,
            question_count, game_code, modifiers
     FROM chaos_rooms WHERE room_id = $1`,
    [roomId]
  );
  return row ? { ...row, modifiers: normalizeChaosModifiers(row.modifiers) } : null;
}

export async function createChaosRoom(input: {
  hostId: string;
  difficulty: ChaosDifficulty;
  maxPlayers?: number;
}): Promise<{ room: RoomRow; chaos: ChaosRoomRow }> {
  const modes = await query<{ id: string; code: string }>(`SELECT id, code FROM game_modes`);
  if (modes.length === 0) throw new Error('No hay game_modes sembrados');

  const maxPlayers =
    input.maxPlayers != null && Number.isFinite(input.maxPlayers)
      ? Math.min(50, Math.max(1, Math.trunc(input.maxPlayers)))
      : 8;

  let roomId: string | null = null;
  let lastErr: unknown = null;

  // Sorteo de modificadores: UNA sola vez por creación (los reintentos por
  // colisión de código reutilizan el mismo sorteo, y los reintentos de la
  // generación IA —que corren después, en generator.ts— nunca lo tocan).
  const modifiers = drawChaosModifiers();

  for (let attempt = 0; attempt < 8 && !roomId; attempt++) {
    // Sorteo del juego en el servidor (crypto.randomInt): nunca en el cliente.
    const gameCode = CHAOS_GAME_CODES[randomInt(CHAOS_GAME_CODES.length)];
    const mode = modes.find((m) => m.code === gameCode);
    if (!mode) throw new Error(`Modo no encontrado: ${gameCode}`);

    const code = generateRoomCode();
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      // Curso sintético del juego sorteado (nombre único gracias al código).
      const course = await client.query<{ id: string }>(
        `INSERT INTO courses (teacher_id, game_mode_id, name, description, status)
         VALUES ($1, $2, $3, 'Sistema: Modo Caos', 'active')
         RETURNING id`,
        [input.hostId, mode.id, `Caos ${code}`]
      );
      const courseId = course.rows[0]?.id;
      if (!courseId) throw new Error('No se pudo crear el curso de la sala Caos');

      const room = await client.query<{ id: string }>(
        `INSERT INTO rooms (teacher_id, course_id, game_mode_id, name, code, max_players, status, kind)
         VALUES ($1, $2, $3, $4, $5, $6, 'waiting', 'caos')
         RETURNING id`,
        [input.hostId, courseId, mode.id, 'Modo Caos', code, maxPlayers]
      );
      const createdId = room.rows[0]?.id;
      if (!createdId) throw new Error('No se pudo crear la sala Caos');

      await client.query(
        `INSERT INTO chaos_rooms (room_id, difficulty, game_code, modifiers)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [createdId, input.difficulty, gameCode, JSON.stringify(modifiers)]
      );
      await client.query('COMMIT');
      roomId = createdId;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      const code = (err as { code?: string }).code;
      if (code === '23505') {
        // Choque de código de sala o de nombre de curso: reintenta con otro.
        lastErr = err;
        continue;
      }
      throw err;
    } finally {
      client.release();
    }
  }

  if (!roomId) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error('No se pudo generar un código de sala Caos único');
  }

  // El creador entra como primer jugador (el botón Iniciar requiere ≥2).
  await joinRoom(roomId, input.hostId);

  const room = await getRoomById(roomId);
  if (!room) throw new Error('Sala no encontrada tras crear');
  const chaos = await getChaosRoom(roomId);
  if (!chaos) throw new Error('Configuración Caos no encontrada tras crear');
  return { room, chaos };
}

/**
 * Marca la partida activa de la sala como Caos (enlace + copia de los
 * modificadores sorteados al crear la sala).
 * Se llama después de startRoom/ensureActiveMatch.
 *
 * Copia EXACTA (mismo orden) de chaos_rooms.modifiers a matches.modifiers en
 * UN solo statement: atómica con el enlace y sin volver a sortear. COALESCE
 * protege el NOT NULL si la fila de configuración faltase (nunca esperado en
 * salas Caos). Las salas docentes no llaman esta función: su matches.modifiers
 * queda en el default '[]'.
 */
export async function attachChaosToMatch(roomId: string): Promise<void> {
  await query(
    `UPDATE matches
        SET chaos_room_id = $1,
            modifiers = COALESCE(
              (SELECT cm.modifiers FROM chaos_rooms cm WHERE cm.room_id = $1),
              '[]'::jsonb
            )
      WHERE id = (
        SELECT id FROM matches
        WHERE room_id = $1 AND status = 'in_progress'
        ORDER BY created_at DESC LIMIT 1
      )`,
    [roomId]
  );
}

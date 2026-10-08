import { NextRequest, NextResponse } from 'next/server';
import { getSessionCandidates, ensureLeagueProgress, ensureActiveMatch, type SessionUser } from '@/lib/db';
import { getRoomById, listParticipants, startRoom } from '@/lib/db/rooms';
import {
  attachChaosToMatch,
  createChaosRoom,
  getChaosRoom,
  isChaosDifficulty,
  CHAOS_DIFFICULTIES,
} from '@/lib/db/chaos';
import { ensureChaosGeneration, maybeRetryStaleGeneration } from '@/lib/chaos/generator';

export const dynamic = 'force-dynamic';

/**
 * Modo Caos — ETAPA 1.
 * POST { action: 'create' | 'start' | 'status' }.
 *
 * create: cualquier cuenta NO invitada crea una sala Caos (no requiere rol
 *   docente): sortea el juego en el servidor, crea el curso sintético + fila
 *   chaos_rooms en 'pending' y dispara la generación de preguntas en
 *   background. Devuelve SOLO metadatos (nunca preguntas ni opciones).
 * start: solo el anfitrión (room.teacher_id), con preguntas 'ready', sala en
 *   'waiting' y ≥2 participantes activos; reutiliza startRoom +
 *   ensureActiveMatch de las salas docentes y enlaza la partida (chaos_room_id).
 * status: polling del lobby (metadatos + reintento si la generación quedó
 *   colgada por un crash).
 */

function pickActor(candidates: SessionUser[]): SessionUser | null {
  return candidates.find((c) => !c.is_guest) ?? null;
}

function parseMaxPlayers(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 50) return null;
  return n;
}

export async function POST(req: NextRequest) {
  try {
    const candidates = await getSessionCandidates(req);
    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    if (action === 'create') {
      const session = pickActor(candidates);
      if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const difficulty = body.difficulty ?? 'media';
      if (!isChaosDifficulty(difficulty)) {
        return NextResponse.json(
          { error: `Dificultad inválida. Usa una de: ${CHAOS_DIFFICULTIES.join(', ')}` },
          { status: 400 }
        );
      }
      const maxPlayers = parseMaxPlayers(body.max_players);
      if (body.max_players != null && body.max_players !== '' && maxPlayers == null) {
        return NextResponse.json({ error: 'max_players debe ser un entero entre 1 y 50' }, { status: 400 });
      }

      await ensureLeagueProgress(session.id);
      const { room, chaos } = await createChaosRoom({
        hostId: session.id,
        difficulty,
        maxPlayers: maxPlayers ?? 8,
      });

      // Generación en background: la respuesta no espera a Gemini (puede tardar
      // hasta ~90s); el lobby observa generation_status vía /api/salas.
      void ensureChaosGeneration(room.id).catch((err) =>
        console.error('[caos create] generación fallida', err)
      );

      return NextResponse.json({ sala: room, caos: chaos }, { status: 201 });
    }

    if (action === 'start') {
      const session = pickActor(candidates);
      if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const roomId = String(body.room_id ?? '');
      if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });

      const room = await getRoomById(roomId);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
      if (room.kind !== 'caos') {
        return NextResponse.json({ error: 'Este endpoint es solo para salas Modo Caos' }, { status: 400 });
      }
      if (room.teacher_id !== session.id) {
        return NextResponse.json({ error: 'Solo el anfitrión puede iniciar la partida' }, { status: 403 });
      }

      const chaos = await getChaosRoom(room.id);
      if (!chaos) return NextResponse.json({ error: 'Configuración Caos no encontrada' }, { status: 404 });
      if (chaos.generation_status !== 'ready') {
        const msg =
          chaos.generation_status === 'failed'
            ? 'No se pudieron generar las preguntas de esta sala'
            : 'Las preguntas aún se están generando';
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      if (room.status !== 'waiting') {
        return NextResponse.json({ error: 'La sala no está esperando jugadores' }, { status: 409 });
      }

      const participantes = await listParticipants(room.id);
      if (participantes.length < 2) {
        return NextResponse.json({ error: 'Se necesitan mínimo 2 jugadores' }, { status: 400 });
      }

      const result = await startRoom(room.id, session.id);
      if (!result.ok) {
        if (result.reason === 'bad_status') {
          return NextResponse.json({ error: 'La sala no está esperando jugadores' }, { status: 409 });
        }
        return NextResponse.json({ error: 'No se pudo iniciar' }, { status: 403 });
      }
      const match = await ensureActiveMatch(room.id, session.id);
      if (!match) {
        return NextResponse.json({ error: 'No se pudo crear la partida' }, { status: 500 });
      }
      await attachChaosToMatch(room.id);

      return NextResponse.json({
        ok: true,
        partida: { id: match.id, question_count: match.question_count },
        caos: chaos,
      });
    }

    if (action === 'status') {
      const session = candidates[0];
      const roomId = String(body.room_id ?? '');
      if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });

      const room = await getRoomById(roomId);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
      if (room.kind !== 'caos') {
        return NextResponse.json({ error: 'Este endpoint es solo para salas Modo Caos' }, { status: 400 });
      }
      const participantes = await listParticipants(room.id);
      const autorizado =
        room.teacher_id === session.id || participantes.some((p) => p.user_id === session.id);
      if (!autorizado) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // Recuperación: si la generación quedó colgada por un crash, reintenta.
      await maybeRetryStaleGeneration(room.id);
      const chaos = await getChaosRoom(room.id);
      if (!chaos) return NextResponse.json({ error: 'Configuración Caos no encontrada' }, { status: 404 });

      return NextResponse.json({
        caos: chaos,
        estado: room.status,
        jugadores: participantes.length,
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[caos POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

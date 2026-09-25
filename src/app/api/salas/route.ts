import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, ensureLeagueProgress, queryOne, ensureActiveMatch } from '@/lib/db';
import {
  createRoom,
  getRoomByCode,
  getRoomById,
  listParticipants,
  joinRoom,
  leaveRoom,
  startRoom,
} from '@/lib/db/rooms';
import { finalizeMatch } from '@/lib/db/matches';

export const dynamic = 'force-dynamic';

const MAX_NAME = 120;

function parseMaxPlayers(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 50) return null;
  return n;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    const joinParam = searchParams.get('join');
    const shouldJoin = joinParam !== '0';

    const room = code ? await getRoomByCode(code) : id ? await getRoomById(id) : null;
    if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });

    const participantes = await listParticipants(room.id);
    const soyParticipante = participantes.some((p) => p.user_id === session.id);
    const soyHost = room.teacher_id === session.id;
    const esStaff = session.role === 'teacher' || session.role === 'admin';

    // Entrada por código: auto-join solo en la carga inicial (join != '0').
    if (code && shouldJoin && !soyParticipante) {
      if (room.status !== 'waiting') {
        const msg =
          room.status === 'finished' || room.status === 'archived'
            ? 'La sala ya finalizó'
            : 'La sala no está disponible';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const join = await joinRoom(room.id, session.id);
      if (!join.joined) {
        return NextResponse.json({ error: join.reason ?? 'No se pudo unir' }, { status: 400 });
      }
      const lista = await listParticipants(room.id);
      return NextResponse.json({
        sala: room,
        participantes: lista,
        usuario_id: session.id,
        es_host: soyHost,
      });
    }

    // Sin code: solo participantes, host o staff dueño pueden ver la sala.
    if (!code) {
      const allowed =
        soyParticipante ||
        soyHost ||
        (esStaff && (session.role === 'admin' || room.teacher_id === session.id));
      if (!allowed) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (!soyParticipante && !soyHost && room.status !== 'waiting' && room.status !== 'in_progress') {
        return NextResponse.json({ error: 'La sala no está disponible' }, { status: 400 });
      }
    }

    // Poll por código de un no-participante en sala cerrada → no disponible.
    if (code && !soyParticipante && !soyHost && room.status !== 'waiting' && room.status !== 'in_progress') {
      return NextResponse.json({ error: 'La sala no está disponible' }, { status: 400 });
    }

    return NextResponse.json({
      sala: room,
      participantes,
      usuario_id: session.id,
      es_host: soyHost,
    });
  } catch (err) {
    console.error('[salas GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const action = String(body.action ?? 'create');
    const esStaff = session.role === 'teacher' || session.role === 'admin';

    if (action === 'create') {
      if (!esStaff) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      await ensureLeagueProgress(session.id);

      const name = String(body.name ?? '').trim().slice(0, MAX_NAME) || `Sala de ${session.nombre}`;
      const modeCode = String(body.mode ?? body.mode_code ?? 'decisiones').trim();
      const maxPlayers = parseMaxPlayers(body.max_players);
      if (body.max_players != null && body.max_players !== '' && maxPlayers == null) {
        return NextResponse.json({ error: 'max_players debe ser un entero entre 1 y 50' }, { status: 400 });
      }

      let courseId: string | undefined;
      if (body.course_id) {
        courseId = String(body.course_id);
        const course = await queryOne<{ id: string; teacher_id: string }>(
          `SELECT id, teacher_id FROM courses WHERE id = $1 AND deleted_at IS NULL`,
          [courseId]
        );
        if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
          return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
        }
      }

      const room = await createRoom({
        hostId: session.id,
        name,
        modeCode,
        maxPlayers: maxPlayers ?? 8,
        courseId,
      });
      return NextResponse.json({ sala: room }, { status: 201 });
    }

    if (action === 'join') {
      const code = String(body.code ?? '').trim();
      if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
      const room = await getRoomByCode(code);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
      const result = await joinRoom(room.id, session.id);
      if (!result.joined) {
        return NextResponse.json({ error: result.reason ?? 'No se pudo unir' }, { status: 400 });
      }
      const participantes = await listParticipants(room.id);
      return NextResponse.json({ sala: room, participantes });
    }

    if (action === 'leave') {
      const roomId = String(body.room_id ?? '');
      if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });
      const ok = await leaveRoom(roomId, session.id);
      return NextResponse.json({ ok });
    }

    if (action === 'start') {
      const roomId = String(body.room_id ?? '');
      if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });
      if (!esStaff) {
        return NextResponse.json({ error: 'Solo el docente puede iniciar la sala' }, { status: 403 });
      }
      const room = await getRoomById(roomId);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
      if (session.role !== 'admin' && room.teacher_id !== session.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const result = await startRoom(roomId, session.id, { isAdmin: session.role === 'admin' });
      if (!result.ok) {
        if (result.reason === 'bad_status') {
          return NextResponse.json({ error: 'La sala no está esperando jugadores' }, { status: 409 });
        }
        return NextResponse.json({ error: 'No se pudo iniciar' }, { status: 403 });
      }
      // Paso 4: la partida (match) se crea al iniciar, junto a sus participantes.
      const match = await ensureActiveMatch(roomId, session.id);
      return NextResponse.json({ ok: true, partida: match ? { id: match.id, question_count: match.question_count } : null });
    }

    if (action === 'finish') {
      const roomId = String(body.room_id ?? '');
      if (!roomId) return NextResponse.json({ error: 'room_id requerido' }, { status: 400 });
      if (!esStaff) {
        return NextResponse.json({ error: 'Solo el docente puede finalizar la sala' }, { status: 403 });
      }
      const room = await getRoomById(roomId);
      if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
      if (session.role !== 'admin' && room.teacher_id !== session.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      // Paso 5/7: finalización definitiva en una sola transacción
      // (sala + match + participantes + estrellas de liga + auditoría).
      const result = await finalizeMatch(roomId, session.id, { isAdmin: session.role === 'admin' });
      if (!result.ok) {
        if (result.reason === 'bad_status') {
          return NextResponse.json({ error: 'La sala ya finalizó' }, { status: 409 });
        }
        if (result.reason === 'not_found') {
          return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
        }
        return NextResponse.json({ error: 'No se pudo finalizar' }, { status: 403 });
      }

      const myAward = result.awarded.find((a) => a.user_id === session.id);
      return NextResponse.json({ ok: true, estrellas: myAward?.stars ?? 0 });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[salas POST]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

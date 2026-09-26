import { NextRequest } from 'next/server';
import { getSessionUser, getRoomById, listParticipants } from '@/lib/db';
import { currentRoomSeq, subscribeRoom, type RoomEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 15000;

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Canal SSE de una sala (Paso 11).
 *
 * - Auth por sesión (cookie httpOnly) y authz por dueño/admin o participante.
 * - Solo comunica TIPOS de evento (room:* o match:*) con seq; el cliente
 *   refresca el estado por las APIs existentes → PostgreSQL es la fuente
 *   de verdad y los eventos son idempotentes.
 * - Al conectar emite `sync` para que el cliente recupere su estado.
 * - Heartbeat + limpieza por abort para liberar recursos al desconectar.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session) return jsonError('No autenticado', 401);

    const room = await getRoomById(params.id);
    if (!room) return jsonError('Sala no encontrada', 404);

    const participantes = await listParticipants(room.id);
    const soyParticipante = participantes.some((p) => p.user_id === session.id);
    const soyHost = room.teacher_id === session.id;
    const autorizado = soyParticipante || soyHost || session.role === 'admin';
    if (!autorizado) return jsonError('No autorizado', 403);

    const encoder = new TextEncoder();
    let closed = false;
    const cleanups: Array<() => void> = [];

    const cleanup = () => {
      if (closed) return;
      closed = true;
      while (cleanups.length > 0) {
        const fn = cleanups.pop();
        try {
          fn?.();
        } catch {
          /* best-effort */
        }
      }
    };

    const stream = new ReadableStream({
      start(controller) {
        const safe = (fn: () => void) => {
          if (closed) return;
          try {
            fn();
          } catch {
            // Escritura sobre stream cerrado/cancelado: se cierra y sigue.
            cleanup();
          }
        };
        const send = (payload: object) =>
          safe(() => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)));

        // Recuperación de estado inmediata + reintento automático del cliente.
        safe(() => controller.enqueue(encoder.encode('retry: 3000\n')));
        send({ type: 'sync', roomId: room.id, seq: currentRoomSeq(), at: new Date().toISOString() });

        cleanups.push(subscribeRoom(room.id, (event: RoomEvent) => send(event)));

        const heartbeat = setInterval(() => {
          safe(() => controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`)));
        }, HEARTBEAT_MS);
        cleanups.push(() => clearInterval(heartbeat));

        cleanups.push(() => {
          try {
            controller.close();
          } catch {
            /* ya cerrado */
          }
        });

        const onAbort = () => cleanup();
        if (req.signal) {
          if (req.signal.aborted) onAbort();
          else {
            req.signal.addEventListener('abort', onAbort);
            cleanups.push(() => req.signal.removeEventListener('abort', onAbort));
          }
        }
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[salas/events]', err);
    return jsonError('Error', 500);
  }
}

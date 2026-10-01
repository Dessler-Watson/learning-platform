'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomEvents, type RoomRealtimeEvent } from '@/shared/hooks/useRoomEvents';
import { markRoomFinished } from '@/lib/partida-client';

/**
 * Detecta que el docente finalizó la sala mientras se está jugando.
 *
 * La autoridad es el backend (PostgreSQL): el evento SSE sólo señala que algo
 * cambió y este hook relee `GET /api/salas?id=` antes de darlo por hecho
 * (mismo contrato "señal + relectura" que documenta `useRoomEvents`).
 *
 * - SSE (`room:finished` / `match:finished` / `sync`): relectura inmediata.
 * - Polling de respaldo (4 s) SOLO mientras el canal SSE no esté conectado.
 * - Idempotente: una vez confirmado no se vuelve a consultar; además llama a
 *   `markRoomFinished()` para que `submitMatchAnswer` deje de enviar respuestas.
 */
export function useRoomFinished(roomId: string | null | undefined): boolean {
  const [finished, setFinished] = useState(false);
  const doneRef = useRef(false);
  const connectedRef = useRef(false);

  const check = useCallback(async () => {
    if (doneRef.current || !roomId) return;
    try {
      const res = await fetch(`/api/salas?id=${encodeURIComponent(roomId)}&join=0`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const status = data?.sala?.status as string | undefined;
      if (status === 'finished' || status === 'archived') {
        doneRef.current = true;
        markRoomFinished();
        setFinished(true);
      }
    } catch {
      // Sin red: lo retoma el polling de respaldo.
    }
  }, [roomId]);

  const connected = useRoomEvents(roomId ?? null, (ev: RoomRealtimeEvent) => {
    if (ev.type === 'room:finished' || ev.type === 'match:finished' || ev.type === 'sync') {
      void check();
    }
  });

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    if (!roomId) return;
    void check();
    const t = window.setInterval(() => {
      if (!doneRef.current && !connectedRef.current) void check();
    }, 4000);
    return () => window.clearInterval(t);
  }, [roomId, check]);

  return finished;
}

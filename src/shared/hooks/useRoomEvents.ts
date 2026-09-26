'use client';

import { useEffect, useRef, useState } from 'react';

export interface RoomRealtimeEvent {
  type: string;
  roomId?: string;
  seq?: number;
  at?: string;
}

/**
 * Suscribe la sala a los eventos SSE del Paso 11.
 *
 * - Devuelve `true` cuando el canal está conectado (para que la pantalla
 *   pueda bajar la frecuencia del polling de respaldo).
 * - El evento solo indica el tipo de cambio: el llamador vuelve a leer el
 *   estado por la API existente (PostgreSQL = fuente de verdad).
 * - Si el canal falla, EventSource reintenta solo; si no llega a abrirse,
 *   el polling de respaldo de la pantalla sigue actualizando con la
 *   frecuencia normal.
 */
export function useRoomEvents(
  roomId: string | null | undefined,
  onEvent: (event: RoomRealtimeEvent) => void
): boolean {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;
  const lastSeqRef = useRef(-1);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId || typeof EventSource === 'undefined') return;
    let source: EventSource;
    try {
      source = new EventSource(`/api/salas/${encodeURIComponent(roomId)}/events`);
    } catch {
      return;
    }

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as RoomRealtimeEvent;
        if (!data || typeof data.type !== 'string') return;
        if (typeof data.seq === 'number') {
          // Sin duplicados: un seq ya visto no se vuelve a procesar
          // (el `sync` de reconexión siempre pasa para recuperar estado).
          if (data.type !== 'sync' && data.seq <= lastSeqRef.current) return;
          if (data.seq > lastSeqRef.current) lastSeqRef.current = data.seq;
        }
        cbRef.current(data);
      } catch {
        /* payload inválido: se ignora */
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [roomId]);

  return connected;
}

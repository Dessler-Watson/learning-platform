import { EventEmitter } from 'events';

// Bus de eventos en proceso para tiempo real (Paso 11).
// Los eventos solo SEÑALAN que hubo un cambio: el cliente vuelve a leer el
// estado por las APIs existentes, de modo que PostgreSQL sigue siendo la
// única fuente de verdad y los eventos son idempotentes (sin payloads de
// negocio, sin riesgo de duplicar estado).
//
// Se guarda en globalThis para sobrevivir a la reevaluación de módulos en
// desarrollo (HMR) sin crear emisores ni contadores duplicados.
// Limitación documentada: en despliegues multi-instancia el bus solo cubre
// la instancia que atiende la petición; el polling de respaldo sigue
// cubriendo el resto (ver reporte del Paso 11).

export type RoomEventType =
  | 'room:updated'
  | 'room:started'
  | 'room:finished'
  | 'match:started'
  | 'match:progress'
  | 'match:finished';

export interface RoomEvent {
  type: RoomEventType;
  roomId: string;
  seq: number;
  at: string;
}

interface RealtimeState {
  bus: EventEmitter;
  seq: number;
}

const STATE_KEY = '__eduplay_realtime_bus__';

function state(): RealtimeState {
  const g = globalThis as unknown as Record<string, unknown>;
  let s = g[STATE_KEY] as RealtimeState | undefined;
  if (!s) {
    s = { bus: new EventEmitter(), seq: 0 };
    s.bus.setMaxListeners(500);
    g[STATE_KEY] = s;
  }
  return s;
}

/** Seq global actual (para enviarlo como evento `sync` al conectar). */
export function currentRoomSeq(): number {
  return state().seq;
}

/**
 * Publica un evento de sala/partida. Nunca lanza: una falla del canal no
 * debe romper la operación de negocio que acaba de persistir.
 */
export function publishRoomEvent(type: RoomEventType, roomId: string): RoomEvent | null {
  try {
    const s = state();
    s.seq += 1;
    const event: RoomEvent = { type, roomId, seq: s.seq, at: new Date().toISOString() };
    s.bus.emit('room', event);
    return event;
  } catch {
    // El canal nunca debe romper la operación de negocio que persistió.
    return null;
  }
}

/** Suscribe a los eventos de una sala. Devuelve la función de baja. */
export function subscribeRoom(roomId: string, listener: (event: RoomEvent) => void): () => void {
  const s = state();
  const wrapped = (event: RoomEvent) => {
    if (event.roomId === roomId) listener(event);
  };
  s.bus.on('room', wrapped);
  return () => {
    s.bus.off('room', wrapped);
  };
}

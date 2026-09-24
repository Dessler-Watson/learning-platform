// Tipos compartidos de salas para la SALA DE ESPERA.
// Los datos reales vienen de /api/salas (PostgreSQL).

export interface RoomData {
  id?: string;
  codigo: string;
  nombre: string;
  docente: string;
  curso: string;
  actividad: string;
  maxJugadores: number;
  estado: string;
  modo: string;
}

export const GAME_ROUTES: Record<string, string> = {
  decisiones: '/camino-decisiones',
  lava: '/lava-conocimiento',
  tierras: '/tierras-hundidas',
  abismos: '/entre-abismos',
};

export function gameRouteFor(modeCode: string | null | undefined): string {
  return GAME_ROUTES[String(modeCode ?? '').trim().toLowerCase()] || '/camino-decisiones';
}

// Datos de salas para la SALA DE ESPERA.
//
// IMPORTANTE: Estos datos son una SIMULACION para el hackathon.
// La entrada de jugadores se simula en el frontend (WaitingRoomScreen)
// y los datos de la sala son MOCK. Mas adelante se reemplazaran por
// los datos reales del Panel Docente y PostgreSQL (WebSockets incluidos).

export interface RoomData {
  codigo: string;
  nombre: string;
  docente: string;
  curso: string;
  actividad: string;
  maxJugadores: number;
  juegoId: number; // 1 = Camino de las Decisiones, 2 = Lava del Conocimiento
}

// Sala problema por defecto (valida para el codigo de prueba).
const DEFAULT_ROOM: RoomData = {
  codigo: 'CD-001',
  nombre: 'Creciendo en Valores',
  docente: 'Carlos Martinez',
  curso: 'Derechos y Dignidad de la Mujer',
  actividad: 'Camino de las Decisiones',
  maxJugadores: 20,
  juegoId: 1,
};

const MOCK_ROOMS: Record<string, RoomData> = {
  'cd-001': {
    codigo: 'CD-001',
    nombre: 'Creciendo en Valores',
    docente: 'Carlos Martinez',
    curso: 'Derechos y Dignidad de la Mujer',
    actividad: 'Camino de las Decisiones',
    maxJugadores: 20,
    juegoId: 1,
  },
  '6rt5': {
    codigo: '6rt5',
    nombre: 'Descubriendo Nuestros Derechos',
    docente: 'Prof. Luis Torres',
    curso: 'Ciudadania y Derechos',
    actividad: 'Camino de las Decisiones',
    maxJugadores: 20,
    juegoId: 1,
  },
  'es-001': {
    codigo: 'ES-001',
    nombre: 'Aprender Jugando',
    docente: 'Prof. Ana Garcia',
    curso: 'Derechos Humanos Basico',
    actividad: 'Camino de las Decisiones',
    maxJugadores: 20,
    juegoId: 1,
  },
};

// Lista de nombres simulados para los jugadores que van entrando.
export const MOCK_PLAYER_NAMES: string[] = [
  'DragonFeliz', 'AstroKid', 'PandaMagico', 'EstrellaLunar', 'RayoVeloz',
  'ZorroSabio', 'CapitanNube', 'TigreAlegre', 'MonoCurioso', 'LoboAventurero',
  'SirenaAzul', 'BuhoInteligente', 'RanaSaltarina', 'ElefanteMemoria', 'Lincesieta',
  'KoalaCarinoso', 'PumaHeroico', 'ConejoRapido', 'TucanColores', 'GatoEstrella',
];

export function getMockRoom(codigo: string | null | undefined): RoomData {
  if (!codigo) return DEFAULT_ROOM;
  const key = codigo.trim().toLowerCase();
  return MOCK_ROOMS[key] || { ...DEFAULT_ROOM, codigo: codigo.trim().toUpperCase() };
}

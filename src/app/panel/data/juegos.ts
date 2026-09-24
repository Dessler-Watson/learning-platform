import { Juego } from '../types';

export const juegos: Juego[] = [
  {
    id: 'juego-1',
    nombre: 'Rumbo',
    descripcion: 'Avanza por un camino celestial eligiendo entre dos puertas. Responde correctamente para seguir avanzando.',
    emoji: '',
    color: '#4FC3F7',
    estado: 'activo',
    config: {
      cantidadNiveles: 10,
      cantidadRondas: 1,
    },
  },
  {
    id: 'juego-2',
    nombre: 'Bajo Presión',
    descripcion: 'Sobrevive al ascenso de la lava respondiendo preguntas. Cada acierto te eleva, cada error hace subir la lava.',
    emoji: '',
    color: '#EF4444',
    estado: 'activo',
    config: {
      cantidadNiveles: 1,
      cantidadRondas: 8,
    },
  },
  {
    id: 'juego-3',
    nombre: 'Tierras Hundidas',
    descripcion: 'Salta entre plataformas en un manglar. Responde correctamente para avanzar, pero cuidado: una mala elección te hunde.',
    emoji: '',
    color: '#1B5E20',
    estado: 'activo',
    config: {
      cantidadNiveles: 1,
      cantidadRondas: 15,
    },
  },
  {
    id: 'juego-4',
    nombre: 'Entre Abismos',
    descripcion: 'Construye un puente y cruza entre montañas. Responde correctamente para ganar plataformas, pero ten cuidado: si caes al abismo, pierdes todo.',
    emoji: '',
    color: '#1976D2',
    estado: 'activo',
    config: {
      cantidadNiveles: 1,
      cantidadRondas: 15,
    },
  },
];

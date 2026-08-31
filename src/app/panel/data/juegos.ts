import { Juego } from '../types';

export const juegos: Juego[] = [
  {
    id: 'juego-1',
    nombre: 'Camino de Decisiones',
    descripcion: 'Avanza por un camino celestial eligiendo entre dos puertas. Responde correctamente para seguir avanzando.',
    emoji: '',
    color: '#7c5cfc',
    estado: 'activo',
    config: {
      tiempoLimite: 30,
      cantidadNiveles: 10,
      cantidadRondas: 1,
    },
  },
  {
    id: 'juego-2',
    nombre: 'La Lava del Conocimiento',
    descripcion: 'Sobrevive al ascenso de la lava respondiendo preguntas. Cada acierto te eleva, cada error hace subir la lava.',
    emoji: '',
    color: '#f97316',
    estado: 'activo',
    config: {
      tiempoLimite: 20,
      cantidadNiveles: 1,
      cantidadRondas: 8,
    },
  },
];

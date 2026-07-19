export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  estado?: string;
  fechaRegistro?: string;
  avatar?: Avatar;
}

export interface Avatar {
  idAvatar: number;
  nombre: string;
  imagen?: string;
  desbloqueado: boolean;
}

export interface LoginCredentials {
  correo: string;
  contraseña: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface Pregunta {
  id_pregunta: number;
  categoria_id: number;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c?: string;
  opcion_d?: string;
  respuesta_correcta: 'a' | 'b' | 'c' | 'd';
  dificultad: 'facil' | 'media' | 'dificil';
  explicacion?: string;
  puntos: number;
  categoria?: Categoria;
}

export interface Categoria {
  id_categoria: number;
  cuestionario_id: number;
  nombre: string;
  descripcion?: string;
}

export interface CreatePreguntaDTO {
  categoria_id: number;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c?: string;
  opcion_d?: string;
  respuesta_correcta: 'a' | 'b' | 'c' | 'd';
  dificultad: 'facil' | 'media' | 'dificil';
  explicacion?: string;
  puntos: number;
}

export interface EstadisticasGenerales {
  totalUsuarios: number;
  totalPreguntas: number;
  totalPartidas: number;
  preguntasPorMundo: {
    mundo1: number;
    mundo2: number;
    mundo3: number;
  };
}

export interface Mundo {
  id: number;
  nombre: string;
  descripcion: string;
}

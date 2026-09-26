import { create } from 'zustand';
import { Docente, Curso, Pregunta, RolUsuario } from '../types';

interface CursoCopiado {
  curso: Curso;
  preguntas: Pregunta[];
}

interface PanelState {
  docente: Docente | null;
  isAuthenticated: boolean;
  sidebarOpen: boolean;
  cursoCopiado: CursoCopiado | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  login: (
    correo: string,
    contrasena: string,
    institucion: string,
    rol: RolUsuario
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    nombre: string;
    correo: string;
    contrasena: string;
    institucion: string;
    rol?: RolUsuario;
    createdByAdmin?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: {
    nombre?: string;
    correo?: string;
    contrasena?: string;
    institucion?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  setCursoCopiado: (curso: Curso, preguntas: Pregunta[]) => void;
  limpiarCursoCopiado: () => void;
  isAdmin: () => boolean;
}

const STORAGE_KEY = 'panel-auth';

function toDocente(apiUser: {
  id: string;
  nombre: string;
  apellido?: string | null;
  email: string | null;
  role: string;
  institution?: string | null;
}): Docente {
  return {
    id: apiUser.id,
    nombre: apiUser.apellido ? `${apiUser.nombre} ${apiUser.apellido}` : apiUser.nombre,
    correo: apiUser.email ?? '',
    contrasena: '',
    institucion: apiUser.institution ?? '',
    rol: apiUser.role === 'admin' ? 'admin' : 'docente',
    estado: 'activo',
    fechaRegistro: new Date().toISOString().split('T')[0],
    ultimaActividad: new Date().toISOString(),
  };
}

function loadAuth(): Docente | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(docente: Docente | null) {
  if (typeof window === 'undefined') return;
  if (docente) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docente));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const usePanelStore = create<PanelState>((set, get) => ({
  docente: loadAuth(),
  isAuthenticated: loadAuth() !== null,
  sidebarOpen: true,
  cursoCopiado: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  login: async (correo, contrasena, institucion, rol) => {
    try {
      const res = await fetch('/api/panel/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo, password: contrasena, institution: institucion, role: rol }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Correo o contraseña incorrectos' };
      }
      const docente = toDocente(result.user);
      if (institucion && docente.institucion && docente.institucion.toLowerCase() !== institucion.toLowerCase()) {
        await fetch('/api/panel/auth/logout', { method: 'POST' });
        return { success: false, error: 'La institución no coincide con esta cuenta' };
      }
      if (rol === 'admin' && docente.rol !== 'admin') {
        await fetch('/api/panel/auth/logout', { method: 'POST' });
        return {
          success: false,
          error: `Esta cuenta tiene el rol "${docente.rol}". No puedes iniciar sesión como "admin".`,
        };
      }
      if (rol === 'docente' && docente.rol === 'admin') {
        // admins can also act as teachers; keep session
      }
      saveAuth(docente);
      set({ docente, isAuthenticated: true });
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Intenta de nuevo.' };
    }
  },

  register: async (data) => {
    try {
      const res = await fetch('/api/panel/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          email: data.correo,
          password: data.contrasena,
          institution: data.institucion,
          role: data.createdByAdmin ? (data.rol === 'admin' ? 'admin' : 'teacher') : 'teacher',
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Este correo ya está registrado.' };
      }
      if (!data.createdByAdmin) {
        const docente = toDocente(result.user);
        saveAuth(docente);
        set({ docente, isAuthenticated: true });
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Intenta de nuevo.' };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/panel/auth/logout', { method: 'POST' });
    } catch {
      /* still clear local */
    }
    saveAuth(null);
    set({ docente: null, isAuthenticated: false });
  },

  refreshAuth: async () => {
    try {
      const res = await fetch('/api/panel/auth/me');
      if (res.ok) {
        const result = await res.json();
        if (result.user) {
          const docente = toDocente(result.user);
          saveAuth(docente);
          set({ docente, isAuthenticated: true });
          return;
        }
      }
    } catch {
      /* fall through */
    }
    saveAuth(null);
    set({ docente: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const current = get().docente;
    if (!current) return { success: false, error: 'No hay sesión activa.' };
    try {
      const res = await fetch('/api/panel/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          correo: data.correo,
          institucion: data.institucion,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Error al actualizar' };
      }
      const docente = toDocente(result.user);
      saveAuth(docente);
      set({ docente });
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Intenta de nuevo.' };
    }
  },

  setCursoCopiado: (curso, preguntas) => set({ cursoCopiado: { curso, preguntas } }),
  limpiarCursoCopiado: () => set({ cursoCopiado: null }),

  isAdmin: () => {
    const docente = get().docente;
    return docente?.rol === 'admin';
  },
}));

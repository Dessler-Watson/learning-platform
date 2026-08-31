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
  login: (correo: string, contrasena: string, institucion: string, rol: RolUsuario) => { success: boolean; error?: string };
  register: (data: { nombre: string; correo: string; contrasena: string; institucion: string; rol?: RolUsuario; createdByAdmin?: boolean }) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: { nombre?: string; correo?: string; contrasena?: string }) => { success: boolean; error?: string };
  setCursoCopiado: (curso: Curso, preguntas: Pregunta[]) => void;
  limpiarCursoCopiado: () => void;
  isAdmin: () => boolean;
}

const STORAGE_KEY = 'panel-auth';

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
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  login: (correo: string, contrasena: string, institucion: string, rol: RolUsuario) => {
    const { obtenerDocentes } = require('../data/docentes');
    const docentes = obtenerDocentes();
    const docente = docentes.find(
      (d: Docente) =>
        d.correo.toLowerCase() === correo.toLowerCase() &&
        d.contrasena === contrasena
    );

    if (!docente) {
      return { success: false, error: 'Correo o contraseña incorrectos' };
    }

    if (docente.institucion.toLowerCase() !== institucion.toLowerCase()) {
      return { success: false, error: 'La institución no coincide con esta cuenta' };
    }

    if (docente.rol !== rol) {
      return { success: false, error: `Esta cuenta tiene el rol "${docente.rol}". No puedes iniciar sesión como "${rol}".` };
    }

    docente.ultimaActividad = new Date().toISOString();
    saveAuth(docente);
    set({ docente, isAuthenticated: true });
    return { success: true };
  },

  register: (data) => {
    const { existeDocente, registrarDocente, obtenerDocentes } = require('../data/docentes');
    if (existeDocente(data.correo)) {
      return { success: false, error: 'Este correo ya está registrado.' };
    }

    const rolAsignado: RolUsuario = data.createdByAdmin ? (data.rol || 'docente') : 'docente';

    const newId = `${rolAsignado === 'admin' ? 'admin' : 'teacher'}-${Date.now()}`;
    const nuevoDocente: Docente = {
      id: newId,
      nombre: data.nombre,
      correo: data.correo,
      contrasena: data.contrasena,
      institucion: data.institucion,
      rol: rolAsignado,
      estado: 'activo',
      fechaRegistro: new Date().toISOString().split('T')[0],
      ultimaActividad: new Date().toISOString(),
    };
    registrarDocente(nuevoDocente);

    if (!data.createdByAdmin) {
      saveAuth(nuevoDocente);
      set({ docente: nuevoDocente, isAuthenticated: true });
    }

    return { success: true };
  },

  logout: () => {
    const current = get().docente;
    if (current) {
      const { actualizarDocentePorId } = require('../data/docentes');
      actualizarDocentePorId(current.id, { estado: current.estado });
    }
    saveAuth(null);
    set({ docente: null, isAuthenticated: false });
  },

  updateProfile: (data) => {
    const { actualizarDocentePorId, obtenerDocentePorId } = require('../data/docentes');
    const current = get().docente;
    if (!current) return { success: false, error: 'No hay sesión activa.' };
    const result = actualizarDocentePorId(current.id, data);
    if (result.success) {
      const updated = obtenerDocentePorId(current.id);
      if (updated) {
        saveAuth(updated);
        set({ docente: updated });
      }
    }
    return result;
  },

  setCursoCopiado: (curso, preguntas) => set({ cursoCopiado: { curso, preguntas } }),
  limpiarCursoCopiado: () => set({ cursoCopiado: null }),

  isAdmin: () => {
    const docente = get().docente;
    return docente?.rol === 'admin';
  },
}));

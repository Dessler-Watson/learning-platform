import { Docente, RolUsuario, EstadoUsuario } from '../types';

const STORAGE_KEY = 'panel-docente-registered';

const docentesPorDefecto: Docente[] = [
  {
    id: 'admin-001',
    nombre: 'Roberto Admin',
    correo: 'roberto.admin@gmail.com',
    contrasena: 'admin123',
    institucion: 'Universidad Nacional',
    rol: 'admin',
    estado: 'activo',
    fechaRegistro: '2025-01-15',
    ultimaActividad: new Date().toISOString(),
  },
  {
    id: 'admin-002',
    nombre: 'María Directora',
    correo: 'maria.directora@gmail.com',
    contrasena: 'admin123',
    institucion: 'Instituto Tecnológico',
    rol: 'admin',
    estado: 'activo',
    fechaRegistro: '2025-02-10',
    ultimaActividad: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'teacher-001',
    nombre: 'Ana García',
    correo: 'ana.garcia@gmail.com',
    contrasena: 'demo123',
    institucion: 'Universidad Nacional',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-03-01',
    ultimaActividad: new Date().toISOString(),
  },
  {
    id: 'teacher-002',
    nombre: 'Carlos López',
    correo: 'carlos.lopez@gmail.com',
    contrasena: 'demo123',
    institucion: 'Instituto Tecnológico',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-03-15',
    ultimaActividad: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'teacher-003',
    nombre: 'María Fernández',
    correo: 'maria.fernandez@gmail.com',
    contrasena: 'demo123',
    institucion: 'Colegio San José',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-04-01',
    ultimaActividad: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'teacher-004',
    nombre: 'Juan Martínez',
    correo: 'juan.martinez@gmail.com',
    contrasena: 'demo123',
    institucion: 'Colegio San José',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-04-10',
    ultimaActividad: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'teacher-005',
    nombre: 'Laura Rodríguez',
    correo: 'laura.rodriguez@gmail.com',
    contrasena: 'demo123',
    institucion: 'Universidad Central',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-05-01',
    ultimaActividad: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'teacher-006',
    nombre: 'Pedro Sánchez',
    correo: 'pedro.sanchez@gmail.com',
    contrasena: 'demo123',
    institucion: 'Instituto Norte',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-05-15',
    ultimaActividad: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'teacher-007',
    nombre: 'Sofía Moreno',
    correo: 'sofia.moreno@gmail.com',
    contrasena: 'demo123',
    institucion: 'Universidad Nacional',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-06-01',
    ultimaActividad: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'teacher-008',
    nombre: 'Diego Herrera',
    correo: 'diego.herrera@gmail.com',
    contrasena: 'demo123',
    institucion: 'Instituto Tecnológico',
    rol: 'docente',
    estado: 'activo',
    fechaRegistro: '2025-06-15',
    ultimaActividad: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

function cargarDocentesRegistrados(): Docente[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarDocentesRegistrados(docentes: Docente[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docentes));
}

export function obtenerDocentes(): Docente[] {
  const registrados = cargarDocentesRegistrados();
  const map = new Map<string, Docente>();
  for (const d of docentesPorDefecto) {
    map.set(d.id, d);
  }
  for (const d of registrados) {
    map.set(d.id, d);
  }
  return Array.from(map.values());
}

export function existeDocente(correo: string): boolean {
  return obtenerDocentes().some(
    (d) => d.correo.toLowerCase() === correo.toLowerCase()
  );
}

export function registrarDocente(docente: Docente): void {
  const registrados = cargarDocentesRegistrados();
  registrados.push(docente);
  guardarDocentesRegistrados(registrados);
}

export function obtenerDocentePorId(id: string): Docente | undefined {
  return obtenerDocentes().find((d) => d.id === id);
}

export function actualizarDocentePorId(
  id: string,
  datos: { nombre?: string; correo?: string; contrasena?: string; institucion?: string; rol?: RolUsuario; estado?: EstadoUsuario }
): { success: boolean; error?: string } {
  const todos = obtenerDocentes();
  const idx = todos.findIndex((d) => d.id === id);
  if (idx === -1) return { success: false, error: 'Docente no encontrado' };

  if (datos.correo) {
    const duplicado = todos.find(
      (d) => d.correo.toLowerCase() === datos.correo!.toLowerCase() && d.id !== id
    );
    if (duplicado) return { success: false, error: 'Este correo ya está registrado.' };
  }

  const actualizado = { ...todos[idx] };
  if (datos.nombre) actualizado.nombre = datos.nombre;
  if (datos.correo) actualizado.correo = datos.correo;
  if (datos.contrasena) actualizado.contrasena = datos.contrasena;
  if (datos.institucion) actualizado.institucion = datos.institucion;
  if (datos.rol) actualizado.rol = datos.rol;
  if (datos.estado) actualizado.estado = datos.estado;
  actualizado.ultimaActividad = new Date().toISOString();

  const esPorDefecto = docentesPorDefecto.some((d) => d.id === id);
  if (esPorDefecto) {
    const idxDefecto = docentesPorDefecto.findIndex((d) => d.id === id);
    docentesPorDefecto[idxDefecto] = actualizado;
  }

  const registrados = cargarDocentesRegistrados();
  const idxReg = registrados.findIndex((d) => d.id === id);
  if (idxReg !== -1) {
    registrados[idxReg] = actualizado;
  } else {
    registrados.push(actualizado);
  }
  guardarDocentesRegistrados(registrados);

  return { success: true };
}

export function eliminarDocente(id: string): { success: boolean; error?: string } {
  const todos = obtenerDocentes();
  const idx = todos.findIndex((d) => d.id === id);
  if (idx === -1) return { success: false, error: 'Docente no encontrado' };

  const esPorDefecto = docentesPorDefecto.some((d) => d.id === id);
  if (esPorDefecto) {
    const idxDefecto = docentesPorDefecto.findIndex((d) => d.id === id);
    docentesPorDefecto.splice(idxDefecto, 1);
  }

  const registrados = cargarDocentesRegistrados();
  const idxReg = registrados.findIndex((d) => d.id === id);
  if (idxReg !== -1) {
    registrados.splice(idxReg, 1);
  }
  guardarDocentesRegistrados(registrados);

  return { success: true };
}

export function obtenerInstituciones(): string[] {
  const docentes = obtenerDocentes();
  const instituciones = new Set(docentes.map((d) => d.institucion));
  return Array.from(instituciones).sort();
}

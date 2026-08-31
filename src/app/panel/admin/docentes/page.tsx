'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Building2,
  Shield,
  ShieldCheck,
  Edit3,
  Trash2,
  Eye,
  UserPlus,
  AlertCircle,
  CheckCircle,
  X,
  Mail,
  Lock,
  User,
  EyeOff,
  Filter,
  ChevronDown,
  Clock,
  Circle,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { ConfirmDialog } from '../../ui/confirm-dialog';
import { useToast } from '../../ui/toast';
import { usePanelStore } from '../../store/usePanelStore';
import { audioManager } from '../../lib/audio';
import {
  obtenerDocentes,
  obtenerInstituciones,
  actualizarDocentePorId,
  eliminarDocente,
  registrarDocente,
  existeDocente,
} from '../../data/docentes';
import { Docente, RolUsuario, EstadoUsuario } from '../../types';

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD < 7) return `Hace ${diffD}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function isOnline(ultimaActividad: string): boolean {
  const date = new Date(ultimaActividad);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < 300000;
}

export default function AdminDocentesPage() {
  const { toast } = useToast();
  const currentAdmin = usePanelStore((s) => s.docente);

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [instituciones, setInstituciones] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todas');
  const [busquedaInstitucion, setBusquedaInstitucion] = useState('');
  const [showFiltroInstitucion, setShowFiltroInstitucion] = useState(false);
  const filtroBtnRef = useRef<HTMLButtonElement>(null);
  const filtroDropRef = useRef<HTMLDivElement>(null);
  const [filtroDropPos, setFiltroDropPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showFiltroInstitucion) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filtroDropRef.current && !filtroDropRef.current.contains(e.target as Node) &&
        filtroBtnRef.current && !filtroBtnRef.current.contains(e.target as Node)
      ) {
        setShowFiltroInstitucion(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFiltroInstitucion]);

  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [showCambiarContrasena, setShowCambiarContrasena] = useState(false);
  const [showAgregarAdmin, setShowAgregarAdmin] = useState(false);

  const [editForm, setEditForm] = useState({ nombre: '', correo: '', institucion: '' });
  const [editErrors, setEditErrors] = useState<{ nombre?: string; correo?: string; institucion?: string }>({});

  const [passwordForm, setPasswordForm] = useState({ nueva: '', confirmar: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ nueva?: string; confirmar?: string }>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [adminForm, setAdminForm] = useState({ nombre: '', correo: '', contrasena: '', confirmarContrasena: '', institucion: '' });
  const [adminErrors, setAdminErrors] = useState<{ nombre?: string; correo?: string; contrasena?: string; confirmarContrasena?: string; institucion?: string }>({});
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(() => {
    const todos = obtenerDocentes();
    setDocentes(todos);
    setInstituciones(obtenerInstituciones());
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const institucionesFiltradas = useMemo(() => {
    if (!busquedaInstitucion.trim()) return instituciones;
    return instituciones.filter((inst) =>
      inst.toLowerCase().includes(busquedaInstitucion.toLowerCase())
    );
  }, [instituciones, busquedaInstitucion]);

  const docentesFiltrados = useMemo(() => {
    return docentes.filter((d) => {
      const coincideNombre = !busqueda.trim() ||
        d.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideInstitucion = filtroInstitucion === 'todas' ||
        d.institucion.toLowerCase() === filtroInstitucion.toLowerCase();
      return coincideNombre && coincideInstitucion;
    });
  }, [docentes, busqueda, filtroInstitucion]);

  const stats = useMemo(() => ({
    total: docentes.length,
    docentes: docentes.filter((d) => d.rol === 'docente').length,
    admins: docentes.filter((d) => d.rol === 'admin').length,
    activos: docentes.filter((d) => d.estado === 'activo').length,
    enLinea: docentes.filter((d) => isOnline(d.ultimaActividad)).length,
  }), [docentes]);

  const handleVer = useCallback((docente: Docente) => {
    audioManager.play('select');
    setSelectedDocente(docente);
    setShowVerModal(true);
  }, []);

  const handleEditar = useCallback((docente: Docente) => {
    audioManager.play('select');
    setSelectedDocente(docente);
    setEditForm({ nombre: docente.nombre, correo: docente.correo, institucion: docente.institucion });
    setEditErrors({});
    setShowEditarModal(true);
  }, []);

  const handleEliminar = useCallback((docente: Docente) => {
    audioManager.play('delete');
    setSelectedDocente(docente);
    setShowEliminarDialog(true);
  }, []);

  const handleCambiarContrasena = useCallback((docente: Docente) => {
    audioManager.play('select');
    setSelectedDocente(docente);
    setPasswordForm({ nueva: '', confirmar: '' });
    setPasswordErrors({});
    setShowCambiarContrasena(true);
  }, []);

  const confirmarEliminar = useCallback(() => {
    if (!selectedDocente) return;
    const result = eliminarDocente(selectedDocente.id);
    if (result.success) {
      toast(`Cuenta de ${selectedDocente.nombre} eliminada`, 'success');
      setShowEliminarDialog(false);
      setSelectedDocente(null);
      cargarDatos();
    } else {
      toast(result.error || 'Error al eliminar', 'error');
    }
  }, [selectedDocente, toast, cargarDatos]);

  const guardarEdicion = useCallback(() => {
    if (!selectedDocente) return;
    const errors: typeof editErrors = {};
    if (!editForm.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!editForm.correo.trim()) errors.correo = 'El correo es obligatorio';
    else if (!/^[^\s@]+@gmail\.com$/.test(editForm.correo)) errors.correo = 'Correo inválido';
    if (!editForm.institucion.trim()) errors.institucion = 'La institución es obligatoria';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      const result = actualizarDocentePorId(selectedDocente.id, {
        nombre: editForm.nombre,
        correo: editForm.correo,
        institucion: editForm.institucion,
      });
      setLoading(false);
      if (result.success) {
        toast('Docente actualizado correctamente', 'success');
        setShowEditarModal(false);
        setSelectedDocente(null);
        cargarDatos();
      } else {
        toast(result.error || 'Error al actualizar', 'error');
      }
    }, 400);
  }, [selectedDocente, editForm, toast, cargarDatos]);

  const guardarContrasena = useCallback(() => {
    if (!selectedDocente) return;
    const errors: typeof passwordErrors = {};
    if (!passwordForm.nueva) errors.nueva = 'La contraseña es obligatoria';
    else if (passwordForm.nueva.length < 6) errors.nueva = 'Mínimo 6 caracteres';
    if (passwordForm.nueva !== passwordForm.confirmar) errors.confirmar = 'Las contraseñas no coinciden';
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      const result = actualizarDocentePorId(selectedDocente.id, { contrasena: passwordForm.nueva });
      setLoading(false);
      if (result.success) {
        toast('Contraseña actualizada correctamente', 'success');
        setShowCambiarContrasena(false);
        setSelectedDocente(null);
      } else {
        toast(result.error || 'Error al actualizar contraseña', 'error');
      }
    }, 400);
  }, [selectedDocente, passwordForm, toast]);

  const crearAdmin = useCallback(() => {
    const errors: typeof adminErrors = {};
    if (!adminForm.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!adminForm.correo.trim()) errors.correo = 'El correo es obligatorio';
    else if (!/^[^\s@]+@gmail\.com$/.test(adminForm.correo)) errors.correo = 'Correo inválido';
    if (!adminForm.contrasena) errors.contrasena = 'La contraseña es obligatoria';
    else if (adminForm.contrasena.length < 6) errors.contrasena = 'Mínimo 6 caracteres';
    if (adminForm.contrasena !== adminForm.confirmarContrasena) errors.confirmarContrasena = 'Las contraseñas no coinciden';
    if (!adminForm.institucion.trim()) errors.institucion = 'La institución es obligatoria';
    setAdminErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (existeDocente(adminForm.correo)) {
      setAdminErrors({ correo: 'Este correo ya está registrado' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = usePanelStore.getState().register({
        nombre: adminForm.nombre,
        correo: adminForm.correo,
        contrasena: adminForm.contrasena,
        institucion: adminForm.institucion,
        rol: 'admin',
        createdByAdmin: true,
      });
      setLoading(false);
      if (result.success) {
        toast('Administrador creado correctamente', 'success');
        setShowAgregarAdmin(false);
        setAdminForm({ nombre: '', correo: '', contrasena: '', confirmarContrasena: '', institucion: '' });
        cargarDatos();
      } else {
        toast(result.error || 'Error al crear administrador', 'error');
      }
    }, 400);
  }, [adminForm, toast, cargarDatos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrar docentes</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona las cuentas de docentes y administradores</p>
        </div>
        <Button
          onClick={() => {
            audioManager.play('select');
            setAdminForm({ nombre: '', correo: '', contrasena: '', confirmarContrasena: '', institucion: currentAdmin?.institucion || '' });
            setAdminErrors({});
            setShowAgregarAdmin(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Agregar administrador
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats.total, border: 'border-gray-200', glow: 'hover:shadow-soft', text: 'text-gray-600' },
          { label: 'Docentes', value: stats.docentes, border: 'border-cyan-200', glow: 'hover:shadow-glow-cyan', text: 'text-cyan-600' },
          { label: 'Admins', value: stats.admins, border: 'border-amber-200', glow: 'hover:shadow-glow-amber', text: 'text-amber-600' },
          { label: 'Activos', value: stats.activos, border: 'border-emerald-200', glow: 'hover:shadow-glow-emerald', text: 'text-emerald-600' },
          { label: 'En línea', value: stats.enLinea, border: 'border-violet-200', glow: 'hover:shadow-glow-violet', text: 'text-violet-600' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.border} bg-white/90 backdrop-blur-sm p-4 shadow-sm transition-all ${stat.glow} card-shimmer card-corner-decoration overflow-hidden relative`}>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-[0.04] pointer-events-none bg-current" />
            <p className="text-xs font-medium text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.text}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <Card variant="cyan">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar docente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-11"
              />
            </div>

            <div className="relative">
              <Button
                ref={filtroBtnRef}
                variant="outline"
                onClick={() => {
                  audioManager.play('toggle');
                  if (!showFiltroInstitucion && filtroBtnRef.current) {
                    const rect = filtroBtnRef.current.getBoundingClientRect();
                    setFiltroDropPos({ top: rect.bottom + 4, left: rect.left });
                  }
                  setShowFiltroInstitucion(!showFiltroInstitucion);
                }}
                className="gap-2 w-full sm:w-auto"
              >
                <Building2 className="h-4 w-4" />
                <span className="truncate max-w-[120px]">
                  {filtroInstitucion === 'todas' ? 'Todas las instituciones' : filtroInstitucion}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {mounted && showFiltroInstitucion && createPortal(
                <AnimatePresence>
                  <motion.div
                    ref={filtroDropRef}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'fixed', top: filtroDropPos?.top ?? 0, left: filtroDropPos?.left ?? 0, zIndex: 9999 }}
                    className="w-72 rounded-2xl border border-cyan-200 bg-white p-3 shadow-md"
                  >
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar institución..."
                        value={busquedaInstitucion}
                        onChange={(e) => setBusquedaInstitucion(e.target.value)}
                        className="pl-9 h-9 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      <button
                        onClick={() => {
                          audioManager.play('select');
                          setFiltroInstitucion('todas');
                          setShowFiltroInstitucion(false);
                          setBusquedaInstitucion('');
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                          filtroInstitucion === 'todas'
                            ? 'bg-cyan-50 font-semibold text-cyan-600'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        Todas las instituciones
                      </button>
                      {institucionesFiltradas.map((inst) => (
                        <button
                          key={inst}
                          onClick={() => {
                            audioManager.play('select');
                            setFiltroInstitucion(inst);
                            setShowFiltroInstitucion(false);
                            setBusquedaInstitucion('');
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                            filtroInstitucion === inst
                              ? 'bg-cyan-50 font-semibold text-cyan-600'
                              : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {inst}
                        </button>
                      ))}
                      {institucionesFiltradas.length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400">No se encontraron instituciones</p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>,
                document.body
              )}
            </div>
          </div>

          {(busqueda || filtroInstitucion !== 'todas') && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Filtros activos:</span>
              {busqueda && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-600">
                  Nombre: &quot;{busqueda}&quot;
                  <button onClick={() => setBusqueda('')} className="hover:text-cyan-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtroInstitucion !== 'todas' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                  Institución: {filtroInstitucion}
                  <button onClick={() => setFiltroInstitucion('todas')} className="hover:text-amber-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="emerald">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Correo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Institución</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docentesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-400">No se encontraron docentes</p>
                        <p className="text-xs text-gray-300">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  docentesFiltrados.map((docente) => {
                    const online = isOnline(docente.ultimaActividad);
                    return (
                      <motion.tr
                        key={docente.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 text-sm font-bold text-white">
                                {docente.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                online ? 'bg-emerald-400' : 'bg-gray-300'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{docente.nombre}</p>
                              <p className="text-xs text-gray-400 md:hidden">{docente.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-500">{docente.correo}</p>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <p className="text-sm text-gray-500">{docente.institucion}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            docente.rol === 'admin'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                          }`}>
                            {docente.rol === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            {docente.rol === 'admin' ? 'Admin' : 'Docente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Circle className={`h-2 w-2 fill-current ${online ? 'text-emerald-400' : 'text-gray-300'}`} />
                            <span className={`text-xs font-medium ${online ? 'text-emerald-500' : 'text-gray-400'}`}>
                              {online ? 'En línea' : formatRelativeDate(docente.ultimaActividad)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleVer(docente)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-cyan-500 transition-all"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditar(docente)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-500 transition-all"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCambiarContrasena(docente)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-violet-500 transition-all"
                              title="Cambiar contraseña"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                            {docente.id !== currentAdmin?.id && (
                              <button
                                onClick={() => handleEliminar(docente)}
                                className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showVerModal} onOpenChange={setShowVerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del docente</DialogTitle>
            <DialogDescription>Información completa de la cuenta</DialogDescription>
          </DialogHeader>
          {selectedDocente && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-500 text-xl font-bold text-white">
                  {selectedDocente.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedDocente.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedDocente.rol === 'admin'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-cyan-50 text-cyan-600'
                    }`}>
                      {selectedDocente.rol === 'admin' ? 'Administrador' : 'Docente'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs ${isOnline(selectedDocente.ultimaActividad) ? 'text-emerald-500' : 'text-gray-400'}`}>
                      <Circle className={`h-2 w-2 fill-current ${isOnline(selectedDocente.ultimaActividad) ? 'text-emerald-400' : 'text-gray-300'}`} />
                      {isOnline(selectedDocente.ultimaActividad) ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Correo</p>
                    <p className="text-sm font-medium text-foreground">{selectedDocente.correo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Institución</p>
                    <p className="text-sm font-medium text-foreground">{selectedDocente.institucion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Estado</p>
                    <p className="text-sm font-medium text-foreground capitalize">{selectedDocente.estado}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Registro</p>
                    <p className="text-sm font-medium text-foreground">{selectedDocente.fechaRegistro}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Última actividad</p>
                    <p className="text-sm font-medium text-foreground">{formatRelativeDate(selectedDocente.ultimaActividad)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVerModal(false)}>Cerrar</Button>
                <Button onClick={() => { setShowVerModal(false); handleEditar(selectedDocente); }}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditarModal} onOpenChange={setShowEditarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar docente</DialogTitle>
            <DialogDescription>Modifica la información de la cuenta</DialogDescription>
          </DialogHeader>
          {selectedDocente && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="pl-11"
                  />
                </div>
                {editErrors.nombre && (
                  <p className="text-sm text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {editErrors.nombre}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={editForm.correo}
                    onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                    className="pl-11"
                  />
                </div>
                {editErrors.correo && (
                  <p className="text-sm text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {editErrors.correo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Institución</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={editForm.institucion}
                    onChange={(e) => setEditForm({ ...editForm, institucion: e.target.value })}
                    className="pl-11"
                  />
                </div>
                {editErrors.institucion && (
                  <p className="text-sm text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {editErrors.institucion}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditarModal(false)} disabled={loading}>Cancelar</Button>
                <Button onClick={guardarEdicion} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCambiarContrasena} onOpenChange={setShowCambiarContrasena}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Actualiza la contraseña de {selectedDocente?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordForm.nueva}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                  className="pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.nueva && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {passwordErrors.nueva}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordForm.confirmar}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                  className="pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
                >
                  {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmar && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {passwordErrors.confirmar}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCambiarContrasena(false)} disabled={loading}>Cancelar</Button>
              <Button onClick={guardarContrasena} disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAgregarAdmin} onOpenChange={setShowAgregarAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar administrador</DialogTitle>
            <DialogDescription>Crea una nueva cuenta con rol de administrador</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Nombre del administrador"
                  value={adminForm.nombre}
                  onChange={(e) => setAdminForm({ ...adminForm, nombre: e.target.value })}
                  className="pl-11"
                />
              </div>
              {adminErrors.nombre && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {adminErrors.nombre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="correo@gmail.com"
                  value={adminForm.correo}
                  onChange={(e) => setAdminForm({ ...adminForm, correo: e.target.value })}
                  className="pl-11"
                />
              </div>
              {adminErrors.correo && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {adminErrors.correo}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showAdminPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={adminForm.contrasena}
                  onChange={(e) => setAdminForm({ ...adminForm, contrasena: e.target.value })}
                  className="pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground"
                >
                  {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {adminErrors.contrasena && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {adminErrors.contrasena}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={adminForm.confirmarContrasena}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmarContrasena: e.target.value })}
                  className="pl-11"
                />
              </div>
              {adminErrors.confirmarContrasena && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {adminErrors.confirmarContrasena}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Institución</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Nombre de la institución"
                  value={adminForm.institucion}
                  onChange={(e) => setAdminForm({ ...adminForm, institucion: e.target.value })}
                  className="pl-11"
                />
              </div>
              {adminErrors.institucion && (
                <p className="text-sm text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {adminErrors.institucion}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAgregarAdmin(false)} disabled={loading}>Cancelar</Button>
              <Button onClick={crearAdmin} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? 'Creando...' : 'Crear administrador'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showEliminarDialog}
        onOpenChange={setShowEliminarDialog}
        title="Eliminar cuenta"
        description={`¿Estás seguro de que deseas eliminar la cuenta de ${selectedDocente?.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmarEliminar}
      />
    </div>
  );
}

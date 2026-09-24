'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Edit3,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Mail,
  Lock,
  User,
  EyeOff,
  Clock,
  Circle,
  Star,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent } from '../../ui/card';
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
import { audioManager } from '../../lib/audio';
import { estudiantesService } from '../../services';
import { CuentaJugador } from '../../types';

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
  return now.getTime() - date.getTime() < 300000;
}

export default function AdminEstudiantesPage() {
  const { toast } = useToast();

  const [estudiantes, setEstudiantes] = useState<CuentaJugador[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [selected, setSelected] = useState<CuentaJugador | null>(null);
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [showCambiarContrasena, setShowCambiarContrasena] = useState(false);

  const [editForm, setEditForm] = useState({ nombre: '', correo: '', estado: 'activo' });
  const [editErrors, setEditErrors] = useState<{ nombre?: string; correo?: string }>({});
  const [passwordForm, setPasswordForm] = useState({ nueva: '', confirmar: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ nueva?: string; confirmar?: string }>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(() => {
    estudiantesService.listar().then(({ estudiantes }) => {
      setEstudiantes(estudiantes);
    }).catch(() => {
      setEstudiantes([]);
    });
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.correo.toLowerCase().includes(q)
    );
  }, [estudiantes, busqueda]);

  const stats = useMemo(() => ({
    total: estudiantes.length,
    activos: estudiantes.filter((e) => e.estado === 'activo').length,
    suspendidos: estudiantes.filter((e) => e.estado === 'suspendido').length,
    estrellas: estudiantes.reduce((acc, e) => acc + (e.estrellas || 0), 0),
  }), [estudiantes]);

  const handleVer = useCallback((c: CuentaJugador) => {
    audioManager.play('select');
    setSelected(c);
    setShowVerModal(true);
  }, []);

  const handleEditar = useCallback((c: CuentaJugador) => {
    audioManager.play('select');
    setSelected(c);
    setEditForm({ nombre: c.nombre, correo: c.correo, estado: c.estado });
    setEditErrors({});
    setShowEditarModal(true);
  }, []);

  const handleEliminar = useCallback((c: CuentaJugador) => {
    audioManager.play('delete');
    setSelected(c);
    setShowEliminarDialog(true);
  }, []);

  const handleCambiarContrasena = useCallback((c: CuentaJugador) => {
    audioManager.play('select');
    setSelected(c);
    setPasswordForm({ nueva: '', confirmar: '' });
    setPasswordErrors({});
    setShowCambiarContrasena(true);
  }, []);

  const confirmarEliminar = useCallback(async () => {
    if (!selected) return;
    const result = await estudiantesService.eliminar(selected.id);
    if (result.success) {
      toast(`Cuenta de ${selected.nombre} eliminada`, 'success');
      setShowEliminarDialog(false);
      setSelected(null);
      cargarDatos();
    } else {
      toast(result.error || 'Error al eliminar', 'error');
    }
  }, [selected, toast, cargarDatos]);

  const guardarEdicion = useCallback(() => {
    if (!selected) return;
    const errors: typeof editErrors = {};
    if (!editForm.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!editForm.correo.trim()) errors.correo = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.correo)) errors.correo = 'Correo inválido';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    void (async () => {
      const result = await estudiantesService.actualizar(selected.id, {
        nombre: editForm.nombre,
        correo: editForm.correo,
        estado: editForm.estado,
      });
      setLoading(false);
      if (result.success) {
        toast('Estudiante actualizado correctamente', 'success');
        setShowEditarModal(false);
        setSelected(null);
        cargarDatos();
      } else {
        toast(result.error || 'Error al actualizar', 'error');
      }
    })();
  }, [selected, editForm, toast, cargarDatos]);

  const guardarContrasena = useCallback(() => {
    if (!selected) return;
    const errors: typeof passwordErrors = {};
    if (!passwordForm.nueva) errors.nueva = 'La contraseña es obligatoria';
    else if (passwordForm.nueva.length < 6) errors.nueva = 'Mínimo 6 caracteres';
    if (passwordForm.nueva !== passwordForm.confirmar) errors.confirmar = 'Las contraseñas no coinciden';
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    void (async () => {
      const result = await estudiantesService.actualizar(selected.id, { contrasena: passwordForm.nueva });
      setLoading(false);
      if (result.success) {
        toast('Contraseña actualizada correctamente', 'success');
        setShowCambiarContrasena(false);
        setSelected(null);
      } else {
        toast(result.error || 'Error al actualizar contraseña', 'error');
      }
    })();
  }, [selected, passwordForm, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrar estudiantes</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona las cuentas de estudiantes y jugadores</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, border: 'border-gray-200', glow: 'hover:shadow-soft', text: 'text-gray-600' },
          { label: 'Activos', value: stats.activos, border: 'border-emerald-200', glow: 'hover:shadow-glow-emerald', text: 'text-emerald-600' },
          { label: 'Suspendidos', value: stats.suspendidos, border: 'border-rose-200', glow: 'hover:shadow-glow-rose', text: 'text-rose-500' },
          { label: 'Estrellas totales', value: stats.estrellas, border: 'border-[#00A0B5]/20', glow: 'hover:shadow-glow-cyan', text: 'text-[#00A0B5]' },
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
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-11"
            />
          </div>
          {busqueda && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">Filtro:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00A0B5]/10 px-3 py-1 text-xs font-medium text-[#00A0B5]">
                &quot;{busqueda}&quot;
                <button onClick={() => setBusqueda('')} className="hover:text-[#00A0B5]/80">
                  <X className="h-3 w-3" />
                </button>
              </span>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Estrellas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Registro</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-400">No se encontraron estudiantes</p>
                        <p className="text-xs text-gray-300">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((est) => {
                    const online = isOnline(est.ultimaActividad);
                    return (
                      <motion.tr
                        key={est.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00A0B5] to-[#98C54E] text-sm font-bold text-white">
                                {est.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                online ? 'bg-emerald-400' : 'bg-gray-300'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{est.nombre}</p>
                              <p className="text-xs text-gray-400 md:hidden">{est.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-500">{est.correo}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            est.estado === 'activo'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : est.estado === 'suspendido'
                                ? 'bg-rose-50 text-rose-500 border border-rose-200'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                          }}`}>
                            <Circle className="h-2 w-2 fill-current" />
                            {est.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {est.estrellas}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">{est.fechaRegistro}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleVer(est)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-[#00A0B5] transition-all"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditar(est)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-500 transition-all"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCambiarContrasena(est)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-violet-500 transition-all"
                              title="Cambiar contraseña"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(est)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
            <DialogTitle>Detalle del estudiante</DialogTitle>
            <DialogDescription>Información básica de la cuenta</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A0B5] to-[#98C54E] text-xl font-bold text-white">
                  {selected.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selected.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#00A0B5]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00A0B5]">
                      Estudiante
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs ${isOnline(selected.ultimaActividad) ? 'text-emerald-500' : 'text-gray-400'}`}>
                      <Circle className={`h-2 w-2 fill-current ${isOnline(selected.ultimaActividad) ? 'bg-emerald-400 text-emerald-400' : 'bg-gray-300 text-gray-300'}`} />
                      {isOnline(selected.ultimaActividad) ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Correo</p>
                    <p className="text-sm font-medium text-foreground">{selected.correo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Estado</p>
                    <p className="text-sm font-medium text-foreground capitalize">{selected.estado}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-400">Estrellas</p>
                    <p className="text-sm font-medium text-foreground">{selected.estrellas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Registro</p>
                    <p className="text-sm font-medium text-foreground">{selected.fechaRegistro}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Última actividad</p>
                    <p className="text-sm font-medium text-foreground">{formatRelativeDate(selected.ultimaActividad)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVerModal(false)}>Cerrar</Button>
                <Button onClick={() => { setShowVerModal(false); handleEditar(selected); }}>
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
            <DialogTitle>Editar estudiante</DialogTitle>
            <DialogDescription>Modifica la información de la cuenta</DialogDescription>
          </DialogHeader>
          {selected && (
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
                <Label>Estado</Label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
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
              Actualiza la contraseña de {selected?.nombre}
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

      <ConfirmDialog
        open={showEliminarDialog}
        onOpenChange={setShowEliminarDialog}
        title="Eliminar cuenta"
        description={`¿Estás seguro de que deseas eliminar la cuenta de ${selected?.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmarEliminar}
      />
    </div>
  );
}

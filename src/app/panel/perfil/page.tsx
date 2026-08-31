'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Mail, Building2, GraduationCap, Save, X, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PageHeader } from '../components/shared/PageHeader';
import { usePanelStore } from '../store/usePanelStore';
import { audioManager } from '../lib/audio';
import { getInitials } from '../utils';
import { useClickLock } from '../hooks/useClickLock';

const c = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const it = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

export default function PerfilPage() {
  const { docente, updateProfile, logout } = usePanelStore();
  const clickLock = useClickLock();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: docente?.nombre ?? '',
    correo: docente?.correo ?? '',
    institucion: docente?.institucion ?? '',
  });
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!docente) return;
    if (!form.nombre.trim() || !form.correo.trim()) {
      audioManager.play('error');
      setError('Nombre y correo son obligatorios');
      return;
    }
    const result = updateProfile(form);
    if (result.success) {
      setEditing(false);
      audioManager.play('success');
      setError('');
    } else {
      setError(result.error || 'Error al actualizar');
    }
  };

  const handleLogout = () => {
    logout();
    audioManager.onLogout();
  };

  return (
    <div className="relative z-10">
      <motion.div variants={c} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={it}>
          <PageHeader title="Mi Perfil" description="Gestiona tu información personal" />
        </motion.div>

        <motion.div variants={it} className="mx-auto max-w-lg">
          <div className="rounded-3xl border border-pink-200 bg-gradient-to-br from-white via-pink-50/20 to-white p-6 shadow-sm card-shimmer card-corner-decoration relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-pink-300 opacity-[0.04] pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-300 opacity-[0.03] pointer-events-none" />
            <motion.div variants={c} initial="hidden" animate="show" className="space-y-6">
              <motion.div variants={it} className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 text-3xl font-bold text-white shadow-lg shadow-cyan-500/25 ring-4 ring-white">
                    {getInitials(docente?.nombre ?? '')}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-3 border-white bg-emerald-400 shadow-sm" />
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">{docente?.nombre}</h2>
                <p className="text-sm text-gray-400 font-medium">{docente?.rol === 'admin' ? 'Administrador' : 'Docente'}</p>
              </motion.div>

              <div className="space-y-3">
                <motion.div variants={it} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100">
                    <GraduationCap className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-medium">Nombre completo</p>
                    {editing ? (
                      <Input
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="h-8 rounded-xl border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0 focus-visible:border-0"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{docente?.nombre}</p>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={it} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 border border-pink-100">
                    <Mail className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-medium">Correo electrónico</p>
                    {editing ? (
                      <Input
                        type="email"
                        value={form.correo}
                        onChange={(e) => setForm({ ...form, correo: e.target.value })}
                        className="h-8 rounded-xl border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0 focus-visible:border-0"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{docente?.correo}</p>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={it} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
                    <Building2 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-medium">Institución</p>
                    {editing ? (
                      <Input
                        value={form.institucion}
                        onChange={(e) => setForm({ ...form, institucion: e.target.value })}
                        className="h-8 rounded-xl border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0 focus-visible:border-0"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{docente?.institucion}</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {error && (
                <p className="text-sm text-rose-500 text-center font-medium">{error}</p>
              )}

              <motion.div variants={it} className="flex flex-col gap-3 md:flex-row md:justify-center">
                {editing ? (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => { if (!clickLock()) return; audioManager.play('modalClose'); setEditing(false); setError(''); }}>
                      <X className="mr-1 h-4 w-4" /> Cancelar
                    </Button>
                    <Button className="flex-1 sm:flex-none" onClick={() => { if (!clickLock()) return; handleSave(); }}>
                      <Save className="mr-1 h-4 w-4" /> Guardar
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => { if (!clickLock()) return; audioManager.play('click'); setEditing(true); }}>
                      <Pencil className="mr-1 h-4 w-4" /> Editar perfil
                    </Button>
                    <Button variant="destructive" className="flex-1 sm:flex-none" onClick={() => { if (!clickLock()) return; audioManager.play('delete'); handleLogout(); }}>
                      <LogOut className="mr-1 h-4 w-4" /> Cerrar sesión
                    </Button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

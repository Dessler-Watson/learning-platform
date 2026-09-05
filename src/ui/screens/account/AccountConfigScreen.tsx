'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Key, LogOut, ChevronDown, Check, Mail, User } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';

interface StoredUser {
  id_usuario: number;
  nombre: string;
  apellido?: string;
  avatar_id?: number;
  correo?: string;
  modo: 'registrado' | 'invitado';
}

interface UserData {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  fecha_registro?: string;
  modo: 'registrado' | 'invitado';
}

export function AccountConfigScreen() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [nombreError, setNombreError] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('eduplay_user') : null;
    if (!raw) {
      window.location.href = '/estudiante';
      return;
    }
    const stored: StoredUser = JSON.parse(raw);

    if (stored.modo === 'invitado') {
      setUser({
        id_usuario: stored.id_usuario,
        nombre: stored.nombre,
        apellido: stored.apellido || '',
        correo: '',
        modo: 'invitado',
      });
      setNombre(stored.nombre);
      setApellido(stored.apellido || '');
      setLoading(false);
      return;
    }

    fetch(`/api/estudiante/perfil?usuario_id=${stored.id_usuario}`)
      .then(res => res.json())
      .then((data: any) => {
        if (data.usuario) {
          setUser({
            id_usuario: data.usuario.id_usuario,
            nombre: data.usuario.nombre,
            apellido: data.usuario.apellido || '',
            correo: data.usuario.correo || '',
            fecha_registro: data.usuario.fecha_registro,
            modo: 'registrado',
          });
          setNombre(data.usuario.nombre);
          setApellido(data.usuario.apellido || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);
    if (!nombre.trim() || !apellido.trim()) {
      setNombreError(!nombre.trim());
      setSaveMsg({ ok: false, text: 'El nombre y el apellido son obligatorios' });
      audioManager.play('error');
      return;
    }
    setNombreError(false);
    setSaving(true);
    audioManager.play('submit');
    try {
      const res = await fetch('/api/estudiante/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user?.id_usuario,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ ok: false, text: data.error || 'No se pudieron guardar los cambios' });
        audioManager.play('error');
      } else {
        audioManager.play('success');
        if (user) setUser({ ...user, nombre: data.usuario.nombre, apellido: data.usuario.apellido });
        const raw = localStorage.getItem('eduplay_user');
        if (raw) {
          const stored = JSON.parse(raw);
          localStorage.setItem('eduplay_user', JSON.stringify({
            ...stored,
            nombre: data.usuario.nombre,
            apellido: data.usuario.apellido,
          }));
        }
        setSaveMsg({ ok: true, text: 'Cambios guardados correctamente' });
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Error al guardar los cambios' });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!currentPw) { setPwError('Ingresa tu contraseña actual'); audioManager.play('error'); return; }
    if (newPw.length < 4) { setPwError('La nueva contraseña debe tener al menos 4 caracteres'); audioManager.play('error'); return; }
    if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden'); audioManager.play('error'); return; }
    setSavingPw(true);
    audioManager.play('submit');
    setTimeout(() => {
      setSavingPw(false);
      setPwSuccess('Contraseña actualizada correctamente');
      audioManager.play('success');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    }, 600);
  };

  const logout = () => {
    localStorage.removeItem('eduplay_user');
    window.location.href = '/estudiante';
  };

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <Background />
        <div className="relative z-10 text-surface-500 font-extrabold">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-5 pb-16 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        <header className="mb-6 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={() => { audioManager.play('back'); window.location.href = '/inicio'; }}
            aria-label="Volver"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-surface-700 shadow-card"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-surface-800">Configuracion</h1>
            <p className="text-xs font-black text-surface-500">Configuracion de la cuenta</p>
          </div>
        </header>

        {user?.modo === 'invitado' && (
          <div className="mb-5 rounded-2xl border-2 border-edu-yellow/40 bg-edu-yellow-light/40 p-4 text-sm font-bold text-[#8a6d1a]">
            Estas jugando como invitado. Crea una cuenta para editar tu perfil.
          </div>
        )}

        {/* Informacion personal */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-game mb-4 p-5"
        >
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-edu-pink">
            Informacion personal
          </h2>

          <form onSubmit={savePersonal} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Nombre"
                value={nombre}
                onChange={setNombre}
                disabled={user?.modo === 'invitado'}
                error={nombreError}
                icon={<User size={16} />}
              />
              <InputField
                label="Apellido"
                value={apellido}
                onChange={setApellido}
                disabled={user?.modo === 'invitado'}
                icon={<User size={16} />}
              />
            </div>

            {saveMsg && (
              <p className={`text-center text-sm font-black ${saveMsg.ok ? 'text-edu-green-dark' : 'text-edu-pink'}`}>
                {saveMsg.ok && <Check size={14} className="mr-1 inline align-middle" />}
                {saveMsg.text}
              </p>
            )}

            {user?.modo !== 'invitado' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97, y: 2 }}
                type="submit"
                disabled={saving}
                className="btn-game mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-edu-pink py-3.5 text-sm text-white disabled:opacity-70"
                style={{ boxShadow: '0 5px 0 rgba(217, 101, 154, 0.4), 0 8px 22px rgba(235,93,112,0.3)' }}
              >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </motion.button>
            )}
          </form>
        </motion.section>

        {/* Correo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-game mb-4 p-5"
        >
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-edu-blue">
            Correo
          </h2>
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-0 flex h-full items-center text-edu-blue">
              <Mail size={18} />
            </div>
            <input
              value={user?.correo || '—'}
              readOnly
              className="input-game cursor-not-allowed bg-surface-100 pl-11 text-surface-500"
            />
          </div>
          <p className="mt-2 text-xs font-bold text-surface-400">
            No es posible editar el correo en esta pantalla.
          </p>
        </motion.section>

        {/* Seguridad */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-game mb-4 p-5"
        >
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-edu-orange">
            Seguridad
          </h2>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 2 }}
            onClick={() => {
              audioManager.play('toggle');
              setPasswordOpen(!passwordOpen);
              setPwError(null);
              setPwSuccess(null);
            }}
            disabled={user?.modo === 'invitado'}
            className="flex w-full items-center justify-between rounded-xl border-2 border-surface-200 bg-white/60 px-4 py-3.5 text-sm font-black text-surface-700 disabled:cursor-not-allowed disabled:text-surface-400"
          >
            <span className="flex items-center gap-2">
              <Key size={18} /> Contrasena
            </span>
            <motion.span animate={{ rotate: passwordOpen ? 180 : 0 }}>
              <ChevronDown size={18} />
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {passwordOpen && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={savePassword}
                className="mt-3 flex flex-col gap-3 overflow-hidden"
              >
                <InputField label="Contrasena actual" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" />
                <InputField label="Nueva contrasena" value={newPw} onChange={setNewPw} type="password" placeholder="Minimo 4 caracteres" />
                <InputField label="Confirmar nueva contrasena" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Repite la nueva contrasena" />

                {(pwError || pwSuccess) && (
                  <p className={`text-center text-sm font-black ${pwError ? 'text-edu-pink' : 'text-edu-green-dark'}`}>
                    {pwError || pwSuccess}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97, y: 2 }}
                  type="submit"
                  disabled={savingPw}
                  className="btn-game w-full rounded-xl bg-edu-orange py-3.5 text-sm text-white disabled:opacity-70"
                  style={{ boxShadow: '0 5px 0 rgba(255, 160, 0, 0.4), 0 8px 22px rgba(255,160,0,0.3)' }}
                >
                  {savingPw ? 'Guardando...' : 'Guardar nueva contrasena'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Cerrar sesion */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 2 }}
            onClick={() => { audioManager.play('delete'); logout(); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-edu-pink/30 bg-edu-pink/5 py-4 text-sm font-black text-edu-pink"
          >
            <LogOut size={18} />
            Cerrar sesion
          </motion.button>
        </motion.section>
      </motion.div>
    </main>
  );
}

function InputField({ label, value, onChange, disabled, error, type = 'text', placeholder, icon }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black text-surface-500">{label}</label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-0 flex h-full items-center text-edu-orange">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`input-game text-sm ${error ? 'border-edu-pink' : ''} ${icon ? 'pl-11' : ''} ${disabled ? 'cursor-not-allowed bg-surface-100 text-surface-400' : ''}`}
        />
      </div>
    </div>
  );
}

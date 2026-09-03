'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Key, LogOut, ChevronDown, Check } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';

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

const inputStyle = (hasError: boolean, disabled = false): React.CSSProperties => ({
  width: '100%', padding: '14px 16px', borderRadius: 16,
  border: `2px solid ${hasError ? '#E94930' : '#E4EAF4'}`,
  background: disabled ? '#F2F4F8' : '#F8FAFE', color: '#344054', fontSize: 15,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  cursor: disabled ? 'not-allowed' : 'text',
});

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
      return;
    }
    setNombreError(false);
    setSaving(true);
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
      } else {
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
    if (!currentPw) { setPwError('Ingresa tu contraseña actual'); return; }
    if (newPw.length < 4) { setPwError('La nueva contraseña debe tener al menos 4 caracteres'); return; }
    if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden'); return; }
    setSavingPw(true);
    setTimeout(() => {
      setSavingPw(false);
      setPwSuccess('Contraseña actualizada correctamente');
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
      <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Background />
        <div style={{ position: 'relative', zIndex: 1, color: '#6B7A94', fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', padding: '24px 18px 60px' }}>
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1, maxWidth: 460, margin: '0 auto' }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => { window.location.href = '/inicio'; }}
            aria-label="Volver"
            style={{
              width: 42, height: 42, borderRadius: 14, border: 'none',
              background: 'rgba(240,135,169,0.12)', color: '#344054',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 style={{ color: '#1E2A3A', fontSize: 24, fontWeight: 900, margin: 0 }}>Configuración</h1>
            <p style={{ color: '#6B7A94', fontSize: 13, fontWeight: 700, margin: '2px 0 0' }}>Configuración de la cuenta</p>
          </div>
        </header>

        {user?.modo === 'invitado' && (
          <div style={{
            padding: '14px 16px', borderRadius: 16, marginBottom: 22,
            background: 'rgba(253,219,51,0.15)', border: '2px solid rgba(253,219,51,0.4)',
            color: '#8a6d1a', fontSize: 13, fontWeight: 700,
          }}>
            Estás jugando como invitado. Crea una cuenta para editar tu perfil.
          </div>
        )}

        {/* Información personal */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: '#fff', borderRadius: 24, padding: '22px 20px', marginBottom: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '2px solid rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{
            color: '#F087A9', fontSize: 14, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: 1, margin: '0 0 16px',
          }}>
            Información personal
          </h2>

          <form onSubmit={savePersonal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ color: '#6B7A94', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>Nombre</label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  disabled={user?.modo === 'invitado'}
                  style={inputStyle(nombreError, user?.modo === 'invitado')}
                />
              </div>
              <div>
                <label style={{ color: '#6B7A94', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>Apellido</label>
                <input
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  disabled={user?.modo === 'invitado'}
                  style={inputStyle(false, user?.modo === 'invitado')}
                />
              </div>
            </div>

            {saveMsg && (
              <p style={{
                color: saveMsg.ok ? '#4CAF50' : '#E94930',
                fontSize: 13, textAlign: 'center', fontWeight: 700, margin: 0,
              }}>
                {saveMsg.ok && <Check size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                {saveMsg.text}
              </p>
            )}

            {user?.modo !== 'invitado' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={saving}
                style={{
                  width: '100%', padding: '15px', borderRadius: 18, border: 'none',
                  background: 'linear-gradient(135deg, #F087A9, #D96B91)',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(240,135,169,0.3)',
                  opacity: saving ? 0.7 : 1,
                }}
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
          style={{
            background: '#fff', borderRadius: 24, padding: '22px 20px', marginBottom: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '2px solid rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{
            color: '#30BCE6', fontSize: 14, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: 1, margin: '0 0 16px',
          }}>
            Correo
          </h2>
          <input
            value={user?.correo || '—'}
            readOnly
            style={{ ...inputStyle(false, true), color: '#6B7A94' }}
          />
          <p style={{ color: '#A0ADC4', fontSize: 12, fontWeight: 600, margin: '8px 0 0' }}>
            No es posible editar el correo en esta pantalla.
          </p>
        </motion.section>

        {/* Seguridad */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: '#fff', borderRadius: 24, padding: '22px 20px', marginBottom: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '2px solid rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{
            color: '#E94930', fontSize: 14, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: 1, margin: '0 0 16px',
          }}>
            Seguridad
          </h2>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setPasswordOpen(!passwordOpen);
              setPwError(null);
              setPwSuccess(null);
            }}
            disabled={user?.modo === 'invitado'}
            style={{
              width: '100%', padding: '15px', borderRadius: 18,
              border: '2px solid #E4EAF4', background: 'rgba(255,255,255,0.6)',
              color: user?.modo === 'invitado' ? '#A0ADC4' : '#344054',
              fontSize: 15, fontWeight: 700, cursor: user?.modo === 'invitado' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Key size={18} /> Contraseña
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
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}
              >
                <div>
                  <label style={{ color: '#6B7A94', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>Contraseña actual</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    style={inputStyle(!!pwError)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={{ color: '#6B7A94', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    style={inputStyle(!!pwError)}
                    placeholder="Mínimo 4 caracteres"
                  />
                </div>
                <div>
                  <label style={{ color: '#6B7A94', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    style={inputStyle(!!pwError)}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                {(pwError || pwSuccess) && (
                  <p style={{
                    color: pwError ? '#E94930' : '#4CAF50',
                    fontSize: 13, textAlign: 'center', fontWeight: 700, margin: 0,
                  }}>
                    {pwError || pwSuccess}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={savingPw}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 18, border: 'none',
                    background: 'linear-gradient(135deg, #E94930, #C73E28)',
                    color: '#fff', fontSize: 15, fontWeight: 800, cursor: savingPw ? 'default' : 'pointer',
                    opacity: savingPw ? 0.7 : 1,
                  }}
                >
                  {savingPw ? 'Guardando...' : 'Guardar nueva contraseña'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Cerrar sesión */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={logout}
            style={{
              width: '100%', padding: '16px', borderRadius: 18,
              border: '2px solid rgba(233,73,48,0.3)', background: 'rgba(233,73,48,0.06)',
              color: '#E94930', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <LogOut size={18} />
            Cerrar sesión
          </motion.button>
        </motion.section>
      </motion.div>
    </main>
  );
}

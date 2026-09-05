'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Sparkles, Flame, GitBranch } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { ProfileModal } from './ProfileModal';
import { audioManager } from '@/shared/lib/audio';

interface StoredUser {
  id_usuario: number;
  nombre: string;
  avatar_id: number;
  correo?: string;
  modo: 'registrado' | 'invitado';
}

interface Perfil {
  usuario: {
    id_usuario: number;
    nombre: string;
    apellido?: string;
    correo?: string;
    fecha_registro?: string;
    avatar: {
      id_avatar: number;
      nombre: string;
      imagen: string;
    };
  };
  puntos: number;
  rango: {
    nombre: string;
    color: string;
    barColor: string;
    esMaximo: boolean;
    progreso: number;
    puntosRangoActual: number;
    puntosParaSiguiente: number;
    siguiente: string | null;
  };
}

const AVATAR_EMOJIS: Record<number, string> = {
  1: '🧭',
  2: '🔭',
  3: '📚',
  4: '⚔️',
  5: '🪄',
  6: '🥷',
};

const RANGO_IMAGEN: Record<string, string> = {
  Bronce: '/images/rangos/bronce.png',
  Plata: '/images/rangos/plata.png',
  Oro: '/images/rangos/oro.png',
  Diamante: '/images/rangos/diamante.png',
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


const DEFAULT_PERFIL: Perfil = {
  usuario: {
    id_usuario: 0,
    nombre: 'Jugador',
    apellido: '',
    fecha_registro: new Date().toISOString(),
    avatar: { id_avatar: 1, nombre: 'Aventurero', imagen: 'aventurero.png' },
  },
  puntos: 0,
  rango: {
    nombre: 'Bronce',
    color: '#B87333',
    barColor: 'linear-gradient(90deg, #B87333, #CD7F32)',
    esMaximo: false,
    progreso: 0,
    puntosRangoActual: 0,
    puntosParaSiguiente: 1000,
    siguiente: 'Plata',
  },
};

export function DashboardScreen() {
  const [perfil, setPerfil] = useState<Perfil>(DEFAULT_PERFIL);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFocused, setAvatarFocused] = useState(false);
  const [salaCode, setSalaCode] = useState('');
  const [salaLoading, setSalaLoading] = useState(false);
  const [salaError, setSalaError] = useState<string | null>(null);
  const [showGameSelect, setShowGameSelect] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('eduplay_user') : null;
    if (!raw) {
      window.location.href = '/estudiante';
      return;
    }

    const stored: StoredUser = JSON.parse(raw);

    const t1 = setTimeout(() => {
      audioManager.playWelcome();
    }, 800);

    if (stored.modo === 'invitado') {
      setPerfil({
        ...DEFAULT_PERFIL,
        usuario: {
          ...DEFAULT_PERFIL.usuario,
          id_usuario: stored.id_usuario,
          nombre: stored.nombre,
          avatar: { ...DEFAULT_PERFIL.usuario.avatar, id_avatar: stored.avatar_id },
        },
      });
      setLoading(false);
      return () => clearTimeout(t1);
    }

    fetch(`/api/estudiante/perfil?usuario_id=${stored.id_usuario}`)
      .then(res => res.json())
      .then((data: Perfil) => {
        if (data.usuario) setPerfil(data);
      })
      .catch(() => setPerfil(DEFAULT_PERFIL))
      .finally(() => setLoading(false));

    return () => clearTimeout(t1);
  }, []);

  const unirseASala = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalaError(null);
    if (!salaCode.trim()) {
      setSalaError('Ingresa un código de sala');
      audioManager.play('error');
      return;
    }
    setSalaLoading(true);
    setTimeout(() => {
      setSalaLoading(false);
      setShowGameSelect(true);
    }, 600);
  };

  const avatarEmoji = AVATAR_EMOJIS[perfil.usuario.avatar.id_avatar] || '🧑‍🎓';
  const rangoImagen = RANGO_IMAGEN[perfil.rango.nombre] || '/images/rangos/bronce.png';

  const rankColor = perfil.rango.color;

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Background />
        <div style={{ position: 'relative', zIndex: 1, color: '#6B7A94', fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', padding: '24px 18px 40px' }}>
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 480, margin: '0 auto',
        }}
      >
        {/* Encabezado */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { audioManager.play('click'); setProfileOpen(true); }}
              onFocus={() => setAvatarFocused(true)}
              onBlur={() => setAvatarFocused(false)}
              aria-label="Abrir mi perfil"
              title="Mi perfil"
              style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'linear-gradient(135deg, #F087A9, #30BCE6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: avatarFocused ? '0 0 0 3px #30BCE6, 0 4px 16px rgba(48,188,230,0.25)' : '0 4px 16px rgba(48,188,230,0.25)',
                border: 'none', cursor: 'pointer', padding: 0,
                outline: 'none', transition: 'box-shadow 0.2s',
              }}
            >
              {avatarEmoji}
            </motion.button>
            <div>
              <div style={{
                fontSize: 24, fontWeight: 800, color: '#1E2A3A', lineHeight: 1.1,
              }}>
                {perfil.usuario.nombre}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#6B7A94', marginTop: 2,
              }}>
                ¡Bienvenido de nuevo!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => audioManager.play('click')}
              style={{
                width: 42, height: 42, borderRadius: 14, border: 'none',
                background: 'rgba(255,255,255,0.7)', color: '#6B7A94',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                borderBottom: '2px solid #E4EAF4',
              }}>
              <Settings size={20} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => audioManager.play('click')}
              style={{
                width: 42, height: 42, borderRadius: 14, border: 'none',
                background: 'rgba(255,255,255,0.7)', color: '#6B7A94',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                borderBottom: '2px solid #E4EAF4', position: 'relative',
              }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute', top: 9, right: 9,
                width: 8, height: 8, borderRadius: '50%', background: '#E94930',
              }} />
            </motion.button>
          </div>
        </header>

        {/* Tarjeta de rango */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: '#fff',
            borderRadius: 28,
            padding: '26px 22px 24px',
            boxShadow: `0 8px 32px ${withAlpha(rankColor, 0.12)}`,
            border: '2px solid rgba(0,0,0,0.04)',
            marginBottom: 22,
            textAlign: 'center',
          }}
        >
          <p style={{
            color: '#6B7A94', fontSize: 12, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px',
          }}>
            Tu rango actual
          </p>

          <div style={{
            width: 180, height: 180, margin: '0 auto 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src={rangoImagen}
              alt={perfil.rango.nombre}
              draggable={false}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.12))',
              }}
            />
          </div>

          <div style={{
            fontSize: 20, fontWeight: 800, color: '#1E2A3A', margin: '10px 0 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <img src="/images/puntos.png" alt="Puntos" draggable={false}
              style={{ width: 24, height: 24, objectFit: 'contain' }} />
            <span>{perfil.puntos.toLocaleString('es-ES')}</span>
            <span style={{ color: '#6B7A94', fontWeight: 700, fontSize: 15 }}>puntos</span>
          </div>

          {/* Barra de progreso */}
          <div style={{
            height: 16, borderRadius: 999,
            background: '#F0F4FA',
            overflow: 'hidden',
            marginBottom: 12,
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${perfil.rango.progreso}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${rankColor}, ${withAlpha(rankColor, 0.7)})`,
                borderRadius: 999,
              }}
            />
          </div>

          <p style={{
            color: '#6B7A94', fontSize: 13, fontWeight: 700, margin: 0,
          }}>
            {perfil.rango.esMaximo
              ? '¡Has alcanzado el rango máximo!'
              : `Próximo rango: ${perfil.rango.siguiente} — faltan ${perfil.rango.puntosParaSiguiente} puntos`}
          </p>
        </motion.div>

        {/* Card: Unirse a una sala */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            background: 'linear-gradient(155deg, #F97316 0%, #EF4444 45%, #EC4899 100%)',
            borderRadius: 28,
            padding: '24px 22px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Sparkles size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: 22, right: 22 }} />

          {!showGameSelect ? (
            <>
              <h2 style={{
                color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 6px',
                lineHeight: 1.2, maxWidth: 200,
              }}>
                Unirse a una sala
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700,
                margin: '0 0 18px', lineHeight: 1.5, maxWidth: 260,
              }}>
                Ingresa el código que te dio tu docente para unirte a la sala.
              </p>

              <form onSubmit={(e) => { audioManager.play('submit'); unirseASala(e); }} style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <input
                  value={salaCode}
                  onChange={(e) => setSalaCode(e.target.value.toUpperCase())}
                  placeholder="Ingresa el código"
                  disabled={salaLoading}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.95)', color: '#1E2A3A', fontSize: 15,
                    outline: 'none', fontWeight: 700, letterSpacing: 1,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.6), 0 2px 10px rgba(0,0,0,0.08)'; }}
                  onBlur={e => { e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'; }}
                />
                <motion.button
                  whileHover={{ scale: salaLoading ? 1 : 1.04 }}
                  whileTap={{ scale: salaLoading ? 1 : 0.96 }}
                  type="submit"
                  disabled={salaLoading}
                  style={{
                    padding: '14px 22px', borderRadius: 16, border: 'none',
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: '#fff', fontSize: 15, fontWeight: 800,
                    cursor: salaLoading ? 'default' : 'pointer',
                    opacity: salaLoading ? 0.7 : 1,
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {salaLoading ? 'Uniendo...' : 'Unirse'}
                </motion.button>
              </form>

              {salaError && (
                <p style={{
                  color: '#FEE2E2', fontSize: 13, fontWeight: 700, margin: '10px 0 0',
                  textShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}>
                  {salaError}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 style={{
                color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 4px',
              }}>
                ¡Sala {salaCode}!
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700,
                margin: '0 0 18px',
              }}>
                Elige un juego para comenzar
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.03, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { audioManager.play('navigate'); window.location.href = '/lava-conocimiento'; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', borderRadius: 18, border: 'none',
                    background: 'rgba(255,255,255,0.95)',
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: 'linear-gradient(135deg, #EF4444, #F97316)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Flame size={24} color="#fff" />
                  </div>
                  <div>
                    <div style={{ color: '#1E2A3A', fontSize: 16, fontWeight: 800 }}>
                      Modo Lava
                    </div>
                    <div style={{ color: '#6B7A94', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                      Responde antes de que se enfríe
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { audioManager.play('navigate'); window.location.href = '/camino-decisiones'; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', borderRadius: 18, border: 'none',
                    background: 'rgba(255,255,255,0.95)',
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <GitBranch size={24} color="#fff" />
                  </div>
                  <div>
                    <div style={{ color: '#1E2A3A', fontSize: 16, fontWeight: 800 }}>
                      Camino de Decisiones
                    </div>
                    <div style={{ color: '#6B7A94', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                      Elige el camino correcto
                    </div>
                  </div>
                </motion.button>
              </div>

              <button
                onClick={() => {
                  audioManager.play('back');
                  setShowGameSelect(false);
                  setSalaCode('');
                }}
                style={{
                  marginTop: 14, background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Volver
              </button>
            </>
          )}
        </motion.div>
      </motion.div>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        perfil={perfil}
      />
    </main>
  );
}

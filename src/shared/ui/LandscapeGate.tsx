'use client';

import { useLandscapeLock } from '@/shared/hooks/useLandscapeLock';

interface Props {
  /** false mientras la partida ya terminó (results/completed/defeat): libera el bloqueo. */
  enabled?: boolean;
}

/**
 * LandscapeGate — pantalla que exige horizontal en móvil/tablet durante una partida.
 * Se monta dentro de los 4 Canvas de juego (cubre también /practica/jugar).
 * z-index 90: cubre todo el gameplay (HUD/controles <= 61) pero deja por encima
 * al GameMenuButton (z 100) para poder abandonar incluso en vertical.
 */
export function LandscapeGate({ enabled = true }: Props) {
  const { blocked } = useLandscapeLock(enabled);

  if (!blocked) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Gira tu dispositivo a horizontal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(5,8,16,0.94)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overscrollBehavior: 'contain',
        touchAction: 'none',
        textAlign: 'center',
      }}
    >
      <style>{`
        @keyframes landscapeGateRotate {
          0%, 15% { transform: rotate(0deg); }
          45%, 65% { transform: rotate(-90deg); }
          95%, 100% { transform: rotate(0deg); }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '32px 28px',
          borderRadius: 24,
          maxWidth: 520,
          background: 'linear-gradient(165deg, rgba(26,32,52,0.96) 0%, rgba(10,14,26,0.96) 60%, rgba(8,11,20,0.96) 100%)',
          border: '1px solid rgba(255,214,0,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Teléfono en vertical que gira a horizontal */}
        <svg
          width="104"
          height="104"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
          style={{ animation: 'landscapeGateRotate 3s ease-in-out infinite', transformOrigin: 'center' }}
        >
          <rect x="38" y="24" width="44" height="72" rx="10" fill="rgba(255,214,0,0.08)" stroke="#FFD600" strokeWidth="4" />
          <rect x="45" y="34" width="30" height="48" rx="4" fill="rgba(255,214,0,0.22)" />
          <circle cx="60" cy="90" r="3.5" fill="#FFD600" />
        </svg>

        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-baloo)',
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 900,
            color: '#FFD600',
            textShadow: '0 2px 14px rgba(255,214,0,0.35)',
            lineHeight: 1.1,
          }}
        >
          Gira tu dispositivo
        </h2>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-nunito)',
            fontSize: 'clamp(15px, 3.4vw, 19px)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.5,
            maxWidth: 420,
          }}
        >
          Este modo se juega en horizontal. Gira tu teléfono o tablet hasta que la pantalla quede de lado.
        </p>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-nunito)',
            fontSize: 'clamp(13px, 2.8vw, 15px)',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.4,
            maxWidth: 420,
          }}
        >
          En cuanto gires el dispositivo podrás seguir jugando.
        </p>
      </div>
    </div>
  );
}

'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurvivalStore } from '@/stores/survival.store';

/**
 * Grupo 3 (supervivencia): HUD compartido por los 4 juegos (se monta junto al
 * botón de menú). Muestra SOLO los indicadores cuyo modificador está activo:
 * - 'vida_limitada': ❤️❤️❤️ con las vidas restantes (capa EXTRA del modo).
 * - 'racha_obligatoria': racha actual y su multiplicador (×1..×4).
 * - 'error_acumulativo': errores consecutivos del fallo actual.
 * - 'ultima_oportunidad': banner ⚠ ÚLTIMA OPORTUNIDAD tras el primer error.
 * Todo lo pintado aquí deriva del servidor (GET/POST /api/partida): el
 * cliente nunca envía ni decide estas cantidades. Sin modificadores del
 * Grupo 3 no se pinta NADA (estética de las demás partidas intacta).
 * `data-chaos-*` son anclas de tests.
 */
export function ChaosSurvivalHud() {
  const modifiers = useSurvivalStore((s) => s.modifiers);
  const vidas = useSurvivalStore((s) => s.vidas);
  const racha = useSurvivalStore((s) => s.racha);
  const errores = useSurvivalStore((s) => s.errores);
  const critico = useSurvivalStore((s) => s.critico);
  const eliminated = useSurvivalStore((s) => s.eliminated);

  if (modifiers.length === 0) return null;

  const showLives = modifiers.includes('vida_limitada') && typeof vidas === 'number';
  const showRacha = modifiers.includes('racha_obligatoria') && typeof racha === 'number';
  const showErrores = modifiers.includes('error_acumulativo') && typeof errores === 'number';
  const showCritico = modifiers.includes('ultima_oportunidad') && critico && !eliminated;

  const pill = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.14)',
    backdropFilter: 'blur(8px)',
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.5,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <>
      {(showLives || showRacha || showErrores) && (
        <div
          data-chaos-survival
          style={{
            position: 'fixed',
            left: 14,
            top: 14,
            zIndex: 97,
            display: 'flex',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          {showLives && (
            <span
              data-chaos-lives
              aria-label={`Vidas restantes: ${vidas}`}
              style={{ ...pill, color: '#ff8a80', textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} style={{ opacity: i < (vidas ?? 0) ? 1 : 0.28, fontSize: 14 }}>
                  ❤️
                </span>
              ))}
            </span>
          )}
          {showRacha && (
            <span
              data-chaos-racha
              aria-label={`Racha: ${racha}`}
              style={{ ...pill, color: '#ffd166', textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
            >
              🔥 {racha}
              {(racha ?? 0) >= 2 ? ` ×${Math.min(racha ?? 1, 4)}` : ''}
            </span>
          )}
          {showErrores && (
            <span
              data-chaos-errores
              aria-label={`Errores consecutivos: ${errores}`}
              style={{ ...pill, color: '#ff9d6b', textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
            >
              ✖ {errores}
            </span>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCritico && (
          <motion.div
            key="ultima-oportunidad"
            data-chaos-critico
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              position: 'fixed',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 97,
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: 'rgba(120,10,10,0.82)',
              border: '1px solid rgba(255,120,120,0.55)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 6px 24px rgba(233,73,48,0.35)',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 1,
              color: '#ffd9d0',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-baloo)',
            }}
          >
            ⚠ ÚLTIMA OPORTUNIDAD
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

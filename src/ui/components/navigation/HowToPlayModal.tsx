'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Flame, Footprints, Move, MousePointerClick, Trophy, Heart, Star } from 'lucide-react';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'lava' | 'decisiones';
}

function LavaInstructions() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
          <Flame size={20} className="text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-white">La Lava del Conocimiento</h3>
      </div>

      <div className="space-y-3 text-sm text-surface-300">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-1 font-semibold text-white">Controles</p>
          <p>No hay movimiento manual. Tu personaje (un avatar estilo Roblox) permanece de pie sobre una plataforma rocosa flotante sobre el lava. La camara orbita automaticamente alrededor del personaje.</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-1 font-semibold text-white">Como responder</p>
          <p>En cada ronda aparece una tarjeta de pregunta en la parte superior de la pantalla con dos botones: <span className="font-bold text-blue-400">A</span> y <span className="font-bold text-blue-400">B</span>. Toca o haz clic en el boton de tu respuesta. Una vez seleccionado, no se puede cambiar.</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Que pasa al responder</p>
          <div className="space-y-1.5">
            <p><span className="font-bold text-green-400">Correcta:</span> +15 puntos, +1 tick de vida. La torre sube un bloque y tu personaje asciende sobre el lava.</p>
            <p><span className="font-bold text-red-400">Incorrecta:</span> -5 puntos (minimo 0), -1 tick de vida. La torre baja un bloque y tu personaje desciende hacia el lava. Se muestra la respuesta correcta.</p>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">El sistema de ticks (vidas)</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              <span><b className="text-green-400">3 ticks (maximo)</b> — Torre alta, estas seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              <span><b className="text-yellow-400">2 ticks (inicio)</b> — Nivel inicial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
              <span><b className="text-orange-400">1 tick</b> — Peligro! Se activa un efecto de latido cardiaco y un overlay rojo pulsante en los bordes de la pantalla</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span><b className="text-red-400">0 ticks</b> — Derrota — tu plataforma se hunde en el lava con efecto de humo</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-surface-400">Los ticks se representan visualmente como iconos de fuego animados en el panel izquierdo del HUD.</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-1 font-semibold text-white">Puntuacion</p>
          <p>Se muestra en la esquina inferior con un icono de moneda dorada. Sube/baja con animacion.</p>
        </div>
      </div>
    </>
  );
}

function DecisionesInstructions() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20">
          <Footprints size={20} className="text-teal-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Camino de Decisiones</h3>
      </div>

      <div className="space-y-3 text-sm text-surface-300">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Controles</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Move size={14} className="text-surface-400" />
              <span><b className="text-white">W / Flecha arriba</b> — Avanzar</span>
            </div>
            <div className="flex items-center gap-2">
              <Move size={14} className="text-surface-400 rotate-180" />
              <span><b className="text-white">S / Flecha abajo</b> — Retroceder</span>
            </div>
            <div className="flex items-center gap-2">
              <Move size={14} className="text-surface-400 -rotate-90" />
              <span><b className="text-white">A / Flecha izquierda</b> — Izquierda</span>
            </div>
            <div className="flex items-center gap-2">
              <Move size={14} className="text-surface-400 rotate-90" />
              <span><b className="text-white">D / Flecha derecha</b> — Derecha</span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 size={14} className="text-surface-400" />
              <span><b className="text-white">Espacio</b> — Saltar</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Como responder</p>
          <p>Cada estacion tiene dos paneles grandes: <span className="font-bold text-red-400">A</span> (izquierda) y <span className="font-bold text-teal-400">B</span> (derecha). Camina al lado correcto antes de llegar a la estacion. <b className="text-white">Tu posicion fisica ES la respuesta</b> — no hay botones.</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Puntuacion</p>
          <div className="space-y-1">
            <p><span className="font-bold text-green-400">Correcta:</span> +10 puntos, +15 XP</p>
            <p><span className="font-bold text-red-400">Incorrecta:</span> -5 puntos, racha reiniciada</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function HowToPlayModal({ open, onClose, mode }: HowToPlayModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="mx-3 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[22px] border border-white/5 bg-surface-900/95 p-5 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 size={20} className="text-white" />
                <h2 className="text-lg font-bold text-white">Como se juega</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-surface-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {mode === 'lava' ? <LavaInstructions /> : <DecisionesInstructions />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Move } from 'lucide-react';
import { ModeLogo } from '@/shared/lib/game-modes';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'lava' | 'decisiones' | 'tierras' | 'abismos';
}

function LavaInstructions() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <ModeLogo mode="lava" size={64} shape="square" imgScale={1} />
        <h3 className="text-lg font-bold text-white">Bajo Presión</h3>
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
        <ModeLogo mode="decisiones" size={64} shape="square" imgScale={1} />
        <h3 className="text-lg font-bold text-white">Rumbo</h3>
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

function TierrasInstructions() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <ModeLogo mode="tierras" size={64} shape="square" imgScale={1} />
        <h3 className="text-lg font-bold text-white">Tierras Hundidas</h3>
      </div>

      <div className="space-y-3 text-sm text-surface-300">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-1 font-semibold text-white">De que se trata</p>
          <p>Un platformer educativo en un manglar inundado. Avanza por 15 pares de plataformas flotantes respondiendo correctamente. Si fallas, la plataforma se hunde y caes al agua — fin de la partida. Llega a la plataforma final con la mayor cantidad de puntos.</p>
        </div>

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
              <span><b className="text-white">Espacio</b> — Saltar (solo en el suelo; no se puede saltar en el aire)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Como responder</p>
          <p>Cada pregunta presenta dos plataformas lado a lado: <span className="font-bold text-red-400">A</span> (roja, izquierda) y <span className="font-bold text-blue-400">B</span> (azul, derecha). Mueve tu personaje hasta la plataforma correcta. <b className="text-white">Tu posicion fisica ES la respuesta</b> — no hay botones de opcion. La tarjeta de pregunta y las opciones A/B se muestran tambien en el HUD para consultar.</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Que pasa al responder</p>
          <div className="space-y-1.5">
            <p><span className="font-bold text-green-400">Correcta:</span> +20 puntos, +20 XP. La plataforma se mantiene firme y avanzas a la siguiente pregunta.</p>
            <p><span className="font-bold text-red-400">Incorrecta:</span> Sin puntos. La plataforma elegida se hunde en el manglar y caes al agua — partida terminada.</p>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Cuidado con el agua</p>
          <p>No hay barreras invisibles ni vidas adicionales. Si caes al agua del manglar por cualquier motivo (mala eleccion, salto fallido, etc.), la partida termina inmediatamente. La puntuacion acumulada hasta ese momento se conserva en los resultados.</p>
        </div>
      </div>
    </>
  );
}

function AbismosInstructions() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <ModeLogo mode="abismos" size={64} shape="square" imgScale={1} />
        <h3 className="text-lg font-bold text-white">Entre Abismos</h3>
      </div>

      <div className="space-y-3 text-sm text-surface-300">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-1 font-semibold text-white">De que se trata</p>
          <p>Aventura en la noche con plataformas flotantes sobre un abismo. Primero responde 15 preguntas para construir un puente de plataformas; despues cruza libremente hasta la montana final y toca el cristal dorado. Si te quedas sin plataformas o caes al abismo, pierdes.</p>
        </div>

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
              <span><b className="text-white">Espacio</b> — Saltar (solo en el suelo; no se puede saltar en el aire)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Fase 1: Construir el puente (preguntas)</p>
          <p>En la parte superior aparece la pregunta y dos tarjetas: <span className="font-bold text-red-400">A</span> y <span className="font-bold text-blue-400">B</span>. Toca o haz clic en la respuesta correcta — una vez elegida, no se puede cambiar. Cada acierto suma una plataforma al puente (maximo 5); cada fallo quita una. Si terminas las preguntas con <b className="text-red-400">0 plataformas</b>, es derrota inmediata.</p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Fase 2: Cruzar el puente</p>
          <p>Despues de las preguntas, controlas libremente al personaje para saltar de plataforma en plataforma hasta la montana final con el cristal dorado. <b className="text-white">Si caes al abismo, la puntuacion final es 0.</b></p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-2 font-semibold text-white">Puntuacion</p>
          <div className="space-y-1">
            <p><span className="font-bold text-green-400">Correcta:</span> +20 puntos, +20 XP, +1 plataforma</p>
            <p><span className="font-bold text-red-400">Incorrecta:</span> -1 plataforma (minimo 0), sin penalizacion de puntos (ganas 0 en esa pregunta)</p>
            <p><span className="font-bold text-red-400">0 plataformas al terminar preguntas:</span> Derrota, puntuacion = 0</p>
            <p><span className="font-bold text-red-400">Caer al abismo:</span> Puntuacion final = 0</p>
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

            {mode === 'lava' ? <LavaInstructions /> : mode === 'tierras' ? <TierrasInstructions /> : mode === 'abismos' ? <AbismosInstructions /> : <DecisionesInstructions />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Settings } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../utils';
import { audioManager } from '../../lib/audio';
import { useClickLock } from '../../hooks/useClickLock';
import { GameIcon, GAME_ICON_COLORS } from '../../ui/game-icons';

interface GameCardProps {
  nombre: string;
  descripcion: string;
  color: string;
  juegoId: string;
  activo: boolean;
  preguntasActivas: number;
  onCrearSala?: () => void;
  onAdministrar?: () => void;
}

export function GameCard({ nombre, descripcion, color, juegoId, activo, preguntasActivas, onCrearSala, onAdministrar }: GameCardProps) {
  const clickLock = useClickLock();
  const iconColors = GAME_ICON_COLORS[juegoId];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/20 to-white p-5 shadow-sm transition-all duration-300 hover:shadow-glow-violet hover:border-violet-300 cursor-default card-shimmer card-corner-decoration'
      )}
    >
      {/* Decorative elements */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-300 opacity-[0.04] pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-purple-300 opacity-[0.03] pointer-events-none" />
      <div className="flex items-start gap-4">
        <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl flex items-center justify-center ${iconColors?.bg ?? 'bg-gray-50'}`}>
          <GameIcon juegoId={juegoId} className={iconColors?.text ?? 'text-gray-400'} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold tracking-tight text-foreground">{nombre}</h3>
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">{descripcion}</p>
          <div className="mt-2">
            <span className="text-xs text-gray-400 font-medium">{preguntasActivas} preguntas</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => { if (!clickLock()) return; audioManager.play('click'); onAdministrar?.(); }}
        >
          <Settings className="mr-1 h-3.5 w-3.5" /> Administrar
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => { if (!clickLock()) return; audioManager.play('click'); onCrearSala?.(); }}
        >
          Crear sala <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

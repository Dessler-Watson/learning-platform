'use client';

import { ArrowLeft } from 'lucide-react';
import { cn } from '../../utils';
import { audioManager } from '../../lib/audio';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
}

export function BackButton({ onClick, className }: BackButtonProps) {
  return (
    <button
      onClick={() => { audioManager.play('navigate'); onClick?.(); }}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl border-2 border-[#00A0B5]/30 bg-[#00A0B5]/10 px-4 py-2.5 text-sm font-semibold text-[#00A0B5] transition-all duration-200 hover:bg-[#00A0B5]/20 hover:border-[#00A0B5]/50 hover:shadow-md hover:shadow-[#00A0B5]/10 active:scale-95',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  );
}

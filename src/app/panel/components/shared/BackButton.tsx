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
        'flex h-9 w-9 items-center justify-center rounded-full border border-[#407516]/40 text-[#407516] transition-all duration-200 hover:bg-[#407516]/10 hover:border-[#407516]/60 hover:text-[#407516] active:scale-95',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}

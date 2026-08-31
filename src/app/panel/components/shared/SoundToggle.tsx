'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../ui/button';
import { audioManager } from '../../lib/audio';
import { useState, useEffect } from 'react';
import { useClickLock } from '../../hooks/useClickLock';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const clickLock = useClickLock();

  useEffect(() => {
    setMounted(true);
    setEnabled(audioManager.isEnabled());
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (!clickLock()) return;
        const next = audioManager.toggle();
        setEnabled(next);
        if (next) {
          audioManager.play('click');
          audioManager.startAmbient();
        }
      }}
      aria-label={enabled ? 'Desactivar sonidos' : 'Activar sonidos'}
      className="text-gray-400 transition-colors duration-200 hover:text-foreground"
    >
      {enabled ? (
        <Volume2 className="h-[18px] w-[18px]" />
      ) : (
        <VolumeX className="h-[18px] w-[18px] opacity-50" />
      )}
    </Button>
  );
}

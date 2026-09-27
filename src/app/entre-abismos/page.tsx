'use client';
import { AbismosCanvas } from '@/engine/renderer/AbismosCanvas';
import { GameMenuButton } from '@/ui/components/navigation/GameMenuButton';

export default function EntreAbismosPage() {
  return (
    <div className="w-screen overflow-hidden" style={{ height: '100dvh' }}>
      <AbismosCanvas />
      <GameMenuButton />
    </div>
  );
}

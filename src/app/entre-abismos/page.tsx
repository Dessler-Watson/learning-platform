'use client';
import { AbismosCanvas } from '@/engine/renderer/AbismosCanvas';
import { GameMenuButton } from '@/ui/components/navigation/GameMenuButton';

export default function EntreAbismosPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AbismosCanvas />
      <GameMenuButton />
    </div>
  );
}

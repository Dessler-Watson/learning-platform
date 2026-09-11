'use client';

import { PracticeGameWrapper } from '@/ui/screens/practice/PracticeGameWrapper';
import { GameMenuButton } from '@/ui/components/navigation/GameMenuButton';

export default function PracticaJugarPage() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <PracticeGameWrapper />
      <GameMenuButton />
    </main>
  );
}

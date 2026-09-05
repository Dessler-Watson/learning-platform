'use client';
import { Suspense } from 'react';
import { WaitingRoomScreen } from '@/ui/screens/waiting/WaitingRoomScreen';

export default function SalaEsperaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A6A', fontWeight: 700 }}>Cargando sala...</div>}>
      <WaitingRoomScreen />
    </Suspense>
  );
}

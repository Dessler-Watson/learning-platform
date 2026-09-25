'use client';

import { Suspense } from 'react';
import { StudentResultsScreen } from '@/ui/screens/resultados/StudentResultsScreen';

export default function ResultadosPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A6A', fontWeight: 700 }}>
          Cargando resultados...
        </div>
      }
    >
      <StudentResultsScreen />
    </Suspense>
  );
}

'use client';
import dynamic from 'next/dynamic';
import { GameMenuButton } from '@/ui/components/navigation/GameMenuButton';
const TierrasCanvas = dynamic(() => import('@/engine/renderer/TierrasCanvas').then((m) => m.TierrasCanvas), { ssr: false });
export default function TierrasHundidasPage() {
  return <main style={{ width: '100vw', height: '100vh' }}><TierrasCanvas /><GameMenuButton /></main>;
}

'use client';
import dynamic from 'next/dynamic';
import { GameMenuButton } from '@/ui/components/navigation/GameMenuButton';
const LavaCanvas = dynamic(() => import('@/engine/renderer/LavaCanvas').then((m) => m.LavaCanvas), { ssr: false });
export default function LavaPage() {
  return <main style={{ width: '100vw', height: '100vh' }}><LavaCanvas /><GameMenuButton /></main>;
}

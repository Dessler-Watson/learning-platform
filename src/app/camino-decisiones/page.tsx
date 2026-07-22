'use client';
import dynamic from 'next/dynamic';
import { GameMenuButton } from '@/ui/components/navigation/GameMenuButton';
const GameCanvas = dynamic(() => import('@/engine/renderer/GameCanvas').then((m) => m.GameCanvas), { ssr: false });
export default function DecisionRoadPage() {
  return <main style={{ width: '100vw', height: '100vh' }}><GameCanvas /><GameMenuButton /></main>;
}

'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { LavaCamera } from '@/games/lava-knowledge/world/LavaCamera';
import { LavaWorld } from '@/games/lava-knowledge/world/LavaWorld';
import { LavaGameFlow } from '@/games/lava-knowledge/logic/LavaGameFlow';
import { RoundManager } from '@/games/lava-knowledge/logic/RoundManager';
import { LavaHUD } from '@/games/lava-knowledge/ui/LavaHUD';
function Scene() { return (<><LavaGameFlow /><RoundManager /><Physics gravity={[0, 0, 0]}><LavaWorld /></Physics><LavaCamera /></>); }
export function LavaCanvas() {
  return (<div style={{ width: '100vw', height: '100vh', position: 'relative' }}><Canvas shadows dpr={[0.75, 1]} gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.2 }} camera={{ fov: 60, near: 0.2, far: 150 }} style={{ width: '100%', height: '100%' }}><color attach="background" args={['#87CEEB']} /><fog attach="fog" args={['#B3E5FC', 20, 70]} /><Suspense fallback={null}><Scene /></Suspense></Canvas><LavaHUD /></div>);
}

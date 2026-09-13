'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { LavaCamera } from '@/games/lava-knowledge/world/LavaCamera';
import { LavaWorld } from '@/games/lava-knowledge/world/LavaWorld';
import { LavaGameFlow } from '@/games/lava-knowledge/logic/LavaGameFlow';
import { RoundManager } from '@/games/lava-knowledge/logic/RoundManager';
import { LavaHUD } from '@/games/lava-knowledge/ui/LavaHUD';

function Scene() {
  return (
    <>
      <LavaGameFlow />
      <RoundManager />
      <Physics gravity={[0, 0, 0]}>
        <LavaWorld />
      </Physics>
      <LavaCamera />
    </>
  );
}

export function LavaCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        dpr={[0.75, 1]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: 3,
          toneMappingExposure: 1.3,
        }}
        camera={{ fov: 55, near: 0.2, far: 200 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#2A2A2E']} />
        <fog attach="fog" args={['#3A3A3E', 30, 80]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <LavaHUD />

      {/* CSS vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
      }} />

      {/* Bottom lava glow overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(255,100,0,0.12) 0%, transparent 100%)',
      }} />

      {/* Top sky glow — dark */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '20%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(20,20,24,0.3) 0%, transparent 100%)',
      }} />
    </div>
  );
}

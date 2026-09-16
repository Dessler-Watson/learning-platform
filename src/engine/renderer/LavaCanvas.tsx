'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { LavaCamera } from '@/games/lava-knowledge/world/LavaCamera';
import { LavaWorld } from '@/games/lava-knowledge/world/LavaWorld';
import { LavaGameFlow } from '@/games/lava-knowledge/logic/LavaGameFlow';
import { RoundManager } from '@/games/lava-knowledge/logic/RoundManager';
import { LavaHUD } from '@/games/lava-knowledge/ui/LavaHUD';
import { useLavaStore } from '@/stores/lava.store';

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

function DangerOverlay() {
  const ticks = useLavaStore((s) => s.ticks);
  if (ticks > 1) return null;
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
        boxShadow: 'inset 0 0 140px 70px rgba(255,0,0,0.55), inset 0 0 280px 120px rgba(200,0,0,0.25)',
        animation: 'dangerPulse 1.2s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(255,80,0,0.12) 70%, rgba(255,40,0,0.08) 100%)',
        animation: 'dangerPulse 1.5s ease-in-out infinite',
      }} />
    </>
  );
}

export function LavaCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <style>{`
        @keyframes dangerPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes flash1 { 0%,100%{opacity:0} 30%{opacity:0.7} 60%{opacity:0.2} }
        @keyframes flash2 { 0%,100%{opacity:0} 20%{opacity:0.5} 50%{opacity:0.8} 75%{opacity:0.1} }
        @keyframes flash3 { 0%,100%{opacity:0} 40%{opacity:0.6} 70%{opacity:0.3} }
        @keyframes flash4 { 0%,100%{opacity:0} 15%{opacity:0.4} 45%{opacity:0.7} 65%{opacity:0.1} }
        @keyframes flash5 { 0%,100%{opacity:0} 25%{opacity:0.3} 55%{opacity:0.6} 80%{opacity:0.15} }
      `}</style>
      <Canvas
        shadows
        dpr={[0.75, 1]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: 3,
          toneMappingExposure: 1.5,
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

      <DangerOverlay />

      {/* CSS vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
      }} />

      {/* Bottom lava glow overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(255,100,0,0.2) 0%, transparent 100%)',
      }} />

      {/* Top sky glow — dark */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '20%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(20,20,24,0.3) 0%, transparent 100%)',
      }} />

      {/* Sky orange ambient glow — subtle top corners */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '40%', height: '25%', zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 0% 0%, rgba(255,80,0,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '40%', height: '25%', zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 100% 0%, rgba(255,80,0,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '15%', zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(255,60,0,0.08) 0%, transparent 100%)',
      }} />

      {/* Background flashes — independent timings */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 80%, rgba(255,150,0,0.15) 0%, transparent 50%)',
        animation: 'flash1 4.7s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 75% 85%, rgba(255,200,30,0.12) 0%, transparent 45%)',
        animation: 'flash2 6.3s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 75%, rgba(255,120,0,0.1) 0%, transparent 40%)',
        animation: 'flash3 8.1s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 10% 90%, rgba(255,180,20,0.08) 0%, transparent 55%)',
        animation: 'flash4 5.5s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 85% 70%, rgba(255,100,0,0.1) 0%, transparent 50%)',
        animation: 'flash5 7.2s ease-in-out infinite',
      }} />
    </div>
  );
}

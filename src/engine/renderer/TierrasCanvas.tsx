'use client';
import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { TierrasCamera } from '@/games/tierras-hundidas/world/TierrasCamera';
import { TierrasWorld } from '@/games/tierras-hundidas/world/TierrasWorld';
import { TierrasCharacterController } from '@/games/tierras-hundidas/world/TierrasCharacterController';
import { TierrasGameFlow } from '@/games/tierras-hundidas/logic/TierrasGameFlow';
import { TierrasRoundManager } from '@/games/tierras-hundidas/logic/TierrasRoundManager';
import { TierrasHUD } from '@/games/tierras-hundidas/ui/TierrasHUD';
import { useTierrasStore } from '@/stores/tierras.store';
import { useLeagueStore } from '@/stores/league.store';
import { useAchievementStore } from '@/stores/achievement.store';
import { GameAchievementNotification } from '@/ui/components/GameAchievementNotification';
import { TierrasLoadingScreen } from './TierrasLoadingScreen';
import { gameAudio, initAudio } from '@/shared/lib/gameAudio';
import { CompletionOverlay } from '@/shared/ui/CompletionOverlay';
import { DefeatOverlay } from '@/shared/ui/DefeatOverlay';

function Scene({ onReady }: { onReady: () => void }) {
  return (
    <>
      <TierrasGameFlow />
      <TierrasRoundManager />
      <Physics gravity={[0, -9.81, 0]}>
        <TierrasWorld />
        <TierrasCharacterController />
      </Physics>
      <TierrasCamera />
      <ReadyNotifier onReady={onReady} />
    </>
  );
}

function ReadyNotifier({ onReady }: { onReady: () => void }) {
  useState(() => { setTimeout(onReady, 300); });
  return null;
}

function DangerOverlay() {
  const fallenInWater = useTierrasStore((s) => s.fallenInWater);
  const phase = useTierrasStore((s) => s.phase);
  const sinkingPlatform = useTierrasStore((s) => s.sinkingPlatform);
  if (fallenInWater || phase === 'completed' || phase === 'loading') return null;
  if (!sinkingPlatform) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
      boxShadow: 'inset 0 0 140px 70px rgba(0,80,0,0.55), inset 0 0 280px 120px rgba(0,40,0,0.25)',
      animation: 'dangerPulse 1.2s ease-in-out infinite',
    }} />
  );
}

export function TierrasCanvas() {
  const [phase, setPhase] = useState<'loading' | 'completing' | 'done'>('loading');
  const handleReady = useCallback(() => setPhase('completing'), []);
  const handleComplete = useCallback(() => setPhase('done'), []);
  const tierrasPhase = useTierrasStore((s) => s.phase);
  const fallenInWater = useTierrasStore((s) => s.fallenInWater);
  const starsEarned = useTierrasStore((s) => s.starsEarned);
  const starsPersisted = useRef(false);

  useEffect(() => {
    if (tierrasPhase !== 'completed' || starsPersisted.current) return;
    const isPractice = !!sessionStorage.getItem('eduplay_practice');
    if (isPractice) {
      starsPersisted.current = true;
      return;
    }
    if (fallenInWater) {
      const penalty = Math.min(Math.ceil(starsEarned * 0.5), 30);
      if (penalty > 0) {
        useLeagueStore.getState().removeStars(penalty);
      }
    } else if (starsEarned > 0) {
      useLeagueStore.getState().addStars(starsEarned);
    }
    starsPersisted.current = true;
  }, [tierrasPhase, starsEarned, fallenInWater]);

  useEffect(() => {
    useAchievementStore.getState().init();
  }, []);

  useEffect(() => {
    gameAudio.startTierrasMusic();
    const init = () => { initAudio(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
    window.addEventListener('keydown', init);
    window.addEventListener('click', init);
    return () => { gameAudio.stopAll(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
  }, []);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes dangerPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes fogDrift1 {
        0%, 100% { opacity: 0.6; transform: translateX(0); }
        50% { opacity: 0.9; transform: translateX(15px); }
      }
      @keyframes fogDrift2 {
        0%, 100% { opacity: 0.5; transform: translateX(0); }
        50% { opacity: 0.8; transform: translateX(-10px); }
      }
      @keyframes fogDrift3 {
        0%, 100% { opacity: 0.4; transform: translateX(0); }
        50% { opacity: 0.7; transform: translateX(8px); }
      }
    `;
    document.head.appendChild(styleEl);
    return () => { document.head.removeChild(styleEl); };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {phase !== 'done' && (
        <TierrasLoadingScreen complete={phase === 'completing'} onComplete={handleComplete} />
      )}
      <Canvas
        shadows
        dpr={[0.75, 1]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: 3,
          toneMappingExposure: 1.2,
        }}
        camera={{ fov: 55, near: 0.2, far: 300 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0a1510']} />
        <fog attach="fog" args={['#060e0a', 25, 160]} />
        <Suspense fallback={null}>
          <Scene onReady={handleReady} />
        </Suspense>
      </Canvas>

      <TierrasHUD />

      <CompletionOverlay
        show={tierrasPhase === 'completed' && !fallenInWater}
        onDone={() => {
          const isPractice = !!sessionStorage.getItem('eduplay_practice');
          if (isPractice) window.location.href = '/practica/resultados';
          else window.location.href = '/sala-espera';
        }}
        duration={4000}
      />

      <DefeatOverlay
        show={tierrasPhase === 'completed' && fallenInWater}
        onDone={() => {
          const isPractice = !!sessionStorage.getItem('eduplay_practice');
          if (isPractice) window.location.href = '/practica/resultados';
          else window.location.href = '/sala-espera';
        }}
        duration={4000}
        message="Te hundiste!"
      />

      <DangerOverlay />
      <GameAchievementNotification />

      {/* CSS vignette overlay — softer edges */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* Bottom swamp depth */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(3,8,4,0.45) 0%, transparent 100%)',
      }} />

      {/* Top dark canopy vignette */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '20%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(3,6,4,0.45) 0%, transparent 100%)',
      }} />

      {/* Atmospheric fog overlays — subtle drifting layers */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 15% 85%, rgba(15,35,18,0.1) 0%, transparent 50%)',
        animation: 'fogDrift1 14s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 80% 80%, rgba(10,30,15,0.08) 0%, transparent 45%)',
        animation: 'fogDrift2 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 70%, rgba(12,32,16,0.06) 0%, transparent 40%)',
        animation: 'fogDrift3 22s ease-in-out infinite',
      }} />
    </div>
  );
}

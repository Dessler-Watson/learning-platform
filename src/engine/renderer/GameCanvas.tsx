'use client';
import { Suspense, useState, useCallback, useEffect, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Lighting } from '@/engine/lighting/Lighting';
import { DecisionWorld } from '@/games/decision-road/world/DecisionWorld';
import { CharacterController } from '@/shared/characters/CharacterController';
import { CameraController } from '@/engine/camera/CameraController';
import { GameFlow } from '@/games/decision-road/logic/GameFlow';
import { DecisionHUD } from '@/games/decision-road/ui/DecisionHUD';
import { QuestionPanel } from '@/games/decision-road/ui/QuestionPanel';
import { FeedbackOverlay } from '@/games/decision-road/ui/FeedbackOverlay';
import { ResultsScreen } from '@/games/decision-road/ui/ResultsScreen';
import { useGameStore } from '@/stores/game.store';
import { useAchievementStore } from '@/stores/achievement.store';
import { GameAchievementNotification } from '@/ui/components/GameAchievementNotification';
import { CompletionOverlay } from '@/shared/ui/CompletionOverlay';
import { MobileControls } from '@/shared/ui/MobileControls';
import { LandscapeGate } from '@/shared/ui/LandscapeGate';
import { useGameFullscreen } from '@/shared/hooks/useFullscreen';
import { Leaderboard } from '@/games/decision-road/ui/Leaderboard';
import { clampDpr } from '@/engine/quality';
import { AdaptiveDpr } from '@/engine/adaptive-dpr';
import { PostProcessing } from '@/engine/effects/PostProcessing';
import { DecisionRoadLoadingScreen } from './DecisionRoadLoadingScreen';
import { gameAudio, initAudio } from '@/shared/lib/gameAudio';

// Constantes de módulo: evitan recrear objetos en cada render del wrapper
// (identidades nuevas ⇒ R3F re-aplicaría gl/camera/physics y rapier crearía
// un contexto nuevo).
const GRAVITY: [number, number, number] = [0, -9.81, 0];
const GL_CONFIG = { antialias: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.15 } as const;
const CAMERA_CONFIG = { fov: 55, near: 0.2, far: 600 } as const;
const PERFORMANCE_CONFIG = { min: 0.5 } as const;
const CANVAS_STYLE = { width: '100%', height: '100%', backgroundColor: '#7EC8E3' } as const;

function Scene({ onReady }: { onReady: () => void }) {
  return (
    <>
      <Lighting />
      <GameFlow />
      <Physics gravity={GRAVITY}>
        <DecisionWorld>
          <CharacterController />
        </DecisionWorld>
      </Physics>
      <CameraController />
      <PostProcessing />
      <ReadyNotifier onReady={onReady} />
    </>
  );
}

function ReadyNotifier({ onReady }: { onReady: () => void }) {
  useState(() => { setTimeout(onReady, 300); });
  return null;
}

// El <Canvas> queda memoizado: los re-renders del wrapper (phase del juego,
// overlays, HUD) ya no reconcilian el árbol 3D completo 2-3 veces por respuesta.
const SceneCanvas = memo(function SceneCanvas({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[0.75, clampDpr(1.25)]}
      gl={GL_CONFIG}
      camera={CAMERA_CONFIG}
      performance={PERFORMANCE_CONFIG}
      style={CANVAS_STYLE}
    >
      <color attach="background" args={['#7EC8E3']} />
      <fog attach="fog" args={['#B3E5FC', 35, 140]} />
      <AdaptiveDpr baseMax={1.25} />
      <Suspense fallback={null}><Scene onReady={onReady} /></Suspense>
    </Canvas>
  );
});

export function GameCanvas() {
  const [phase, setPhase] = useState<'loading' | 'completing' | 'done'>('loading');
  useGameFullscreen();
  const handleReady = useCallback(() => setPhase('completing'), []);
  const handleComplete = useCallback(() => setPhase('done'), []);
  const gamePhase = useGameStore((s) => s.phase);

  useEffect(() => {
    useAchievementStore.getState().init();
  }, []);

  useEffect(() => {
    gameAudio.startDecisionMusic();
    const init = () => { initAudio(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
    window.addEventListener('keydown', init);
    window.addEventListener('click', init);
    return () => { gameAudio.stopAll(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
  }, []);

  return (
    <div className="game-screen" style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#7EC8E3' }}>
      {phase !== 'done' && (
        <DecisionRoadLoadingScreen complete={phase === 'completing'} onComplete={handleComplete} />
      )}
      <SceneCanvas onReady={handleReady} />
      <DecisionHUD />
      <QuestionPanel />
      <FeedbackOverlay />
      <ResultsScreen />
      <CompletionOverlay
        show={gamePhase === 'completed'}
        onDone={() => useGameStore.getState().setPhase('results')}
        duration={4000}
      />
      <MobileControls />
      <Leaderboard />
      <GameAchievementNotification />
      <LandscapeGate enabled={gamePhase !== 'completed' && gamePhase !== 'results'} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)',
      }} />
    </div>
  );
}

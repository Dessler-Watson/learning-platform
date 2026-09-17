'use client';
import { Suspense, useState, useCallback, useEffect } from 'react';
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
import { CompletionOverlay } from '@/shared/ui/CompletionOverlay';
import { MobileControls } from '@/games/decision-road/ui/MobileControls';
import { Leaderboard } from '@/games/decision-road/ui/Leaderboard';
import { PostProcessing } from '@/engine/effects/PostProcessing';
import { DecisionRoadLoadingScreen } from './DecisionRoadLoadingScreen';
import { gameAudio, initAudio } from '@/shared/lib/gameAudio';

function Scene({ onReady }: { onReady: () => void }) {
  return (
    <>
      <Lighting />
      <GameFlow />
      <Physics gravity={[0, -9.81, 0]}>
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

export function GameCanvas() {
  const [phase, setPhase] = useState<'loading' | 'completing' | 'done'>('loading');
  const handleReady = useCallback(() => setPhase('completing'), []);
  const handleComplete = useCallback(() => setPhase('done'), []);
  const gamePhase = useGameStore((s) => s.phase);

  useEffect(() => {
    gameAudio.startDecisionMusic();
    const init = () => { initAudio(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
    window.addEventListener('keydown', init);
    window.addEventListener('click', init);
    return () => { gameAudio.stopAll(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {phase !== 'done' && (
        <DecisionRoadLoadingScreen complete={phase === 'completing'} onComplete={handleComplete} />
      )}
      <Canvas shadows dpr={[0.75, 1.25]} gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.15 }} camera={{ fov: 55, near: 0.2, far: 600 }} performance={{ min: 0.5 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#7EC8E3']} />
        <fog attach="fog" args={['#B3E5FC', 35, 140]} />
        <Suspense fallback={null}><Scene onReady={handleReady} /></Suspense>
      </Canvas>
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
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)',
      }} />
    </div>
  );
}

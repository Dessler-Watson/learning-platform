'use client';
import { Suspense } from 'react';
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

function Scene() {
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
    </>
  );
}

export function GameCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows dpr={[0.75, 1]} gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.1 }} camera={{ fov: 60, near: 0.2, far: 600 }} performance={{ min: 0.5 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#87CEEB']} />
        <fog attach="fog" args={['#B3E5FC', 120, 450]} />
        <Suspense fallback={null}><Scene /></Suspense>
      </Canvas>
      <DecisionHUD /><QuestionPanel /><FeedbackOverlay /><ResultsScreen />
    </div>
  );
}

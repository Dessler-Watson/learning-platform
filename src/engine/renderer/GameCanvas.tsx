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
import { AmbientMotes } from '@/shared/ui/AmbientMotes';
import { isMatchRoom, postGameRoute } from '@/lib/partida-client';

// Constantes de módulo: evitan recrear objetos en cada render del wrapper
// (identidades nuevas ⇒ R3F re-aplicaría gl/camera/physics y rapier crearía
// un contexto nuevo).
const GRAVITY: [number, number, number] = [0, -9.81, 0];
const GL_CONFIG = { antialias: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.15 } as const;
const CAMERA_CONFIG = { fov: 55, near: 0.2, far: 600 } as const;
const PERFORMANCE_CONFIG = { min: 0.5 } as const;
const CANVAS_STYLE = { width: '100%', height: '100%', backgroundColor: '#7EC8E3' } as const;

// Decoración extra (solo visual): motas de luz cálidas flotando en el cielo.
const SKY_MOTE_COLORS = ['rgba(255,224,130,0.8)', 'rgba(255,245,157,0.7)', 'rgba(255,255,255,0.6)'] as const;

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
  // Al terminar en modo sala se sale a la pantalla de Resultados compartida
  // (/resultados?sala=…); en local/práctica se muestran los resultados en la partida.
  const handleResultsExit = useCallback(() => {
    if (isMatchRoom()) { window.location.href = postGameRoute(); return; }
    useGameStore.getState().setPhase('results');
  }, []);
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
        onDone={handleResultsExit}
        duration={4000}
      />
      <MobileControls />
      <Leaderboard />
      <GameAchievementNotification />
      <LandscapeGate enabled={gamePhase !== 'completed' && gamePhase !== 'results'} />

      {/* Warm corner glows — cálida luz de mañana en las esquinas superiores */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '45%', height: '32%', zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 0% 0%, rgba(255,205,90,0.16) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '45%', height: '32%', zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 100% 0%, rgba(255,205,90,0.16) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '16%', zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(126,200,100,0.12) 0%, transparent 100%)',
      }} />

      {/* Light motes — chispas de luz flotando */}
      <AmbientMotes
        count={14}
        colors={SKY_MOTE_COLORS}
        minSize={3}
        maxSize={6}
        minDur={11}
        maxDur={22}
        direction="up"
        zIndex={4}
        seed={11}
      />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)',
      }} />
    </div>
  );
}

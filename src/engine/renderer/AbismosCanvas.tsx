'use client';
import { Suspense, useState, useCallback, useEffect, useRef, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { motion } from 'framer-motion';
import { AbismosCamera } from '@/games/entre-abismos/world/AbismosCamera';
import { AbismosWorld } from '@/games/entre-abismos/world/AbismosWorld';
import { AbismosGameFlow } from '@/games/entre-abismos/logic/AbismosGameFlow';
import { AbismosRoundManager } from '@/games/entre-abismos/logic/AbismosRoundManager';
import { AbismosCharacterController } from '@/games/entre-abismos/world/AbismosCharacterController';
import { AbismosHUD } from '@/games/entre-abismos/ui/AbismosHUD';
import { useAbismosStore } from '@/stores/abismos.store';
import { useAchievementStore } from '@/stores/achievement.store';
import { useLeagueStore } from '@/stores/league.store';
import { GameAchievementNotification } from '@/ui/components/GameAchievementNotification';
import { AbismosLoadingScreen } from '@/games/entre-abismos/ui/AbismosLoadingScreen';
import { CompletionOverlay } from '@/shared/ui/CompletionOverlay';
import { DefeatOverlay } from '@/shared/ui/DefeatOverlay';
import { MobileControls } from '@/shared/ui/MobileControls';
import { LandscapeGate } from '@/shared/ui/LandscapeGate';
import { FloatingRanking } from '@/shared/ui/FloatingRanking';
import { useGameFullscreen } from '@/shared/hooks/useFullscreen';
import { clampDpr } from '@/engine/quality';
import { AdaptiveDpr } from '@/engine/adaptive-dpr';
import { gameAudio, initAudio } from '@/shared/lib/gameAudio';
import { postGameRoute } from '@/lib/partida-client';
import { AmbientMotes } from '@/shared/ui/AmbientMotes';

// Constantes de módulo: evitan recrear objetos en cada render del wrapper
// (identidades nuevas ⇒ R3F re-aplicaría gl/camera/physics y rapier crearía
// un contexto nuevo).
const GRAVITY: [number, number, number] = [0, -9.81, 0];
const GL_CONFIG = { antialias: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.15 } as const;
const CAMERA_CONFIG = { fov: 55, near: 0.1, far: 300 } as const;
const CANVAS_STYLE = { background: 'linear-gradient(to bottom, #6aafe8, #a0c8e8)' } as const;

// Decoración extra (solo visual): copos/nieve cayendo sobre el abismo.
const SNOW_MOTE_COLORS = ['rgba(255,255,255,0.85)', 'rgba(220,238,255,0.75)', 'rgba(191,217,255,0.7)'] as const;

function Scene({ onReady, onReachFinish }: { onReady: () => void; onReachFinish: () => void }) {
  return (
    <>
      <AbismosGameFlow />
      <AbismosRoundManager />
      <Physics gravity={GRAVITY}>
        <AbismosWorld onReachFinish={onReachFinish} />
        <AbismosCharacterController />
      </Physics>
      <AbismosCamera />
      <ReadyNotifier onReady={onReady} />
    </>
  );
}

function ReadyNotifier({ onReady }: { onReady: () => void }) {
  useState(() => { setTimeout(onReady, 300); });
  return null;
}

// El <Canvas> queda memoizado: los re-renders del wrapper (HUD, overlays,
// victoria/derrota) ya no reconcilian el árbol 3D completo 2-3 veces por
// respuesta.
const SceneCanvas = memo(function SceneCanvas({
  onReady,
  onReachFinish,
}: {
  onReady: () => void;
  onReachFinish: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[0.75, clampDpr(1)]}
      gl={GL_CONFIG}
      camera={CAMERA_CONFIG}
      style={CANVAS_STYLE}
    >
      <color attach="background" args={['#7BB3E0']} />
      <fog attach="fog" args={['#b0c8e0', 50, 220]} />
      <AdaptiveDpr baseMax={1} />
      <Suspense fallback={null}>
        <Scene onReady={onReady} onReachFinish={onReachFinish} />
      </Suspense>
    </Canvas>
  );
});

function DangerOverlay() {
  const fellInAbyss = useAbismosStore((s) => s.fellInAbyss);
  const phase = useAbismosStore((s) => s.phase);
  if (!fellInAbyss && phase !== 'defeat') return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0.3, 0.6, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="pointer-events-none fixed inset-0 z-30 border-4 border-red-500/50"
      style={{ boxShadow: 'inset 0 0 60px rgba(239, 68, 68, 0.3)' }}
    />
  );
}

export function AbismosCanvas() {
  const [phase, setPhase] = useState<'loading' | 'completing' | 'done'>('loading');
  useGameFullscreen();
  const handleReady = useCallback(() => setPhase('completing'), []);
  const handleComplete = useCallback(() => setPhase('done'), []);
  const gamePhase = useAbismosStore((s) => s.phase);
  const result = useAbismosStore((s) => s.result);
  const starsEarned = useAbismosStore((s) => s.starsEarned);
  const fellInAbyss = useAbismosStore((s) => s.fellInAbyss);
  const abismosScore = useAbismosStore((s) => s.score);
  const starsPersisted = useRef(false);
  const defeatSfxPlayed = useRef(false);

  const handleReachFinish = useCallback(() => {
    const store = useAbismosStore.getState();
    if (store.phase === 'freeMove' || store.phase === 'crossing') {
      store.triggerVictory();
      gameAudio.decisionVictory();
    }
  }, []);

  const handleDefeatDone = useCallback(() => {
    window.location.href = postGameRoute();
  }, []);

  useEffect(() => {
    useAchievementStore.getState().init();
  }, []);

  useEffect(() => {
    gameAudio.startAbismosMusic();
    const init = () => { initAudio(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
    window.addEventListener('keydown', init);
    window.addEventListener('click', init);
    return () => { gameAudio.stopAll(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
  }, []);

  useEffect(() => {
    if (gamePhase === 'defeat') {
      if (!defeatSfxPlayed.current) {
        defeatSfxPlayed.current = true;
        gameAudio.lavaDefeat();
      }
    } else {
      defeatSfxPlayed.current = false;
    }
  }, [gamePhase]);

  // Persist stars to league store when the game ends (never in practice).
  // Win: add accumulated stars. Lose: deduct penalty.
  useEffect(() => {
    if ((gamePhase !== 'completed' && gamePhase !== 'defeat') || starsPersisted.current) return;
    const isPractice = !!sessionStorage.getItem('eduplay_practice');
    if (isPractice) {
      starsPersisted.current = true;
      return;
    }
    if (gamePhase === 'defeat' || fellInAbyss) {
      const penalty = Math.min(Math.ceil(starsEarned * 0.5), 30);
      if (penalty > 0) {
        useLeagueStore.getState().removeStars(penalty);
      }
    } else if (starsEarned > 0) {
      useLeagueStore.getState().addStars(starsEarned);
    }
    starsPersisted.current = true;
  }, [gamePhase, starsEarned, fellInAbyss]);

  return (
    <div className="game-screen relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(to bottom, #6aafe8 0%, #a0c8e8 40%, #c0d8e8 100%)' }}>
      {phase !== 'done' && (
        <AbismosLoadingScreen complete={phase === 'completing'} onComplete={handleComplete} />
      )}

      <SceneCanvas onReady={handleReady} onReachFinish={handleReachFinish} />

      <AbismosHUD />
      <FloatingRanking
        slot="top-right"
        top={
          gamePhase === 'questions' || gamePhase === 'correctFeedback' || gamePhase === 'incorrectFeedback'
            ? 230
            : 64
        }
        score={abismosScore}
        visible={
          gamePhase !== 'loading' &&
          gamePhase !== 'intro' &&
          gamePhase !== 'completed' &&
          gamePhase !== 'defeat' &&
          gamePhase !== 'results'
        }
      />
      <DangerOverlay />
      <GameAchievementNotification />
      <LandscapeGate
        enabled={gamePhase !== 'completed' && gamePhase !== 'defeat' && gamePhase !== 'results'}
      />
      {phase === 'done' && (gamePhase === 'freeMove' || gamePhase === 'crossing') && <MobileControls />}

      <CompletionOverlay
        show={gamePhase === 'completed' && !!result}
        onDone={() => {
          useAbismosStore.getState().reset();
          window.location.href = postGameRoute();
        }}
        duration={4000}
      />

      <DefeatOverlay
        show={gamePhase === 'defeat'}
        onDone={handleDefeatDone}
        duration={4000}
        message="Caíste al abismo!"
      />

      {/* Cool vignette — profundidad fría en los bordes */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(8,18,38,0.26) 100%)',
      }} />

      {/* Cold top wash — cielo gélido arriba */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '22%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(20,45,90,0.22) 0%, transparent 100%)',
      }} />

      {/* Icy bottom haze — resplandor gélido abajo */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '16%', zIndex: 4, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(200,225,255,0.1) 0%, transparent 100%)',
      }} />

      {/* Snow motes — copos cayendo */}
      <AmbientMotes
        count={16}
        colors={SNOW_MOTE_COLORS}
        minSize={2}
        maxSize={5}
        minDur={10}
        maxDur={20}
        direction="down"
        zIndex={5}
        seed={9}
      />
    </div>
  );
}

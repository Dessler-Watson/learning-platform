'use client';
import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
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
import { gameAudio, initAudio } from '@/shared/lib/gameAudio';

function Scene({ onReady, onReachFinish }: { onReady: () => void; onReachFinish: () => void }) {
  return (
    <>
      <AbismosGameFlow />
      <AbismosRoundManager />
      <Physics gravity={[0, -9.81, 0]}>
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
  const handleReady = useCallback(() => setPhase('completing'), []);
  const handleComplete = useCallback(() => setPhase('done'), []);
  const gamePhase = useAbismosStore((s) => s.phase);
  const result = useAbismosStore((s) => s.result);
  const starsEarned = useAbismosStore((s) => s.starsEarned);
  const fellInAbyss = useAbismosStore((s) => s.fellInAbyss);
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
    const isPractice = !!sessionStorage.getItem('eduplay_practice');
    window.location.href = isPractice ? '/practica/resultados' : '/inicio';
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
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(to bottom, #6aafe8 0%, #a0c8e8 40%, #c0d8e8 100%)' }}>
      {phase !== 'done' && (
        <AbismosLoadingScreen complete={phase === 'completing'} onComplete={handleComplete} />
      )}

      <Canvas
        shadows
        dpr={[0.75, 1]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: 3,
          toneMappingExposure: 1.15,
        }}
        camera={{ fov: 55, near: 0.1, far: 300 }}
        style={{ background: 'linear-gradient(to bottom, #6aafe8, #a0c8e8)' }}
      >
        <color attach="background" args={['#7BB3E0']} />
        <fog attach="fog" args={['#b0c8e0', 50, 220]} />
        <Suspense fallback={null}>
          <Scene onReady={handleReady} onReachFinish={handleReachFinish} />
        </Suspense>
      </Canvas>

      <AbismosHUD />
      <DangerOverlay />
      <GameAchievementNotification />

      <CompletionOverlay
        show={gamePhase === 'completed' && !!result}
        onDone={() => {
          const isPractice = !!sessionStorage.getItem('eduplay_practice');
          useAbismosStore.getState().reset();
          if (isPractice) window.location.href = '/practica/resultados';
          else window.location.href = '/inicio';
        }}
        duration={4000}
      />

      <DefeatOverlay
        show={gamePhase === 'defeat'}
        onDone={handleDefeatDone}
        duration={4000}
        message="Caíste al abismo!"
      />
    </div>
  );
}

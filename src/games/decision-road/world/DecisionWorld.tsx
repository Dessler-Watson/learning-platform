'use client';
import { Sky } from '@/shared/world/environment/Sky';
import { ProceduralClouds } from './ProceduralClouds';
import { ParticleField } from '@/shared/world/effects/ParticleField';
import { DoorSystem } from './DoorSystem';
import { Path } from './Path';
import { FinishLine } from './FinishLine';
import { CharacterDissolve } from './CharacterDissolve';
import { FloatingIslands } from './FloatingIslands';
import { FloatingDiamonds } from './FloatingDiamonds';
import { useGameStore } from '@/stores/game.store';
export function DecisionWorld({ children }: { children: React.ReactNode }) {
  const questions = useGameStore((s) => s.questions);
  const lastStationZ = questions.length > 0 ? 12 - (questions.length - 1) * 25 : 12;
  const finishZ = lastStationZ - 25;
  const pathStartZ = 42;
  const pathEndZ = finishZ - 15;
  const pathLength = pathStartZ - pathEndZ;
  const pathCenterZ = (pathStartZ + pathEndZ) / 2;
  return (
    <group>
      <Sky />
      <ProceduralClouds />
      <ParticleField count={80} spread={50} color="#fff8e1" size={0.045} speed={0.12} />
      <FloatingIslands />
      <FloatingDiamonds />
      <Path length={pathLength} centerZ={pathCenterZ} />
      <DoorSystem />
      <FinishLine lastStationZ={lastStationZ} />
      {children}
      <CharacterDissolve />
    </group>
  );
}

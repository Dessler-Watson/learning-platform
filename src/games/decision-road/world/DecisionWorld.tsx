'use client';
import { Sky } from '@/shared/world/environment/Sky';
import { Clouds } from '@/shared/world/environment/Clouds';
import { ParticleField } from '@/shared/world/effects/ParticleField';
import { DoorSystem } from './DoorSystem';
import { Path } from './Path';
import { FinishLine } from './FinishLine';
import { CharacterDissolve } from './CharacterDissolve';
import { useGameStore } from '@/stores/game.store';
export function DecisionWorld({ children }: { children: React.ReactNode }) {
  const questions = useGameStore((s) => s.questions);
  const finishZ = 12 - (questions.length - 1) * 25 - 8;
  return (
    <group>
      <Sky /><Clouds /><ParticleField count={40} spread={50} color="#ffeebb" size={0.05} speed={0.2} />
      <Path /><DoorSystem /><FinishLine position={[0, 1.5, finishZ]} />
      {children}<CharacterDissolve />
    </group>
  );
}

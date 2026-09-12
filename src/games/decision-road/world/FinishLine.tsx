'use client';
import { Text } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '@/stores/game.store';

export function FinishLine({ position }: { position: [number, number, number] }) {
  const phase = useGameStore((s) => s.phase); const currentIndex = useGameStore((s) => s.currentQuestionIndex); const questions = useGameStore((s) => s.questions);
  const isLast = currentIndex === questions.length - 1; const show = phase === 'playing' || phase === 'question' || phase === 'correctFeedback' || phase === 'incorrectFeedback';
  if (!show || !isLast || questions.length === 0) return null;
  const [px, py, pz] = position;
  const flagColors = ['#EF5350', '#FFD54F', '#66BB6A', '#42A5F5', '#AB47BC', '#FF7043', '#26C6DA', '#FFCA28', '#EC407A', '#5C6BC0'];
  return (
    <group position={[px, py, pz]}>
      <mesh position={[-9, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 10]} />
        <meshStandardMaterial color="#FFD54F" roughness={0.3} metalness={0.5} emissive="#FFD54F" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[9, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 10]} />
        <meshStandardMaterial color="#FFD54F" roughness={0.3} metalness={0.5} emissive="#FFD54F" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[18, 0.45]} />
        <meshStandardMaterial color="#FFFFFF" side={2} roughness={0.3} emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <planeGeometry args={[18, 0.55]} />
        <meshStandardMaterial color="#EF5350" side={2} roughness={0.3} emissive="#EF5350" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <planeGeometry args={[18, 0.45]} />
        <meshStandardMaterial color="#FFFFFF" side={2} roughness={0.3} emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>
      <Text position={[0, 2.15, 0.01]} fontSize={0.55} color="#FFFFFF" anchorX="center" anchorY="middle" fontWeight="900" outlineColor="#000000" outlineWidth={0.04}>
        META
      </Text>
      <RigidBody type="fixed" colliders={false} sensor>
        <CuboidCollider args={[9, 3, 0.5]} sensor />
      </RigidBody>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-8 + i * 1.8, 2.7, 0.1]}>
          <planeGeometry args={[0.35, 0.3]} />
          <meshStandardMaterial color={flagColors[i % flagColors.length]} side={2} emissive={flagColors[i % flagColors.length]} emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

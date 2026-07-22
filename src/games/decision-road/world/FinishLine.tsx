'use client';
import { Text } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '@/stores/game.store';
export function FinishLine({ position }: { position: [number, number, number] }) {
  const phase = useGameStore((s) => s.phase); const currentIndex = useGameStore((s) => s.currentQuestionIndex); const questions = useGameStore((s) => s.questions);
  const isLast = currentIndex === questions.length - 1; const show = phase === 'playing' || phase === 'question' || phase === 'correctFeedback' || phase === 'incorrectFeedback';
  if (!show || !isLast || questions.length === 0) return null;
  const [px, py, pz] = position;
  return (
    <group position={[px, py, pz]}>
      <mesh position={[-9, 1.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.3, 3, 8]} /><meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.6} /></mesh>
      <mesh position={[9, 1.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.3, 3, 8]} /><meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.6} /></mesh>
      <mesh position={[0, 2.4, 0]}><planeGeometry args={[18, 0.4]} /><meshStandardMaterial color="#FFFFFF" side={2} roughness={0.2} /></mesh>
      <mesh position={[0, 2.1, 0]}><planeGeometry args={[18, 0.6]} /><meshStandardMaterial color="#FF4B4B" side={2} roughness={0.2} /></mesh>
      <mesh position={[0, 1.8, 0]}><planeGeometry args={[18, 0.4]} /><meshStandardMaterial color="#FFFFFF" side={2} roughness={0.2} /></mesh>
      <Text position={[0, 2.1, 0.01]} fontSize={0.5} color="#FFFFFF" anchorX="center" anchorY="middle" fontWeight="900" outlineColor="#000" outlineWidth={0.04}>META</Text>
      <RigidBody type="fixed" colliders={false} sensor><CuboidCollider args={[9, 3, 0.5]} sensor /></RigidBody>
      {Array.from({ length: 10 }).map((_, i) => (<mesh key={i} position={[-8 + i * 1.8, 2.6, 0.1]}><planeGeometry args={[0.3, 0.25]} /><meshStandardMaterial color={['#FF4B4B','#FFD93D','#4BC94B','#7C4DFF','#FF6B9D'][i % 5]} side={2} /></mesh>))}
    </group>
  );
}

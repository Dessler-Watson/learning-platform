'use client';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
const WIDTH = 16; const WALL_H = 6; const Y = -0.1;

export function Path({ length = 480 }: { length?: number }) {
  const centerZ = 20 - length / 2;
  return (
    <group>
      <RigidBody type="fixed" position={[0, Y, centerZ]} friction={0.8}><mesh receiveShadow><boxGeometry args={[WIDTH, 0.2, length]} /><meshLambertMaterial color="#914F4A" /></mesh></RigidBody>
      <mesh receiveShadow position={[0, Y + 0.12, centerZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[WIDTH - 0.4, length - 0.4]} /><meshLambertMaterial color="#A05A53" /></mesh>
      <RigidBody type="fixed" position={[-WIDTH / 2 - 0.3, WALL_H / 2, centerZ]}><CuboidCollider args={[0.3, WALL_H / 2, length / 2]} /></RigidBody>
      <RigidBody type="fixed" position={[WIDTH / 2 + 0.3, WALL_H / 2, centerZ]}><CuboidCollider args={[0.3, WALL_H / 2, length / 2]} /></RigidBody>
    </group>
  );
}

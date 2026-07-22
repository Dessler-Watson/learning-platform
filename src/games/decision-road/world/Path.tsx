'use client';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
const LENGTH = 480; const WIDTH = 16; const WALL_H = 6; const Y = -0.1; const CENTER_Z = -170;
export function Path() {
  return (
    <group>
      <RigidBody type="fixed" position={[0, Y, CENTER_Z]} friction={0.8}><mesh receiveShadow><boxGeometry args={[WIDTH, 0.2, LENGTH]} /><meshLambertMaterial color="#914F4A" /></mesh></RigidBody>
      <mesh receiveShadow position={[0, Y + 0.12, CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[WIDTH - 0.4, LENGTH - 0.4]} /><meshLambertMaterial color="#A05A53" /></mesh>
      {[0, 90, 180, 270, 360].map((z, i) => (<mesh key={`s-${i}`} position={[0, Y + 0.12, CENTER_Z + z - 180]} receiveShadow><planeGeometry args={[WIDTH - 0.6, 0.6]} /><meshLambertMaterial color={['#FFD93D','#7C4DFF','#FF6B9D','#4BC94B','#4FC3F7'][i]} transparent opacity={0.25} /></mesh>))}
      <RigidBody type="fixed" position={[-WIDTH / 2 - 0.3, WALL_H / 2, CENTER_Z]}><CuboidCollider args={[0.3, WALL_H / 2, LENGTH / 2]} /></RigidBody>
      <RigidBody type="fixed" position={[WIDTH / 2 + 0.3, WALL_H / 2, CENTER_Z]}><CuboidCollider args={[0.3, WALL_H / 2, LENGTH / 2]} /></RigidBody>
    </group>
  );
}

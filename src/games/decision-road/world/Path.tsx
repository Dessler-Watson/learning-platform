'use client';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
const WIDTH = 16;
const WALL_H = 6;
const Y = -0.1;
const EDGE_W = 0.4;

export function Path({ length = 480, centerZ }: { length?: number; centerZ?: number }) {
  const cz = centerZ ?? (20 - length / 2);
  return (
    <group>
      {/* Main path body */}
      <RigidBody type="fixed" position={[0, Y, cz]} friction={0.8}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[WIDTH, 0.4, length]} />
          <meshStandardMaterial color="#b8c4cc" roughness={0.7} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Top surface - lighter */}
      <mesh receiveShadow position={[0, Y + 0.22, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WIDTH - 0.3, length - 0.3]} />
        <meshStandardMaterial color="#c8d0d8" roughness={0.8} metalness={0} />
      </mesh>

      {/* Center line accent */}
      <mesh position={[0, Y + 0.24, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, length - 0.5]} />
        <meshStandardMaterial color="#dde3ea" roughness={0.9} metalness={0} />
      </mesh>

      {/* Left edge */}
      <mesh position={[-WIDTH / 2 + EDGE_W / 2, Y + 0.45, cz]} castShadow>
        <boxGeometry args={[EDGE_W, 0.55, length]} />
        <meshStandardMaterial color="#9eaab4" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Right edge */}
      <mesh position={[WIDTH / 2 - EDGE_W / 2, Y + 0.45, cz]} castShadow>
        <boxGeometry args={[EDGE_W, 0.55, length]} />
        <meshStandardMaterial color="#9eaab4" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Bottom base - light colored */}
      <mesh position={[0, Y - 0.35, cz]}>
        <boxGeometry args={[WIDTH + 0.4, 0.25, length]} />
        <meshStandardMaterial color="#a0aab4" roughness={0.7} metalness={0} />
      </mesh>

      {/* Invisible walls for physics */}
      <RigidBody type="fixed" position={[-WIDTH / 2 - 0.3, WALL_H / 2, cz]}>
        <CuboidCollider args={[0.3, WALL_H / 2, length / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[WIDTH / 2 + 0.3, WALL_H / 2, cz]}>
        <CuboidCollider args={[0.3, WALL_H / 2, length / 2]} />
      </RigidBody>
    </group>
  );
}

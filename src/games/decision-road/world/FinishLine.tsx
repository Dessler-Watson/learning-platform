'use client';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useGameStore } from '@/stores/game.store';

const FINISH_Z_OFFSET = 25;
const PW = 16;
const PH = 5.5;
const RADIUS = 0.4;

function Diamond({ position, size, opacity }: { position: [number, number, number]; size: number; opacity: number }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 4]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function FinishLine({ lastStationZ }: { lastStationZ: number }) {
  const phase = useGameStore((s) => s.phase);
  const crossed = useRef(false);

  useEffect(() => {
    crossed.current = false;
  }, [phase]);

  useFrame(() => {
    if (phase !== 'finishing' || crossed.current) return;
    const rb = characterRigidBody.current;
    if (!rb) return;
    const pz = rb.translation().z;
    if (pz <= lastStationZ - FINISH_Z_OFFSET) {
      crossed.current = true;
      const store = useGameStore.getState();
      store.completeLevel();
      store.setPhase('completed');
    }
  });

  if (phase === 'loading' || phase === 'intro') return null;

  const z = lastStationZ - FINISH_Z_OFFSET;

  return (
    <group position={[0, PH / 2 + 1.0, z]}>
      {/* Main golden panel — spans full road width */}
      <RoundedBox args={[PW, PH, 0.15]} radius={RADIUS} smoothness={4}>
        <meshStandardMaterial
          color="#DAA520"
          transparent
          opacity={0.95}
          roughness={0.3}
          metalness={0.15}
          emissive="#FFD700"
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </RoundedBox>

      {/* Glow border behind */}
      <RoundedBox args={[PW + 0.4, PH + 0.4, 0.01]} radius={RADIUS + 0.15} smoothness={4} position={[0, 0, -0.1]}>
        <meshBasicMaterial color="#FFD700" transparent opacity={0.25} side={THREE.DoubleSide} />
      </RoundedBox>

      {/* Corner diamonds */}
      <Diamond position={[PW / 2 - 0.8, PH / 2 - 0.8, 0.1]} size={0.55} opacity={0.2} />
      <Diamond position={[-PW / 2 + 0.8, PH / 2 - 0.8, 0.1]} size={0.4} opacity={0.15} />
      <Diamond position={[PW / 2 - 1.1, -PH / 2 + 0.9, 0.1]} size={0.35} opacity={0.12} />
      <Diamond position={[-PW / 2 + 1.1, -PH / 2 + 0.9, 0.1]} size={0.35} opacity={0.12} />

      {/* Center dark circle backdrop */}
      <mesh position={[0, 0.3, 0.12]}>
        <circleGeometry args={[1.3, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Star icon above text */}
      <Text position={[0, 1.0, 0.14]} fontSize={0.65} color="#FFD700" anchorX="center" anchorY="middle" fontWeight="900">
        ★
      </Text>

      {/* Main META text */}
      <Text position={[0, -0.3, 0.14]} fontSize={0.95} color="#FFD700" anchorX="center" anchorY="middle" fontWeight="900" outlineColor="#8B6914" outlineWidth={0.05}>
        !!META!!
      </Text>

      {/* Subtle pulsing glow */}
      <mesh position={[0, 0, -0.15]}>
        <planeGeometry args={[PW + 2, PH + 2]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

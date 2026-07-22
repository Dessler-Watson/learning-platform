'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useGameStore } from '@/stores/game.store';
export function CharacterDissolve() {
  const phase = useGameStore((s) => s.phase); const should = phase === 'incorrectFeedback'; const count = 30;
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const velocities = useMemo(() => { const a = new Float32Array(count * 3); for (let i = 0; i < count; i++) { a[i * 3] = (Math.random() - 0.5) * 5; a[i * 3 + 1] = Math.random() * 6; a[i * 3 + 2] = (Math.random() - 0.5) * 5; } return a; }, []);
  const ptsRef = useRef<THREE.Points>(null); const active = useRef(false); const elapsed = useRef(0);
  useEffect(() => { if (should) { const rb = characterRigidBody.current; if (rb) { const pos = rb.translation(); for (let i = 0; i < count; i++) { positions[i * 3] = pos.x; positions[i * 3 + 1] = pos.y + 0.8; positions[i * 3 + 2] = pos.z; } } active.current = true; elapsed.current = 0; } }, [should, positions]);
  useFrame((_, delta) => { if (!active.current) return; elapsed.current += delta; for (let i = 0; i < count; i++) { positions[i * 3] += velocities[i * 3] * delta; positions[i * 3 + 1] += velocities[i * 3 + 1] * delta - 4 * delta; positions[i * 3 + 2] += velocities[i * 3 + 2] * delta; } if (ptsRef.current) (ptsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true; if (elapsed.current > 2) active.current = false; });
  if (!active.current && !should) return null;
  return (<points ref={ptsRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial size={0.12} color="#4fc3f7" transparent opacity={0.8} depthWrite={false} /></points>);
}

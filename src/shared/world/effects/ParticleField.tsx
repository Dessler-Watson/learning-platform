'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
interface ParticleFieldProps { count?: number; spread?: number; color?: string; size?: number; speed?: number; }
export function ParticleField({ count = 40, spread = 50, color = '#ffeebb', size = 0.05, speed = 0.2 }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const [positions, velocities] = useMemo(() => { const pos = new Float32Array(count * 3); const vel = new Float32Array(count); for (let i = 0; i < count; i++) { pos[i * 3] = (Math.random() - 0.5) * spread; pos[i * 3 + 1] = Math.random() * spread * 0.4; pos[i * 3 + 2] = (Math.random() - 0.5) * spread; vel[i] = 0.2 + Math.random() * 0.3; } return [pos, vel] as const; }, [count, spread]);
  const geometry = useMemo(() => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); return geo; }, [positions]);
  useFrame((_, delta) => { if (!meshRef.current) return; const pos = meshRef.current.geometry.attributes.position; const array = pos.array as Float32Array; for (let i = 0; i < count; i++) { array[i * 3 + 1] += velocities[i] * speed * delta; if (array[i * 3 + 1] > spread * 0.4) { array[i * 3 + 1] = -2; array[i * 3] = (Math.random() - 0.5) * spread; array[i * 3 + 2] = (Math.random() - 0.5) * spread; } } pos.needsUpdate = true; });
  return <points ref={meshRef} geometry={geometry}><pointsMaterial color={color} size={size} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation /></points>;
}

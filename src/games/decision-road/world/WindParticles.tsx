'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 600;
const SPREAD_X = 26;
const LENGTH_Z = 100;
const HEIGHT = 12;
const WIND_SPEED = 16;
const MAX_DT = 1 / 30;

export function WindParticles() {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      pos[i * 3 + 1] = Math.random() * HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * LENGTH_Z;
      sz[i] = 0.15 + Math.random() * 0.3;
    }
    return [pos, sz] as const;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, MAX_DT);
    const pos = meshRef.current.geometry.attributes.position;
    const array = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      array[i * 3 + 2] += WIND_SPEED * dt;
      array[i * 3] += (Math.sin(i * 0.7) * 0.6) * dt;
      array[i * 3 + 1] += (Math.cos(i * 1.3) * 0.3) * dt;
      if (array[i * 3 + 2] > LENGTH_Z / 2) {
        array[i * 3 + 2] = -LENGTH_Z / 2;
        array[i * 3] = (Math.random() - 0.5) * SPREAD_X;
        array[i * 3 + 1] = Math.random() * HEIGHT;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color="#e8e8e8"
        size={0.22}
        transparent
        opacity={0.7}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

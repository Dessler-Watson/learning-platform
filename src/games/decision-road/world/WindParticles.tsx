'use client';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 600;
const SPREAD_X = 30;
const HALF_RANGE = 55;
const HEIGHT = 14;
const BASE_SPEED = 14;
const SPEED_VAR = 8;
const MAX_DT = 1 / 30;

export function WindParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const speeds = useRef<Float32Array | null>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    const spd = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      pos[i * 3 + 1] = Math.random() * HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * HALF_RANGE * 2;
      sz[i] = 0.15 + Math.random() * 0.3;
      spd[i] = BASE_SPEED + (Math.random() - 0.5) * SPEED_VAR;
    }
    speeds.current = spd;
    return [pos, sz] as const;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

  useFrame((_, delta) => {
    if (!meshRef.current || !speeds.current) return;
    const dt = Math.min(delta, MAX_DT);
    const camZ = camera.position.z;
    const camX = camera.position.x;
    const pos = meshRef.current.geometry.attributes.position;
    const array = pos.array as Float32Array;
    const spd = speeds.current;
    for (let i = 0; i < COUNT; i++) {
      array[i * 3 + 2] += spd[i] * dt;
      array[i * 3] += (Math.sin(i * 0.7) * 0.5) * dt;
      array[i * 3 + 1] += (Math.cos(i * 1.3) * 0.25) * dt;
      const relZ = array[i * 3 + 2] - camZ;
      const relX = array[i * 3] - camX;
      if (relZ > HALF_RANGE || relX > SPREAD_X || relX < -SPREAD_X || array[i * 3 + 1] > HEIGHT || array[i * 3 + 1] < -2) {
        array[i * 3] = camX + (Math.random() - 0.5) * SPREAD_X;
        array[i * 3 + 1] = Math.random() * HEIGHT;
        array[i * 3 + 2] = camZ - HALF_RANGE + Math.random() * 10;
        spd[i] = BASE_SPEED + (Math.random() - 0.5) * SPEED_VAR;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color="#d8d8d8"
        size={0.25}
        transparent
        opacity={0.65}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

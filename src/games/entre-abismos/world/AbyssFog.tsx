'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function AbyssFog() {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const side = sr(i * 3 + 4000) > 0.5 ? 1 : -1;
      positions[i * 3] = side * (sr(i * 3 + 4001) * 30 + 14);
      positions[i * 3 + 1] = CFG.cloudLevel + 1 + sr(i * 3 + 4002) * 5;
      positions[i * 3 + 2] = sr(i * 3 + 4003) * 100 - 60;
      const tint = sr(i * 3 + 4004);
      if (tint > 0.6) {
        colors[i * 3] = 0.88; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.95;
      } else if (tint > 0.3) {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 0.96;
      } else {
        colors[i * 3] = 0.92; colors[i * 3 + 1] = 0.93; colors[i * 3 + 2] = 0.97;
      }
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(time * 0.15 + i * 0.5) * 0.004;
      positions[i * 3] += Math.cos(time * 0.08 + i * 0.3) * 0.002;
      positions[i * 3 + 2] += Math.sin(time * 0.06 + i * 0.2) * 0.001;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial vertexColors size={1.8} transparent opacity={0.3} depthWrite={false} sizeAttenuation />
    </points>
  );
}

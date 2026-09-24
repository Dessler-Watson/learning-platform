'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const START_Z = 2;
const FINISH_Z = -54.5;
const X_MIN = -42;
const X_MAX = 42;
const COUNT = 220;
const STREAK_COUNT = 160;

interface WindParticle {
  x: number;
  y: number;
  z: number;
  speed: number;
  length: number;
  phase: number;
}

export function WindParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const streakRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo<WindParticle[]>(() => {
    const list: WindParticle[] = [];
    const zRange = START_Z - FINISH_Z + 40;
    for (let i = 0; i < COUNT; i++) {
      list.push({
        x: X_MIN + sr(i * 3 + 4000) * (X_MAX - X_MIN),
        y: CFG.bridgeY - 2 + sr(i * 3 + 4001) * 16,
        z: sr(i * 3 + 4002) * zRange + FINISH_Z - 15,
        speed: 4 + sr(i * 5 + 4003) * 7,
        length: 0.6 + sr(i * 5 + 4004) * 1.8,
        phase: sr(i * 5 + 4005) * Math.PI * 2,
      });
    }
    return list;
  }, []);

  const streakParticles = useMemo<WindParticle[]>(() => {
    const list: WindParticle[] = [];
    const zRange = START_Z - FINISH_Z + 40;
    for (let i = 0; i < STREAK_COUNT; i++) {
      list.push({
        x: X_MIN + sr(i * 3 + 5000) * (X_MAX - X_MIN),
        y: CFG.bridgeY - 4 + sr(i * 3 + 5001) * 20,
        z: sr(i * 3 + 5002) * zRange + FINISH_Z - 15,
        speed: 7 + sr(i * 5 + 5003) * 11,
        length: 1.2 + sr(i * 5 + 5004) * 2.8,
        phase: sr(i * 5 + 5005) * Math.PI * 2,
      });
    }
    return list;
  }, []);

  const motePositions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, [particles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const span = X_MAX - X_MIN;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x -= p.speed * dt;
      if (p.x < X_MIN) p.x += span;

      if (pointsRef.current) {
        const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
        arr[i * 3] = p.x;
        arr[i * 3 + 1] = p.y + Math.sin(t * 0.7 + p.phase) * 0.35;
      }
    }

    for (let i = 0; i < streakParticles.length; i++) {
      const p = streakParticles[i];
      p.x -= p.speed * dt;
      if (p.x < X_MIN) p.x += span;

      if (streakRef.current) {
        dummy.position.set(
          p.x,
          p.y + Math.sin(t * 0.7 + p.phase) * 0.35,
          p.z,
        );
        dummy.scale.set(p.length, 0.03, 0.03);
        dummy.rotation.set(0, 0, Math.sin(t * 0.4 + p.phase) * 0.08);
        dummy.updateMatrix();
        streakRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (streakRef.current) {
      streakRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={motePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.16}
          transparent
          opacity={0.42}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <instancedMesh ref={streakRef} args={[undefined, undefined, STREAK_COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#f5f8ff" transparent opacity={0.2} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

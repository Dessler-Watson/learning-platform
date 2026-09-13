'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudData {
  x: number;
  y: number;
  z: number;
  s: number;
  spd: number;
  puffs: { ox: number; oy: number; oz: number; r: number }[];
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeCloud(seed: number, z: number, sideX: number): CloudData {
  const puffCount = 3 + Math.floor(seededRandom(seed * 31) * 3);
  const puffs = Array.from({ length: puffCount }, (_, i) => ({
    ox: (i - puffCount / 2) * (1.2 + seededRandom(seed * 41 + i * 7) * 0.8),
    oy: (seededRandom(seed * 51 + i * 11) - 0.5) * 0.6,
    oz: (seededRandom(seed * 61 + i * 13) - 0.5) * 0.8,
    r: 1.8 + seededRandom(seed * 71 + i * 17) * 1.5,
  }));
  return {
    x: sideX,
    y: 20 + seededRandom(seed * 81) * 25,
    z,
    s: 0.8 + seededRandom(seed * 91) * 0.6,
    spd: 0.01 + seededRandom(seed * 101) * 0.025,
    puffs,
  };
}

function CloudUnit({ data }: { data: CloudData }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.position.x += data.spd * dt;
      if (groupRef.current.position.x > 85) groupRef.current.position.x = -85;
    }
  });

  return (
    <group ref={groupRef} position={[data.x, data.y, data.z]} scale={data.s}>
      {data.puffs.map((puff, i) => (
        <mesh key={i} position={[puff.ox, puff.oy, puff.oz]} castShadow={false} receiveShadow={false}>
          <sphereGeometry args={[puff.r, 12, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.9}
            emissive="#f0f8ff"
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

interface CloudsProps {
  pathStartZ?: number;
  pathEndZ?: number;
  cloudsPerChunk?: number;
  extraChunks?: number;
}

export function Clouds({ pathStartZ, pathEndZ, cloudsPerChunk = 3, extraChunks = 2 }: CloudsProps) {
  const list = useMemo(() => {
    if (pathStartZ == null || pathEndZ == null) {
      const fixed: CloudData[] = Array.from({ length: 12 }, (_, i) => {
        const puffCount = 3 + Math.floor(seededRandom(i * 31) * 3);
        const puffs = Array.from({ length: puffCount }, (_, j) => ({
          ox: (j - puffCount / 2) * (1.2 + seededRandom(i * 41 + j * 7) * 0.8),
          oy: (seededRandom(i * 51 + j * 11) - 0.5) * 0.6,
          oz: (seededRandom(i * 61 + j * 13) - 0.5) * 0.8,
          r: 1.8 + seededRandom(i * 71 + j * 17) * 1.5,
        }));
        return {
          x: (seededRandom(i * 3) - 0.5) * 160,
          y: 20 + seededRandom(i * 81) * 25,
          z: seededRandom(i * 13) * 520 - 440,
          s: 0.8 + seededRandom(i * 91) * 0.6,
          spd: 0.01 + seededRandom(i * 101) * 0.025,
          puffs,
        };
      });
      return fixed;
    }

    const CHUNK_SIZE = 80;
    const frontZ = Math.max(pathStartZ, pathEndZ) + extraChunks * CHUNK_SIZE;
    const backZ = Math.min(pathStartZ, pathEndZ) - extraChunks * CHUNK_SIZE;
    const clouds: CloudData[] = [];
    let seed = 0;

    for (let z = frontZ; z >= backZ; z -= CHUNK_SIZE) {
      for (let c = 0; c < cloudsPerChunk; c++) {
        const side = seededRandom(seed * 3) > 0.5 ? 1 : -1;
        const sideX = side * (25 + seededRandom(seed * 7) * 55);
        clouds.push(makeCloud(seed, z - seededRandom(seed * 13) * CHUNK_SIZE, sideX));
        seed++;
      }
    }

    return clouds;
  }, [pathStartZ, pathEndZ, cloudsPerChunk, extraChunks]);

  return (
    <group>
      {list.map((c, i) => (
        <CloudUnit key={i} data={c} />
      ))}
    </group>
  );
}

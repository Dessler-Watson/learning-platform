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

const CLOUDS: CloudData[] = Array.from({ length: 12 }, () => {
  const puffCount = 3 + Math.floor(Math.random() * 3);
  const puffs = Array.from({ length: puffCount }, (_, i) => ({
    ox: (i - puffCount / 2) * (1.2 + Math.random() * 0.8),
    oy: (Math.random() - 0.5) * 0.6,
    oz: (Math.random() - 0.5) * 0.8,
    r: 1.8 + Math.random() * 1.5,
  }));
  return {
    x: (Math.random() - 0.5) * 160,
    y: 20 + Math.random() * 25,
    z: Math.random() * 520 - 440,
    s: 0.8 + Math.random() * 0.6,
    spd: 0.01 + Math.random() * 0.025,
    puffs,
  };
});

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

export function Clouds() {
  const list = useMemo(() => CLOUDS, []);
  return (
    <group>
      {list.map((c, i) => (
        <CloudUnit key={i} data={c} />
      ))}
    </group>
  );
}

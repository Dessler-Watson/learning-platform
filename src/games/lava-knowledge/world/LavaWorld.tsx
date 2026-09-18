'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Arena } from './Arena';
import { PlayerTowers } from './PlayerTowers';
import { FloatingDiamonds } from './FloatingDiamonds';

const ASH_COUNT = 600;

function AshParticles() {
  const ref = useRef<THREE.Points>(null);
  const colors = useMemo(() => {
    const c = new Float32Array(ASH_COUNT * 3);
    for (let i = 0; i < ASH_COUNT; i++) {
      const t = Math.random();
      if (t < 0.4) {
        // Hot embers — bright orange/red
        c[i * 3] = 1.0; c[i * 3 + 1] = 0.3 + Math.random() * 0.3; c[i * 3 + 2] = 0.05;
      } else if (t < 0.7) {
        // Warm ash — brownish
        c[i * 3] = 0.6 + Math.random() * 0.2; c[i * 3 + 1] = 0.4 + Math.random() * 0.15; c[i * 3 + 2] = 0.25;
      } else {
        // Cold ash — grey
        const g = 0.4 + Math.random() * 0.3;
        c[i * 3] = g; c[i * 3 + 1] = g; c[i * 3 + 2] = g;
      }
    }
    return c;
  }, []);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(ASH_COUNT * 3);
    const vel = new Float32Array(ASH_COUNT * 3);
    for (let i = 0; i < ASH_COUNT; i++) {
      // Spawn from edges and ground level
      const edge = Math.random() < 0.5;
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = edge ? 45 + Math.random() * 20 : Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;

      // Violent velocities — chaotic eruption
      const angle = Math.random() * Math.PI * 2;
      const horizSpeed = 3.0 + Math.random() * 8.0;
      const upBias = Math.random() < 0.3 ? (3.0 + Math.random() * 6.0) : -(2.0 + Math.random() * 6.0);
      vel[i * 3] = Math.cos(angle) * horizSpeed + (Math.random() - 0.5) * 4.0;
      vel[i * 3 + 1] = upBias;
      vel[i * 3 + 2] = Math.sin(angle) * horizSpeed + (Math.random() - 0.5) * 4.0;
    }
    return { positions: pos, velocities: vel };
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(ASH_COUNT);
    for (let i = 0; i < ASH_COUNT; i++) {
      s[i] = 0.15 + Math.random() * 0.45;
    }
    return s;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < ASH_COUNT; i++) {
      // Apply turbulence — particles swirl chaotically
      const turbX = (Math.random() - 0.5) * 2.0 * dt;
      const turbY = (Math.random() - 0.5) * 1.5 * dt;
      const turbZ = (Math.random() - 0.5) * 2.0 * dt;

      p[i * 3] += velocities[i * 3] * dt + turbX;
      p[i * 3 + 1] += velocities[i * 3 + 1] * dt + turbY;
      p[i * 3 + 2] += velocities[i * 3 + 2] * dt + turbZ;

      if (p[i * 3 + 1] < -5 || Math.abs(p[i * 3]) > 50 || Math.abs(p[i * 3 + 2]) > 50) {
        const edge = Math.random() < 0.5;
        p[i * 3] = (Math.random() - 0.5) * 80;
        p[i * 3 + 1] = edge ? 45 + Math.random() * 20 : Math.random() * 15;
        p[i * 3 + 2] = (Math.random() - 0.5) * 80;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.35}
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function LavaWorld() {
  return (
    <group>
      <ambientLight intensity={0.35} color="#ffe0c0" />
      <hemisphereLight args={['#87CEEB', '#FF6600', 0.5]} />

      <directionalLight
        position={[20, 30, 15]}
        intensity={1.8}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />

      <pointLight position={[0, 0, 0]} intensity={3.0} color="#FF6600" distance={30} decay={2} />
      <pointLight position={[-8, 1, -8]} intensity={1.8} color="#FF4400" distance={20} decay={2} />
      <pointLight position={[8, 1, 8]} intensity={1.8} color="#FF4400" distance={20} decay={2} />

      <directionalLight position={[-15, 10, -8]} intensity={0.5} color="#b3d9ff" />

      <AshParticles />

      <FloatingDiamonds />

      <Arena>
        <PlayerTowers />
      </Arena>
    </group>
  );
}

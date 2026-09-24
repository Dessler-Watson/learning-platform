'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { getGlassTexture } from './RockTextures';
import { getPlacedRocks } from './FloatingRocks';
import {
  sr,
  START_Z,
  FINISH_Z,
  generateValleyWalls,
  wallObstacles,
  resolveOverlaps,
  type SphereItem,
} from './layout';

function crystalBounds(c: CrystalData): number {
  let extent = c.scale * 1.3;
  if (c.kind === 'spike') extent = c.scale * 1.6;
  else if (c.kind === 'cluster') extent = c.scale * 1.5;
  else if (c.kind === 'twin') extent = c.scale * 1.4;
  return extent + c.bobAmp;
}

let glassMatCache: Map<string, THREE.MeshStandardMaterial> | null = null;

function getGlassCrystalMat(
  color: string,
  emissive: string,
  emissiveIntensity: number,
  opacity: number,
): THREE.MeshStandardMaterial {
  if (!glassMatCache) glassMatCache = new Map();
  const key = `${color}_${emissive}_${emissiveIntensity}_${opacity}`;
  let m = glassMatCache.get(key);
  if (!m) {
    const map = typeof document !== 'undefined' ? getGlassTexture() : null;
    m = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      roughness: 0.1,
      metalness: 0.35,
      transparent: true,
      opacity,
      map: map || undefined,
    });
    glassMatCache.set(key, m);
  }
  return m;
}

type CrystalKind = 'single' | 'twin' | 'spike' | 'cluster' | 'shard';

interface CrystalData {
  pos: [number, number, number];
  scale: number;
  rotY: number;
  bobSpeed: number;
  bobAmp: number;
  rotSpeed: number;
  kind: CrystalKind;
  hue: number;
}

const PALETTE = [
  { color: '#9b59b6', emissive: '#7b2fbe' },
  { color: '#a855f7', emissive: '#9333ea' },
  { color: '#8b5cf6', emissive: '#6d28d9' },
  { color: '#c084fc', emissive: '#a855f7' },
  { color: '#7c3aed', emissive: '#5b21b6' },
  { color: '#d8b4fe', emissive: '#a855f7' },
];

function generateCrystals(): CrystalData[] {
  const crystals: CrystalData[] = [];
  const kinds: CrystalKind[] = ['single', 'twin', 'spike', 'cluster', 'shard'];

  for (let i = 0; i < 42; i++) {
    const side = sr(i * 3) > 0.5 ? 1 : -1;
    const x = side * (sr(i * 3 + 1) * 18 + 16);
    const z = sr(i * 3 + 2) * (START_Z - FINISH_Z + 20) + FINISH_Z - 10;
    const y = CFG.bridgeY + sr(i * 3 + 3) * 8 - 2;
    crystals.push({
      pos: [x, y, z],
      scale: sr(i * 5 + 100) * 0.3 + 0.15,
      rotY: sr(i * 5 + 101) * Math.PI * 2,
      bobSpeed: sr(i * 5 + 102) * 0.5 + 0.3,
      bobAmp: sr(i * 5 + 103) * 0.12 + 0.04,
      rotSpeed: sr(i * 5 + 104) * 0.3 + 0.1,
      kind: kinds[Math.floor(sr(i * 7 + 105) * kinds.length)],
      hue: Math.floor(sr(i * 3 + 106) * PALETTE.length),
    });
  }

  for (let i = 0; i < 28; i++) {
    const side = sr(i * 3 + 500) > 0.5 ? 1 : -1;
    const x = side * (sr(i * 3 + 501) * 14 + 16);
    const z = sr(i * 3 + 502) * (START_Z - FINISH_Z + 10) + FINISH_Z - 5;
    const y = CFG.bridgeY + sr(i * 3 + 503) * 4;
    crystals.push({
      pos: [x, y, z],
      scale: sr(i * 5 + 600) * 0.4 + 0.3,
      rotY: sr(i * 5 + 601) * Math.PI * 2,
      bobSpeed: sr(i * 5 + 602) * 0.4 + 0.2,
      bobAmp: sr(i * 5 + 603) * 0.15 + 0.06,
      rotSpeed: sr(i * 5 + 604) * 0.2 + 0.05,
      kind: kinds[Math.floor(sr(i * 7 + 605) * kinds.length)],
      hue: Math.floor(sr(i * 3 + 606) * PALETTE.length),
    });
  }

  for (let i = 0; i < 22; i++) {
    const side = sr(i * 3 + 1000) > 0.5 ? 1 : -1;
    const x = side * (sr(i * 3 + 1001) * 10 + 20);
    const z = sr(i * 3 + 1002) * (START_Z - FINISH_Z + 20) + FINISH_Z - 10;
    const y = CFG.bridgeY + 5 + sr(i * 3 + 1003) * 6;
    crystals.push({
      pos: [x, y, z],
      scale: sr(i * 5 + 1100) * 0.6 + 0.5,
      rotY: sr(i * 5 + 1101) * Math.PI * 2,
      bobSpeed: sr(i * 5 + 1102) * 0.3 + 0.15,
      bobAmp: sr(i * 5 + 1103) * 0.25 + 0.08,
      rotSpeed: sr(i * 5 + 1104) * 0.15 + 0.05,
      kind: kinds[Math.floor(sr(i * 7 + 1105) * kinds.length)],
      hue: Math.floor(sr(i * 3 + 1106) * PALETTE.length),
    });
  }

  for (let i = 0; i < 18; i++) {
    const side = sr(i * 3 + 1500) > 0.5 ? 1 : -1;
    const x = side * (sr(i * 3 + 1501) * 22 + 8);
    const z = sr(i * 3 + 1502) * (START_Z - FINISH_Z + 16) + FINISH_Z - 8;
    const y = CFG.bridgeY + sr(i * 3 + 1503) * 12 - 4;
    crystals.push({
      pos: [x, y, z],
      scale: sr(i * 5 + 1600) * 0.35 + 0.2,
      rotY: sr(i * 5 + 1601) * Math.PI * 2,
      bobSpeed: sr(i * 5 + 1602) * 0.45 + 0.25,
      bobAmp: sr(i * 5 + 1603) * 0.14 + 0.05,
      rotSpeed: sr(i * 5 + 1604) * 0.25 + 0.08,
      kind: kinds[Math.floor(sr(i * 7 + 1605) * kinds.length)],
      hue: Math.floor(sr(i * 3 + 1606) * PALETTE.length),
    });
  }

  const walls = wallObstacles(generateValleyWalls());
  const rocks = getPlacedRocks().map((r) => ({
    pos: [...r.pos] as [number, number, number],
    radius: Math.max(r.scale[0], r.scale[1], r.scale[2]) * 1.25 + r.bobAmp,
  }));
  const items: SphereItem[] = crystals.map((c) => ({
    pos: [...c.pos] as [number, number, number],
    radius: crystalBounds(c),
  }));
  resolveOverlaps(items, [...walls, ...rocks], { minXAbs: 9, maxXAbs: 40, seed: 3333 });
  crystals.forEach((c, i) => {
    c.pos = items[i].pos;
  });

  return crystals;
}

function CrystalBody({ kind, scale, hue }: { kind: CrystalKind; scale: number; hue: number }) {
  const pal = PALETTE[hue % PALETTE.length];
  const main = getGlassCrystalMat(pal.color, pal.emissive, 2.5, 0.82);
  const soft = getGlassCrystalMat(pal.color, pal.emissive, 2, 0.72);
  const softer = getGlassCrystalMat(pal.color, pal.emissive, 1.8, 0.68);

  if (kind === 'twin') {
    return (
      <group>
        <mesh scale={[scale, scale * 1.5, scale]} material={main}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
        <mesh scale={[scale * 0.55, scale * 0.9, scale * 0.55]} position={[scale * 0.45, -scale * 0.15, scale * 0.1]} rotation={[0.1, 0, 0.35]} material={soft}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
      </group>
    );
  }

  if (kind === 'spike') {
    return (
      <group>
        <mesh scale={[scale * 0.55, scale * 2.1, scale * 0.55]} material={main}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
        <mesh scale={[scale * 0.35, scale * 1.2, scale * 0.35]} position={[scale * 0.3, -scale * 0.3, 0]} rotation={[0, 0, 0.45]} material={soft}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
        <mesh scale={[scale * 0.28, scale * 0.9, scale * 0.28]} position={[-scale * 0.28, -scale * 0.4, scale * 0.1]} rotation={[0, 0, -0.5]} material={softer}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
      </group>
    );
  }

  if (kind === 'cluster') {
    return (
      <group>
        <mesh scale={[scale * 1.1, scale * 1.1, scale * 1.1]} material={main}>
          <icosahedronGeometry args={[0.45, 0]} />
        </mesh>
        <mesh scale={[scale * 0.6, scale * 1.3, scale * 0.6]} position={[scale * 0.35, scale * 0.2, 0]} rotation={[0, 0, 0.4]} material={soft}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
        <mesh scale={[scale * 0.45, scale * 0.8, scale * 0.45]} position={[-scale * 0.3, -scale * 0.2, scale * 0.2]} rotation={[0.2, 0, -0.35]} material={softer}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
        <mesh scale={[scale * 0.4, scale * 0.55, scale * 0.4]} position={[scale * 0.1, -scale * 0.35, -scale * 0.25]} material={soft}>
          <tetrahedronGeometry args={[0.5, 0]} />
        </mesh>
      </group>
    );
  }

  if (kind === 'shard') {
    return (
      <group>
        <mesh scale={[scale * 0.7, scale * 1.8, scale * 0.35]} rotation={[0.15, 0, 0.2]} material={main}>
          <tetrahedronGeometry args={[0.55, 0]} />
        </mesh>
        <mesh scale={[scale * 0.45, scale * 1.1, scale * 0.3]} position={[scale * 0.35, -scale * 0.1, scale * 0.15]} rotation={[-0.1, 0.4, -0.3]} material={soft}>
          <tetrahedronGeometry args={[0.5, 0]} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh scale={[scale, scale * 1.4, scale]} material={main}>
      <octahedronGeometry args={[0.5, 0]} />
    </mesh>
  );
}

function SingleCrystal({ data, withLight }: { data: CrystalData; withLight: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pal = PALETTE[data.hue % PALETTE.length];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = data.pos[1] + Math.sin(t * data.bobSpeed + data.pos[0]) * data.bobAmp;
    groupRef.current.rotation.y = data.rotY + t * data.rotSpeed;
  });

  return (
    <group ref={groupRef} position={data.pos}>
      <CrystalBody kind={data.kind} scale={data.scale} hue={data.hue} />
      {withLight && (
        <pointLight color={pal.color} intensity={data.scale * 2} distance={10} decay={2} />
      )}
    </group>
  );
}

function CrystalParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const side = sr(i * 3 + 2000) > 0.5 ? 1 : -1;
      positions[i * 3] = side * (sr(i * 3 + 2001) * 14 + 16);
      positions[i * 3 + 1] = CFG.bridgeY + sr(i * 3 + 2002) * 10 - 1;
      positions[i * 3 + 2] = sr(i * 3 + 2003) * 70 - 58;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.7) * 0.003;
      arr[i * 3] += Math.cos(t * 0.15 + i * 0.4) * 0.002;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#c084fc" size={0.2} transparent opacity={0.5} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function PurpleCrystals() {
  const crystals = useMemo(() => generateCrystals(), []);

  return (
    <group>
      {crystals.map((c, i) => (
        <SingleCrystal key={i} data={c} withLight={i < 8} />
      ))}
      <CrystalParticles />
    </group>
  );
}

'use client';
import { useMemo } from 'react';
import { RigidBody, CylinderCollider, ConeCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { getRockSetScaled, getRockVariantForColor, getGlassTexture } from './RockTextures';

interface MountainProps {
  position: [number, number, number];
  scale?: number;
  height?: number;
  seed?: number;
}

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

function getCachedMat(color: string, roughness: number, useRock = true): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${useRock ? 'r' : 'n'}`;
  let m = matCache.get(key);
  if (!m) {
    const useMap = useRock && typeof document !== 'undefined';
    const variant = getRockVariantForColor(color);
    const rock = useMap ? getRockSetScaled(variant, 6) : null;
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      flatShading: true,
      map: rock?.map,
      normalMap: rock?.normalMap,
      normalScale: new THREE.Vector2(1.35, 1.35),
    });
    matCache.set(key, m);
  }
  return m;
}

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function CrystalMesh({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const glass = typeof document !== 'undefined' ? getGlassTexture() : null;
  return (
    <mesh position={position} scale={[scale * 0.2, scale * 0.35, scale * 0.2]}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color="#9b59b6"
        emissive="#7b2fbe"
        emissiveIntensity={2.5}
        roughness={0.12}
        metalness={0.4}
        transparent
        opacity={0.82}
        map={glass || undefined}
      />
    </mesh>
  );
}

export interface PeakListEntry {
  x: number; y: number; z: number; r: number; h: number;
  rotX: number; rotZ: number; yaw: number; segments: number; color: string;
}

function buildPeaks(seed: number, baseY: number, baseR: number, totalH: number, color: string): PeakListEntry[] {
  const list: PeakListEntry[] = [];

  list.push({
    x: 0, y: baseY + totalH / 2, z: 0,
    r: baseR * 0.7, h: totalH, rotX: 0, rotZ: 0, yaw: 0,
    segments: 5 + Math.floor(sr(seed) * 3), color,
  });

  const sideCount = 3 + Math.floor(sr(seed + 10) * 4);
  for (let i = 0; i < sideCount; i++) {
    const angle = sr(seed + i * 7 + 20) * Math.PI * 2;
    const dist = baseR * (0.4 + sr(seed + i * 7 + 21) * 0.55);
    const ph = totalH * (0.3 + sr(seed + i * 7 + 22) * 0.55);
    const pr = baseR * (0.2 + sr(seed + i * 7 + 23) * 0.35);
    list.push({
      x: Math.cos(angle) * dist,
      y: baseY + ph / 2 - sr(seed + i * 7 + 24) * 2,
      z: Math.sin(angle) * dist,
      r: pr, h: ph,
      rotX: (sr(seed + i * 7 + 25) - 0.5) * 0.3,
      rotZ: (sr(seed + i * 7 + 26) - 0.5) * 0.3,
      yaw: 0,
      segments: 4 + Math.floor(sr(seed + i * 7 + 27) * 3),
      color: sr(seed + i * 7 + 28) > 0.5 ? color : shadeColor(color, -18),
    });
  }

  const bumpCount = 3 + Math.floor(sr(seed + 200) * 4);
  for (let i = 0; i < bumpCount; i++) {
    const angle = sr(seed + i * 11 + 100) * Math.PI * 2;
    const dist = baseR * (0.6 + sr(seed + i * 11 + 101) * 0.5);
    const bh = totalH * (0.1 + sr(seed + i * 11 + 102) * 0.25);
    const br = baseR * (0.25 + sr(seed + i * 11 + 103) * 0.3);
    list.push({
      x: Math.cos(angle) * dist,
      y: baseY + bh / 2,
      z: Math.sin(angle) * dist,
      r: br, h: bh,
      rotX: (sr(seed + i * 11 + 104) - 0.5) * 0.4,
      rotZ: (sr(seed + i * 11 + 105) - 0.5) * 0.4,
      yaw: 0,
      segments: 5 + Math.floor(sr(seed + i * 11 + 106) * 3),
      color: shadeColor(color, -28 + Math.floor(sr(seed + i * 11 + 107) * 36)),
    });
  }

  list.forEach((p, i) => {
    p.yaw = sr(seed + i * 3 + 500) * Math.PI * 2;
  });

  return list;
}

export function PeakCluster({ seed, baseY, baseR, totalH, color, withCrystals = true }: {
  seed: number;
  baseY: number;
  baseR: number;
  totalH: number;
  color: string;
  withCrystals?: boolean;
}) {
  const peaks = useMemo(
    () => buildPeaks(seed, baseY, baseR, totalH, color),
    [seed, baseY, baseR, totalH, color],
  );

  const crystalSpots = useMemo(() => {
    if (!withCrystals) return [];
    const spots: { x: number; y: number; z: number; s: number }[] = [];
    const count = 3 + Math.floor(sr(seed + 300) * 2);
    for (let i = 0; i < count; i++) {
      const angle = sr(seed + i * 13 + 400) * Math.PI * 2;
      const dist = baseR * (0.5 + sr(seed + i * 13 + 401) * 0.5);
      spots.push({
        x: Math.cos(angle) * dist,
        y: baseY + totalH * (0.15 + sr(seed + i * 13 + 402) * 0.5),
        z: Math.sin(angle) * dist,
        s: 0.6 + sr(seed + i * 13 + 403) * 0.8,
      });
    }
    return spots;
  }, [seed, baseR, baseY, totalH, withCrystals]);

  return (
    <group>
      {peaks.map((p, i) => (
        <mesh
          key={`p-${i}`}
          position={[p.x, p.y, p.z]}
          rotation={[p.rotX, p.yaw, p.rotZ]}
          castShadow
          receiveShadow
          material={getCachedMat(p.color, 0.85)}
        >
          <coneGeometry args={[p.r, p.h, p.segments]} />
        </mesh>
      ))}
      {crystalSpots.map((c, i) => (
        <CrystalMesh key={`cr-${i}`} position={[c.x, c.y, c.z]} scale={c.s} />
      ))}
    </group>
  );
}

const PALETTE = [
  '#f5efe4', '#efe8da', '#f7f2e8', '#ebe4d6', '#e6dece', '#f2ebe0',
  '#f0e6d4', '#e8dcc8', '#f4ecdc', '#e4dac6', '#eee4d0', '#f6f0e4',
];

function baseR(seed: number): number {
  return 10.5 + sr(seed + 77) * 6.5;
}

export function Mountain({ position, scale = 1, height = 45, seed = 0 }: MountainProps) {
  const baseColor = useMemo(() => PALETTE[Math.floor(sr(seed + 999) * PALETTE.length)], [seed]);
  const r = baseR(seed);
  const sxz = scale * 1.28;
  const sy = scale;

  const collisionPeaks = useMemo(() => {
    const a = buildPeaks(seed + 1, 4, r, height, baseColor);
    const b = buildPeaks(seed + 100, 2, r * 0.7, height * 0.55, shadeColor(baseColor, 10));
    return [...a, ...b];
  }, [seed, r, height, baseColor]);

  const baseSlices = useMemo(() => {
    const h = 6;
    const y = 2;
    const steps = 4;
    const slices: { y: number; halfH: number; r: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const radius = (r + (r * 1.2 - r) * t) * 0.96;
      slices.push({
        y: (y - h / 2 + t * h) * sy,
        halfH: (h / (2 * steps)) * sy + 0.02,
        r: radius * sxz,
      });
    }
    return slices;
  }, [r, sxz, sy]);

  return (
    <group position={position}>
      <group scale={[sxz, sy, sxz]}>
        <mesh
          position={[0, 2, 0]}
          castShadow
          receiveShadow
          material={getCachedMat(shadeColor(baseColor, -10), 0.88)}
        >
          <cylinderGeometry args={[r, r * 1.2, 6, 7 + Math.floor(sr(seed + 50) * 3)]} />
        </mesh>

        <PeakCluster seed={seed + 1} baseY={4} baseR={r} totalH={height} color={baseColor} />
        <PeakCluster seed={seed + 100} baseY={2} baseR={r * 0.7} totalH={height * 0.55} color={shadeColor(baseColor, 10)} withCrystals={false} />
      </group>

      <RigidBody type="fixed" colliders={false} name="mountain-body">
        {baseSlices.map((s, i) => (
          <CylinderCollider key={`mb-${i}`} args={[s.halfH, s.r]} position={[0, s.y, 0]} />
        ))}
        {collisionPeaks.map((p, i) => (
          <ConeCollider
            key={`mp-${i}`}
            args={[(p.h * sy) * 0.48, p.r * sxz * 0.92]}
            position={[p.x * sxz, p.y * sy, p.z * sxz]}
            rotation={[p.rotX, p.yaw, p.rotZ]}
          />
        ))}
      </RigidBody>
    </group>
  );
}

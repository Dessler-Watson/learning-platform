'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useAbismosStore } from '@/stores/abismos.store';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { getRockSetScaled, getRockVariantForColor, getGlassTexture } from './RockTextures';

const ANIM_DURATION = 0.8;
const HIDDEN_Y = -100;
const START_Z = 2;
const FIRST_FLOAT_Z = START_Z - CFG.startPlatformDepth / 2 - CFG.platformGap - CFG.platformDepth / 2;

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const platMatCache = new Map<string, THREE.MeshStandardMaterial>();

function getPlatformMat(color: string, roughness: number): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}`;
  let m = platMatCache.get(key);
  if (!m) {
    const variant = getRockVariantForColor(color);
    const rock = typeof document !== 'undefined' ? getRockSetScaled(variant, 3.5) : null;
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      flatShading: true,
      map: rock?.map,
      normalMap: rock?.normalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
    });
    platMatCache.set(key, m);
  }
  return m;
}

interface SinglePlatformProps {
  index: number;
  targetY: number;
  shouldExist: boolean;
}

function PlatformCrystals() {
  const glass = typeof document !== 'undefined' ? getGlassTexture() : null;
  return (
    <group>
      <mesh position={[1.2, 0.4, 0.8]} scale={[0.08, 0.14, 0.08]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#9b59b6" emissive="#7b2fbe" emissiveIntensity={2.5} roughness={0.12} metalness={0.4} transparent opacity={0.82} map={glass || undefined} />
      </mesh>
      <mesh position={[-0.9, 0.35, -1]} scale={[0.06, 0.1, 0.06]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={2} roughness={0.12} metalness={0.4} transparent opacity={0.75} map={glass || undefined} />
      </mesh>
    </group>
  );
}

function generatePlatformGeometry(index: number) {
  const seed = index * 1000 + 42;

  const topSeg = 7 + Math.floor(sr(seed) * 4);
  const topR = CFG.platformWidth * 0.48 * (0.92 + sr(seed + 1) * 0.12);
  const topH = 0.22 + sr(seed + 2) * 0.12;
  const topRot = sr(seed + 3) * Math.PI;
  const topTiltX = (sr(seed + 4) - 0.5) * 0.04;
  const topTiltZ = (sr(seed + 5) - 0.5) * 0.04;

  const underSeg = 6 + Math.floor(sr(seed + 10) * 4);
  const underR = topR * (0.75 + sr(seed + 11) * 0.2);
  const underH = 0.5 + sr(seed + 12) * 0.4;
  const underRot = sr(seed + 13) * Math.PI;

  const hanging: {
    x: number; z: number; r: number; h: number;
    rotX: number; rotZ: number; rotY: number; seg: number; color: string;
  }[] = [];

  const hangCount = 8 + Math.floor(sr(seed + 20) * 6);
  for (let i = 0; i < hangCount; i++) {
    const angle = sr(seed + i * 7 + 30) * Math.PI * 2;
    const dist = topR * (0.35 + sr(seed + i * 7 + 31) * 0.6);
    const hr = 0.15 + sr(seed + i * 7 + 32) * 0.35;
    const hh = 0.5 + sr(seed + i * 7 + 33) * 1.4;
    const shade = Math.floor(sr(seed + i * 7 + 34) * 4);
    const colors = ['#c8b8a0', '#d0c0a8', '#bfae96', '#c2b29a', '#c4b098', '#b8a890'];
    hanging.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      r: hr,
      h: hh,
      rotX: Math.PI + (sr(seed + i * 7 + 35) - 0.5) * 0.5,
      rotZ: (sr(seed + i * 7 + 36) - 0.5) * 0.5,
      rotY: sr(seed + i * 7 + 37) * Math.PI * 2,
      seg: 4 + Math.floor(sr(seed + i * 7 + 38) * 3),
      color: colors[shade],
    });
  }

  const rootCount = 3 + Math.floor(sr(seed + 50) * 4);
  const roots: {
    x: number; z: number; r: number; h: number;
    rotX: number; rotZ: number; rotY: number; seg: number;
  }[] = [];
  for (let i = 0; i < rootCount; i++) {
    const angle = sr(seed + i * 11 + 60) * Math.PI * 2;
    const dist = topR * (0.2 + sr(seed + i * 11 + 61) * 0.35);
    roots.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      r: 0.3 + sr(seed + i * 11 + 62) * 0.35,
      h: 1.0 + sr(seed + i * 11 + 63) * 1.5,
      rotX: Math.PI + (sr(seed + i * 11 + 64) - 0.5) * 0.3,
      rotZ: (sr(seed + i * 11 + 65) - 0.5) * 0.3,
      rotY: sr(seed + i * 11 + 66) * Math.PI * 2,
      seg: 5 + Math.floor(sr(seed + i * 11 + 67) * 3),
    });
  }

  const topColor = [
    '#f7f0e4', '#f2ebde', '#f9f4ea', '#efe8dc', '#f5ebe0', '#f0e6d8',
    '#f8f2e8', '#eee4d4', '#f3eadc', '#f6efe2',
  ][Math.floor(sr(seed + 100) * 10)];
  const underColor = ['#c4b49c', '#b8a890', '#a89880', '#bca890', '#c0b098'][Math.floor(sr(seed + 101) * 5)];

  return { topSeg, topR, topH, topRot, topTiltX, topTiltZ, underSeg, underR, underH, underRot, hanging, roots, topColor, underColor };
}

function SinglePlatform({ index, targetY, shouldExist }: SinglePlatformProps) {
  const rbRef = useRef<any>(null);
  const currentY = useRef(shouldExist ? targetY : HIDDEN_Y);
  const existsRef = useRef(shouldExist);
  const platformZ = FIRST_FLOAT_Z - index * (CFG.platformDepth + CFG.platformGap);

  const geo = useMemo(() => generatePlatformGeometry(index), [index]);

  useFrame((state, delta) => {
    if (!rbRef.current) return;
    const target = existsRef.current ? targetY : HIDDEN_Y;
    const speed = 1 / ANIM_DURATION;
    currentY.current = THREE.MathUtils.lerp(currentY.current, target, Math.min(speed * delta, 1));
    const osc =
      existsRef.current
        ? Math.sin(state.clock.elapsedTime * 1.15 + index * 1.4) * 0.1
        : 0;
    rbRef.current.setNextKinematicTranslation({
      x: 0,
      y: currentY.current + osc,
      z: platformZ,
    });
  });

  useEffect(() => {
    existsRef.current = shouldExist;
  }, [shouldExist]);

  const startPos = shouldExist ? targetY : HIDDEN_Y;
  const halfW = CFG.platformWidth / 2;
  const halfD = CFG.platformDepth / 2;
  const baseY = -CFG.platformHeight / 2;

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      position={[0, startPos, platformZ]}
      colliders={false}
      name={`floating-platform-${index}`}
    >
      <mesh
        position={[0, baseY + geo.topH * 0.5, 0]}
        rotation={[geo.topTiltX, geo.topRot, geo.topTiltZ]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[geo.topR, geo.topR * 0.96, geo.topH, geo.topSeg]} />
        <primitive object={getPlatformMat(geo.topColor, 0.85)} attach="material" />
      </mesh>

      <mesh
        position={[0, baseY - geo.underH * 0.4, 0]}
        rotation={[0, geo.underRot, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[geo.underR, geo.underR * 0.6, geo.underH, geo.underSeg]} />
        <primitive object={getPlatformMat(geo.underColor, 0.9)} attach="material" />
      </mesh>

      {geo.hanging.map((h, i) => (
        <mesh
          key={`h-${i}`}
          position={[h.x, baseY - geo.underH * 0.3 - h.h * 0.3, h.z]}
          rotation={[h.rotX, h.rotY, h.rotZ]}
          castShadow
        >
          <coneGeometry args={[h.r, h.h, h.seg]} />
          <primitive object={getPlatformMat(h.color, 0.9)} attach="material" />
        </mesh>
      ))}

      {geo.roots.map((r, i) => (
        <mesh
          key={`r-${i}`}
          position={[r.x, baseY - geo.underH * 0.5 - r.h * 0.35, r.z]}
          rotation={[r.rotX, r.rotY, r.rotZ]}
          castShadow
        >
          <coneGeometry args={[r.r, r.h, r.seg]} />
          <primitive object={getPlatformMat('#7a6a55', 0.92)} attach="material" />
        </mesh>
      ))}

      {index % 2 === 0 && <PlatformCrystals />}

      <CuboidCollider args={[halfW, CFG.platformHeight / 2, halfD]} />
    </RigidBody>
  );
}

export function BridgePlatforms() {
  const platforms = useAbismosStore((s) => s.platforms);

  const platformData = useMemo(() => {
    const data: { index: number; targetY: number }[] = [];
    for (let i = 0; i < CFG.maxPlatforms; i++) {
      data.push({ index: i, targetY: CFG.bridgeY });
    }
    return data;
  }, []);

  return (
    <group>
      {platformData.map((p) => (
        <SinglePlatform
          key={p.index}
          index={p.index}
          targetY={p.targetY}
          shouldExist={p.index < platforms}
        />
      ))}
    </group>
  );
}

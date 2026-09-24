'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { LavaSurface } from './LavaSurface';
import { createProceduralStoneMaterial } from './ProceduralStoneMaterial';

const LAVA_Y = -1.0;
const ARENA_HALF = 20;

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

/* Shared stone — volcanic rock + bottom-up lava glow on walls */
let sharedStoneMat: THREE.ShaderMaterial | null = null;
function getPlatformStoneMat(): THREE.ShaderMaterial {
  if (!sharedStoneMat) {
    sharedStoneMat = createProceduralStoneMaterial({
      scale: 1.4,
      brightness: 0.2,
      glowStrength: 0.65,
      glowHeight: 7,
      glowBaseY: -1,
    });
  }
  return sharedStoneMat;
}

/* Mountains — coarser grain + lava bounce only near the base */
let sharedMountainMat: THREE.ShaderMaterial | null = null;
function getMountainStoneMat(): THREE.ShaderMaterial {
  if (!sharedMountainMat) {
    sharedMountainMat = createProceduralStoneMaterial({
      scale: 0.7,
      brightness: 0.2,
      glowStrength: 0.5,
      glowHeight: 10,
      glowBaseY: -1,
    });
  }
  return sharedMountainMat;
}

/* ── Perimeter wall — platform stone + colliders ── */
function RockWall({ x, z, rotY, scaleX, height }: {
  x: number; z: number; rotY: number; scaleX: number; height: number;
}) {
  const mat = getPlatformStoneMat();
  return (
    <group position={[x, height / 2 - 1, z]} rotation={[0, rotY, 0]}>
      <RigidBody type="fixed">
        <CuboidCollider args={[scaleX * 3, height / 2, 0.8]} />
      </RigidBody>
      <mesh castShadow receiveShadow material={mat}>
        <boxGeometry args={[scaleX * 6, height, 1.6]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} receiveShadow material={mat}>
        <boxGeometry args={[scaleX * 6, height, 0.4]} />
      </mesh>
    </group>
  );
}

/* ── Realistic mountain (Entre Abismos style: cone peak clusters) ── */
interface Peak {
  x: number; y: number; z: number;
  r: number; h: number;
  rotX: number; rotZ: number; yaw: number;
  segments: number;
}

function buildPeaks(seed: number, baseY: number, baseR: number, totalH: number): Peak[] {
  const list: Peak[] = [];

  list.push({
    x: 0, y: baseY + totalH / 2, z: 0,
    r: baseR * 0.7, h: totalH, rotX: 0, rotZ: 0, yaw: 0,
    segments: 5 + Math.floor(sr(seed) * 3),
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
    });
  }

  list.forEach((p, i) => {
    p.yaw = sr(seed + i * 3 + 500) * Math.PI * 2;
  });
  return list;
}

function PeakCluster({ seed, baseY, baseR, totalH }: {
  seed: number; baseY: number; baseR: number; totalH: number;
}) {
  const peaks = useMemo(() => buildPeaks(seed, baseY, baseR, totalH), [seed, baseY, baseR, totalH]);
  const mat = getMountainStoneMat();
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh
          key={`p-${i}`}
          position={[p.x, p.y, p.z]}
          rotation={[p.rotX, p.yaw, p.rotZ]}
          castShadow
          receiveShadow
          material={mat}
        >
          <coneGeometry args={[p.r, p.h, p.segments]} />
        </mesh>
      ))}
    </group>
  );
}

function LavaMountain({ x, z, rotY = 0, scale = 1, height = 45, seed = 0, glow = false }: {
  x: number; z: number; rotY?: number; scale?: number; height?: number; seed?: number; glow?: boolean;
}) {
  const mat = getMountainStoneMat();
  const r = 8.5 + sr(seed + 77) * 4.5;
  const sxz = scale * 1.2;
  const sy = scale;

  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      <group scale={[sxz, sy, sxz]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow material={mat}>
          <cylinderGeometry args={[r, r * 1.2, 6, 7 + Math.floor(sr(seed + 50) * 3)]} />
        </mesh>
        <PeakCluster seed={seed + 1} baseY={4} baseR={r} totalH={height} />
        <PeakCluster seed={seed + 100} baseY={2} baseR={r * 0.7} totalH={height * 0.55} />
      </group>
      {/* Soft lava bounce — unlit disc only (no extra point lights: keeps draw/light budget low) */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * sxz * 0.85, 16]} />
        <meshBasicMaterial color="#FF4400" transparent opacity={glow ? 0.28 : 0.16} />
      </mesh>
    </group>
  );
}

/* ── Rocks half-submerged in lava ── */
interface RockPlacement { x: number; z: number; type: number; scale: number; rotY: number; }

function getRockPlacements(): RockPlacement[] {
  const rand = seededRandom(42);
  const placements: RockPlacement[] = [];
  const count = 50;
  const minDist = 3.0;
  for (let i = 0; i < count; i++) {
    let x: number, z: number, valid: boolean;
    let attempts = 0;
    do {
      x = (rand() - 0.5) * (ARENA_HALF * 2 - 6);
      z = (rand() - 0.5) * (ARENA_HALF * 2 - 6);
      valid = true;
      if (Math.abs(x) < 3 && Math.abs(z) < 3) { valid = false; continue; }
      for (const p of placements) { const dx = p.x - x, dz = p.z - z; if (dx * dx + dz * dz < minDist * minDist) { valid = false; break; } }
      attempts++;
    } while (!valid && attempts < 50);
    if (valid) placements.push({ x, z, type: Math.floor(rand() * 5), scale: 0.4 + rand() * 0.8, rotY: rand() * Math.PI * 2 });
  }
  return placements;
}

/* Shared stone for half-submerged rocks — same family + lava bounce from below */
let sharedFloatingRockMat: THREE.ShaderMaterial | null = null;
function getFloatingRockMat(): THREE.ShaderMaterial {
  if (!sharedFloatingRockMat) {
    sharedFloatingRockMat = createProceduralStoneMaterial({
      scale: 1.4,
      brightness: 0.2,
      glowStrength: 0.75,
      glowHeight: 3.5,
      glowBaseY: LAVA_Y,
    });
  }
  return sharedFloatingRockMat;
}

function LavaRock({ x, z, type, scale, rotY }: RockPlacement) {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.3 + Math.random() * 0.5, []);
  const bobAmount = useMemo(() => 0.08 + Math.random() * 0.15, []);
  const stoneMat = getFloatingRockMat();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = LAVA_Y + Math.sin(clock.elapsedTime * speed + phase) * bobAmount;
    }
  });

  const geometry = useMemo(() => {
    const s = scale;
    switch (type) {
      case 0: return <icosahedronGeometry args={[s, 0]} />;
      case 1: return <octahedronGeometry args={[s, 0]} />;
      case 2: return <boxGeometry args={[s * 2, s * 0.6, s * 1.4]} />;
      case 3: return <coneGeometry args={[s * 0.6, s * 2.5, 5]} />;
      case 4: return <dodecahedronGeometry args={[s, 0]} />;
      default: return <icosahedronGeometry args={[s, 0]} />;
    }
  }, [type, scale]);

  return (
    <group ref={groupRef} position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      <mesh castShadow>{geometry}<primitive object={stoneMat} attach="material" /></mesh>
    </group>
  );
}

/* ── Background mountain ring — outside the walls only, low enough to keep the lava pit visible ── */
interface MountainPlacement {
  x: number; z: number; rotY: number; scale: number; height: number; seed: number;
}

function getMountainPlacements(): MountainPlacement[] {
  const rand = seededRandom(777);
  const list: MountainPlacement[] = [];

  // Must clear the wall ring (ARENA_HALF=20) plus mountain base radius.
  // With scale ~0.5 the base radius is ~8–11, so dist >= 36 keeps the inner edge past the wall.
  const inner = 22;
  for (let i = 0; i < inner; i++) {
    const angle = (i / inner) * Math.PI * 2 + (rand() - 0.5) * 0.2;
    const dist = 38 + rand() * 12;
    list.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      rotY: rand() * Math.PI * 2,
      scale: 0.42 + rand() * 0.22,
      height: 18 + rand() * 14,
      seed: 800 + i * 131,
    });
  }

  const mid = 16;
  for (let i = 0; i < mid; i++) {
    const angle = (i / mid) * Math.PI * 2 + 0.18 + (rand() - 0.5) * 0.22;
    const dist = 48 + rand() * 10;
    list.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      rotY: rand() * Math.PI * 2,
      scale: 0.48 + rand() * 0.28,
      height: 22 + rand() * 14,
      seed: 1500 + i * 151,
    });
  }

  const outer = 18;
  for (let i = 0; i < outer; i++) {
    const angle = (i / outer) * Math.PI * 2 + 0.35 + (rand() - 0.5) * 0.2;
    const dist = 54 + rand() * 16;
    list.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      rotY: rand() * Math.PI * 2,
      scale: 0.55 + rand() * 0.3,
      height: 28 + rand() * 16,
      seed: 2000 + i * 173,
    });
  }

  // Far skyline accents — well outside the arena
  const corners: [number, number][] = [
    [-58, -58], [58, -58], [-58, 58], [58, 58],
    [-66, 0], [66, 0], [0, -66], [0, 66],
    [-48, -70], [48, -70], [-48, 70], [48, 70],
    [-70, -40], [70, -40], [-70, 40], [70, 40],
    [-30, -72], [30, -72], [-30, 72], [30, 72],
  ];
  for (let i = 0; i < corners.length; i++) {
    list.push({
      x: corners[i][0] + (rand() - 0.5) * 6,
      z: corners[i][1] + (rand() - 0.5) * 6,
      rotY: rand() * Math.PI * 2,
      scale: 0.65 + rand() * 0.35,
      height: 32 + rand() * 18,
      seed: 3000 + i * 199,
    });
  }

  return list;
}

export function Arena({ children }: { children: React.ReactNode }) {
  const rocks = useMemo(() => getRockPlacements(), []);
  const mountains = useMemo(() => getMountainPlacements(), []);

  return (
    <group>
      <LavaSurface />

      {/* Perimeter walls — same stone texture as the central platform */}
      <RockWall x={0} z={-ARENA_HALF} rotY={0} scaleX={6.5} height={5} />
      <RockWall x={0} z={ARENA_HALF} rotY={Math.PI} scaleX={6.5} height={5} />
      <RockWall x={-ARENA_HALF} z={0} rotY={Math.PI / 2} scaleX={6.5} height={5} />
      <RockWall x={ARENA_HALF} z={0} rotY={-Math.PI / 2} scaleX={6.5} height={5} />
      {/* Corner walls — fill the diagonal gaps */}
      <RockWall x={-15} z={-17} rotY={Math.PI / 4} scaleX={2} height={4} />
      <RockWall x={15} z={-17} rotY={-Math.PI / 4} scaleX={2} height={4} />
      <RockWall x={-15} z={17} rotY={Math.PI * 3 / 4} scaleX={2} height={4} />
      <RockWall x={15} z={17} rotY={-Math.PI * 3 / 4} scaleX={2} height={4} />
      <RockWall x={-18} z={-14} rotY={Math.PI / 3} scaleX={1.5} height={3.5} />
      <RockWall x={18} z={-14} rotY={-Math.PI / 3} scaleX={1.5} height={3.5} />
      <RockWall x={-18} z={14} rotY={Math.PI * 2 / 3} scaleX={1.5} height={3.5} />
      <RockWall x={18} z={14} rotY={-Math.PI * 2 / 3} scaleX={1.5} height={3.5} />

      {/* Realistic background mountains — cone peaks like Entre Abismos */}
      {mountains.map((m, i) => (
        <LavaMountain
          key={`mt-${i}`}
          x={m.x}
          z={m.z}
          rotY={m.rotY}
          scale={m.scale}
          height={m.height}
          seed={m.seed}
          glow={i < 22}
        />
      ))}

      {/* Decorative rocks — half submerged in lava */}
      {rocks.map((r, i) => <LavaRock key={i} {...r} />)}

      {children}
    </group>
  );
}

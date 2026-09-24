'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getGlassTexture } from '@/games/entre-abismos/world/RockTextures';

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ═══════════ DIAMOND DATA ═══════════ */
const ARENA_BOUND = 17;
/* Mountain ring — matches Arena placements (outer edge ~38–70) */
const MOUNTAIN_MIN = 36;
const MOUNTAIN_MAX = 70;

interface DiamondData {
  baseX: number; baseY: number; baseZ: number;
  scale: number;
  rotX: number; rotY: number; rotZ: number;
  bobSpeed: number; bobPhase: number; bobAmp: number;
  driftSpeed: number;
  isMountain: boolean;
}

function generateDiamonds(): DiamondData[] {
  const items: DiamondData[] = [];

  /* arena diamonds */
  for (let i = 0; i < 28; i++) {
    const seed = i * 47 + 13;
    items.push({
      baseX: (sr(seed * 7) - 0.5) * ARENA_BOUND * 2,
      baseY: 3 + sr(seed * 11) * 18,
      baseZ: (sr(seed * 13) - 0.5) * ARENA_BOUND * 2,
      scale: 0.15 + sr(seed * 17) * 0.35,
      rotX: sr(seed * 29) * Math.PI * 2,
      rotY: sr(seed * 31) * Math.PI * 2,
      rotZ: sr(seed * 37) * Math.PI * 2,
      bobSpeed: 0.2 + sr(seed * 41) * 0.4,
      bobPhase: sr(seed * 43) * Math.PI * 2,
      bobAmp: 0.3 + sr(seed * 47) * 0.8,
      driftSpeed: 0.05 + sr(seed * 53) * 0.15,
      isMountain: false,
    });
  }

  /* diamonds scattered among the background mountains */
  for (let i = 0; i < 90; i++) {
    const seed = i * 67 + 500;
    const angle = sr(seed * 11) * Math.PI * 2;
    const dist = MOUNTAIN_MIN + sr(seed * 13) * (MOUNTAIN_MAX - MOUNTAIN_MIN);
    /* higher float near far peaks, lower near the wall gap */
    const elev = (dist - MOUNTAIN_MIN) / (MOUNTAIN_MAX - MOUNTAIN_MIN);
    items.push({
      baseX: Math.cos(angle) * dist,
      baseY: 2 + elev * 8 + sr(seed * 17) * 14,
      baseZ: Math.sin(angle) * dist,
      scale: 0.14 + sr(seed * 19) * 0.4,
      rotX: sr(seed * 23) * Math.PI * 2,
      rotY: sr(seed * 29) * Math.PI * 2,
      rotZ: sr(seed * 37) * Math.PI * 2,
      bobSpeed: 0.12 + sr(seed * 37) * 0.28,
      bobPhase: sr(seed * 41) * Math.PI * 2,
      bobAmp: 0.25 + sr(seed * 43) * 0.7,
      driftSpeed: 0.03 + sr(seed * 47) * 0.12,
      isMountain: true,
    });
  }

  /* denser cluster in the mid band between wall and mountains */
  for (let i = 0; i < 36; i++) {
    const seed = i * 91 + 9000;
    const angle = sr(seed * 7) * Math.PI * 2;
    const dist = 24 + sr(seed * 13) * 14;
    items.push({
      baseX: Math.cos(angle) * dist,
      baseY: 4 + sr(seed * 17) * 16,
      baseZ: Math.sin(angle) * dist,
      scale: 0.12 + sr(seed * 19) * 0.32,
      rotX: sr(seed * 23) * Math.PI * 2,
      rotY: sr(seed * 29) * Math.PI * 2,
      rotZ: sr(seed * 31) * Math.PI * 2,
      bobSpeed: 0.14 + sr(seed * 41) * 0.3,
      bobPhase: sr(seed * 43) * Math.PI * 2,
      bobAmp: 0.2 + sr(seed * 47) * 0.55,
      driftSpeed: 0.04 + sr(seed * 53) * 0.1,
      isMountain: true,
    });
  }

  return items;
}

/* Shared red crystal material — glassy + emissive */
let redCrystalMat: THREE.MeshStandardMaterial | null = null;
function getRedCrystalMat(): THREE.MeshStandardMaterial {
  if (!redCrystalMat) {
    const map = typeof document !== 'undefined' ? getGlassTexture() : null;
    redCrystalMat = new THREE.MeshStandardMaterial({
      color: '#ff2a2a',
      emissive: '#c40000',
      emissiveIntensity: 2.2,
      roughness: 0.12,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
      map: map || undefined,
      side: THREE.FrontSide,
    });
  }
  return redCrystalMat;
}

let redCrystalSoftMat: THREE.MeshStandardMaterial | null = null;
function getRedCrystalSoftMat(): THREE.MeshStandardMaterial {
  if (!redCrystalSoftMat) {
    const map = typeof document !== 'undefined' ? getGlassTexture() : null;
    redCrystalSoftMat = new THREE.MeshStandardMaterial({
      color: '#ff5555',
      emissive: '#990000',
      emissiveIntensity: 1.6,
      roughness: 0.18,
      metalness: 0.25,
      transparent: true,
      opacity: 0.75,
      map: map || undefined,
      side: THREE.FrontSide,
    });
  }
  return redCrystalSoftMat;
}

/* ═══════════ SINGLE DIAMOND ═══════════ */
function LavaDiamond({ data, soft }: { data: DiamondData; soft: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const mat = soft ? getRedCrystalSoftMat() : getRedCrystalMat();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = data.baseY + Math.sin(t * data.bobSpeed + data.bobPhase) * data.bobAmp;
    ref.current.rotation.y = data.rotY + t * data.driftSpeed;
    ref.current.rotation.x = data.rotX + Math.sin(t * data.bobSpeed * 0.5 + data.bobPhase) * 0.1;
  });

  return (
    <group
      ref={ref}
      position={[data.baseX, data.baseY, data.baseZ]}
      rotation={[data.rotX, data.rotY, data.rotZ]}
      scale={[data.scale, data.scale * 1.3, data.scale]}
    >
      <mesh castShadow material={mat}>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
    </group>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */
export function FloatingDiamonds() {
  const allDiamonds = useMemo(() => generateDiamonds(), []);

  return (
    <group>
      {allDiamonds.map((d, i) => (
        <LavaDiamond key={i} data={d} soft={i % 3 === 0} />
      ))}
    </group>
  );
}

'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createDarkStoneTexture } from './DarkStoneTexture';

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ═══════════ SHARED TEXTURE ═══════════ */
let _sharedTex: THREE.CanvasTexture | null = null;
function getSharedTex() {
  if (!_sharedTex) _sharedTex = createDarkStoneTexture(512);
  return _sharedTex;
}

/* ═══════════ DIAMOND DATA ═══════════ */
const ARENA_BOUND = 17;
const MOUNTAIN_MIN = 25;
const MOUNTAIN_MAX = 44;

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
  for (let i = 0; i < 25; i++) {
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

  /* mountain diamonds */
  for (let i = 0; i < 45; i++) {
    const seed = i * 67 + 500;
    const angle = sr(seed * 11) * Math.PI * 2;
    const dist = MOUNTAIN_MIN + sr(seed * 13) * (MOUNTAIN_MAX - MOUNTAIN_MIN);
    items.push({
      baseX: Math.cos(angle) * dist,
      baseY: 2 + sr(seed * 17) * 12,
      baseZ: Math.sin(angle) * dist,
      scale: 0.12 + sr(seed * 19) * 0.3,
      rotX: sr(seed * 23) * Math.PI * 2,
      rotY: sr(seed * 29) * Math.PI * 2,
      rotZ: sr(seed * 31) * Math.PI * 2,
      bobSpeed: 0.15 + sr(seed * 37) * 0.3,
      bobPhase: sr(seed * 41) * Math.PI * 2,
      bobAmp: 0.2 + sr(seed * 43) * 0.6,
      driftSpeed: 0.03 + sr(seed * 47) * 0.1,
      isMountain: true,
    });
  }

  return items;
}

/* ═══════════ SINGLE DIAMOND ═══════════ */
function LavaDiamond({ data }: { data: DiamondData }) {
  const ref = useRef<THREE.Group>(null);

  const rockMat = useMemo(() => {
    const t = getSharedTex().clone();
    t.repeat.set(1.5, 1.5);
    return new THREE.MeshStandardMaterial({
      map: t,
      roughness: 0.82,
      metalness: 0.04,
      emissive: new THREE.Color('#FF5500'),
      emissiveIntensity: data.isMountain ? 0.06 : 0.1,
    });
  }, [data.isMountain]);

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FF6600'),
    transparent: true,
    opacity: data.isMountain ? 0.08 : 0.12,
    side: THREE.BackSide,
    depthWrite: false,
  }), [data.isMountain]);

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
      <mesh castShadow>
        <octahedronGeometry args={[1, 0]} />
        <primitive object={rockMat} attach="material" />
      </mesh>
      <mesh scale={[1.25, 1.25, 1.25]}>
        <octahedronGeometry args={[1, 0]} />
        <primitive object={glowMat} attach="material" />
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
        <LavaDiamond key={i} data={d} />
      ))}
    </group>
  );
}

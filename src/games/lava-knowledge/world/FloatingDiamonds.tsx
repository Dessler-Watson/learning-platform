'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function noise2D(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = sr(ix + iy * 157), b = sr(ix + 1 + iy * 157);
  const c = sr(ix + (iy + 1) * 157), d = sr(ix + 1 + (iy + 1) * 157);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

function fbm(x: number, y: number, oct = 5) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2D(x * f, y * f); f *= 2.05; a *= 0.48; }
  return v;
}

/* ═══════════ DARK ROCK TEXTURE ═══════════ */
function createDarkRockTexture(): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = x / S, ny = y / S;

      /* layered noise for rough stone surface */
      const n1 = fbm(nx * 10, ny * 10, 5);
      const n2 = fbm(nx * 22 + 3, ny * 22 + 3, 4);
      const n3 = fbm(nx * 45 + 7, ny * 45 + 7, 3);
      const n4 = fbm(nx * 8 + 12, ny * 8 + 12, 4);

      /* dark base — matching the reference: near-black with grey variation */
      let v = 28 + n1 * 18 + n2 * 12 + n3 * 6;

      /* wet/glossy patches — slightly lighter grey */
      const gloss = fbm(nx * 15 + 20, ny * 15 + 20, 4);
      if (gloss > 0.55) {
        v += (gloss - 0.55) * 40;
      }

      /* deep shadow crevices */
      const crevice = Math.abs(fbm(nx * 18 + 30, ny * 18 + 30, 5) - 0.5) * 2;
      if (crevice < 0.05) {
        v -= (0.05 - crevice) * 80;
      }

      /* angular facets — rough hewn stone */
      const facet = n4;
      if (facet > 0.62) v += (facet - 0.62) * 25;
      else if (facet < 0.38) v -= (0.38 - facet) * 20;

      /* very subtle warm tint in some areas */
      const warm = fbm(nx * 5 + 40, ny * 5 + 40, 3);
      const warmR = warm > 0.6 ? (warm - 0.6) * 10 : 0;

      /* grain */
      const grain = (sr(x * 0.31 + y * 0.27) - 0.5) * 5;
      v += grain;

      const cv = Math.max(0, Math.min(255, Math.round(v)));
      const idx = (y * S + x) * 4;
      d[idx]     = Math.min(255, cv + Math.round(warmR));
      d[idx + 1] = cv;
      d[idx + 2] = cv;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

let _darkRockTex: THREE.CanvasTexture | null = null;
function getDarkRockTex() { if (!_darkRockTex) _darkRockTex = createDarkRockTexture(); return _darkRockTex; }

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
  shade: number;
  isMountain: boolean;
}

function generateDiamonds(): DiamondData[] {
  const items: DiamondData[] = [];

  /* ── Arena diamonds — inside walls, scattered around ── */
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
      shade: 0.6 + sr(seed * 61) * 0.5,
      isMountain: false,
    });
  }

  /* ── Mountain diamonds — scattered around mounds at ±25-44 ── */
  for (let i = 0; i < 45; i++) {
    const seed = i * 67 + 500;
    const side = sr(seed * 3) > 0.5 ? 1 : -1;
    const side2 = sr(seed * 5) > 0.5 ? 1 : -1;
    /* pick a random position along the mountain ring */
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
      shade: 0.5 + sr(seed * 53) * 0.4,
      isMountain: true,
    });
  }

  return items;
}

/* ═══════════ SINGLE DIAMOND ═══════════ */
function LavaDiamond({ data }: { data: DiamondData }) {
  const ref = useRef<THREE.Group>(null);

  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: getDarkRockTex(),
    roughness: 0.78,
    metalness: 0.06,
    color: new THREE.Color(data.shade, data.shade * 0.95, data.shade * 0.93),
    emissive: new THREE.Color('#FF5500'),
    emissiveIntensity: data.isMountain ? 0.12 : 0.2,
  }), [data.shade, data.isMountain]);

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

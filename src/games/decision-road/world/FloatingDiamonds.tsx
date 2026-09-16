'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/stores/game.store';
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

function fbm(x: number, y: number, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2D(x * f, y * f); f *= 2.05; a *= 0.48; }
  return v;
}

/* ═══════════ ROCK TEXTURE ═══════════ */
function createRockTexture(): THREE.CanvasTexture {
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
      const n1 = fbm(nx * 8, ny * 8, 5);
      const n2 = fbm(nx * 16 + 4, ny * 16 + 4, 4);
      const n3 = fbm(nx * 32 + 9, ny * 32 + 9, 3);
      const n4 = fbm(nx * 6 + 15, ny * 6 + 15, 3);

      /* grey stone base */
      let v = 130 + (n1 - 0.5) * 35 + (n2 - 0.5) * 20 + (n3 - 0.5) * 10;

      /* rough rock surface – angular facets */
      const facet = n4;
      if (facet > 0.6) {
        v += (facet - 0.6) * 30;
      } else if (facet < 0.35) {
        v -= (0.35 - facet) * 25;
      }

      /* dark veins / cracks */
      const vein = Math.abs(fbm(nx * 12 + 20, ny * 12 + 20, 4) - 0.5) * 2;
      if (vein < 0.06) {
        v -= (0.06 - vein) * 100;
      }

      /* highlights on raised areas */
      const highlight = fbm(nx * 20 + 30, ny * 20 + 30, 3);
      if (highlight > 0.65) {
        v += (highlight - 0.65) * 40;
      }

      /* grain */
      const grain = (sr(x * 0.37 + y * 0.29) - 0.5) * 6;
      v += grain;

      const cv = Math.max(0, Math.min(255, Math.round(v)));
      const idx = (y * S + x) * 4;
      d[idx] = cv;
      d[idx + 1] = cv - 1;
      d[idx + 2] = cv - 2;
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

let _rockTex: THREE.CanvasTexture | null = null;
function getRockTex() { if (!_rockTex) _rockTex = createRockTexture(); return _rockTex; }

/* ═══════════ CHUNK GENERATION ═══════════ */
const CHUNK_SIZE = 80;
const EXTEND_CHUNKS = 3;
const DIAMONDS_PER_CHUNK = 18;

interface DiamondData {
  x: number; y: number; z: number;
  scaleX: number; scaleY: number; scaleZ: number;
  rotX: number; rotY: number; rotZ: number;
  speed: number; phase: number;
  shade: number;
}

function generateChunkDiamonds(chunkZ: number, chunkIndex: number): DiamondData[] {
  const items: DiamondData[] = [];
  for (let i = 0; i < DIAMONDS_PER_CHUNK; i++) {
    const seed = chunkIndex * 3000 + i;
    const side = sr(seed * 3) > 0.5 ? 1 : -1;
    items.push({
      x: side * (10 + sr(seed * 7) * 65),
      y: 2 + sr(seed * 11) * 18,
      z: chunkZ - sr(seed * 13) * CHUNK_SIZE,
      scaleX: 0.3 + sr(seed * 17) * 1.5,
      scaleY: 0.5 + sr(seed * 19) * 2.0,
      scaleZ: 0.3 + sr(seed * 23) * 1.5,
      rotX: sr(seed * 29) * Math.PI * 2,
      rotY: sr(seed * 31) * Math.PI * 2,
      rotZ: sr(seed * 37) * Math.PI * 2,
      speed: 0.1 + sr(seed * 41) * 0.3,
      phase: sr(seed * 43) * Math.PI * 2,
      shade: 0.75 + sr(seed * 47) * 0.5,
    });
  }
  return items;
}

/* ═══════════ SINGLE DIAMOND ═══════════ */
function Diamond({ data, mat }: { data: DiamondData; mat: THREE.MeshStandardMaterial }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = data.y + Math.sin(t * data.speed + data.phase) * 0.6;
    ref.current.rotation.y = data.rotY + t * data.speed * 0.3;
    ref.current.rotation.x = data.rotX + Math.sin(t * data.speed * 0.7 + data.phase) * 0.15;
  });

  return (
    <group
      ref={ref}
      position={[data.x, data.y, data.z]}
      rotation={[data.rotX, data.rotY, data.rotZ]}
      scale={[data.scaleX, data.scaleY, data.scaleZ]}
    >
      <mesh castShadow>
        <octahedronGeometry args={[1, 0]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */
export function FloatingDiamonds() {
  const questions = useGameStore((s) => s.questions);
  const START_Z = 12;
  const SPACING = 25;

  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: getRockTex(),
    roughness: 0.88,
    metalness: 0.05,
    color: new THREE.Color('#a8a8a8'),
  }), []);

  const allDiamonds = useMemo(() => {
    const totalZ = questions.length > 0
      ? START_Z - (questions.length - 1) * SPACING
      : START_Z;
    const frontZ = START_Z + EXTEND_CHUNKS * CHUNK_SIZE;
    const backZ = totalZ - EXTEND_CHUNKS * CHUNK_SIZE;

    const diamonds: DiamondData[] = [];
    for (let z = frontZ; z >= backZ; z -= CHUNK_SIZE) {
      const chunkIdx = Math.floor((frontZ - z) / CHUNK_SIZE);
      diamonds.push(...generateChunkDiamonds(z, chunkIdx));
    }
    return diamonds;
  }, [questions.length]);

  return (
    <group>
      {allDiamonds.map((d, i) => (
        <Diamond key={i} data={d} mat={rockMat} />
      ))}
    </group>
  );
}

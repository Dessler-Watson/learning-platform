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

/* ═══════════ GRASS TEXTURE ═══════════ */
function createGrassTexture(): THREE.CanvasTexture {
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
      const n1 = fbm(nx * 12, ny * 12, 5);
      const n2 = fbm(nx * 24 + 3, ny * 24 + 3, 4);
      const n3 = fbm(nx * 48 + 7, ny * 48 + 7, 3);

      /* base green with variation */
      let r = 42 + n1 * 30 + n2 * 12;
      let g = 110 + n1 * 45 + n2 * 18 + n3 * 8;
      let b = 28 + n1 * 15 + n2 * 8;

      /* grass blade highlights – vertical streaks */
      const blade = noise2D(x * 0.08, y * 0.4);
      if (blade > 0.55) {
        const s = (blade - 0.55) * 5;
        g += s * 25;
        r += s * 8;
      }

      /* darker patches */
      const dark = fbm(nx * 6 + 10, ny * 6 + 10, 3);
      if (dark < 0.3) {
        const s = (0.3 - dark) * 3;
        r -= s * 15;
        g -= s * 30;
        b -= s * 10;
      }

      /* fine grain */
      const grain = (sr(x * 0.31 + y * 0.27) - 0.5) * 6;
      r += grain; g += grain * 0.8; b += grain * 0.5;

      const idx = (y * S + x) * 4;
      d[idx]     = Math.max(0, Math.min(255, Math.round(r)));
      d[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  return tex;
}

/* ═══════════ DIRT TEXTURE ═══════════ */
function createDirtTexture(): THREE.CanvasTexture {
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
      const n1 = fbm(nx * 10, ny * 10, 5);
      const n2 = fbm(nx * 20 + 5, ny * 20 + 5, 4);
      const n3 = fbm(nx * 40 + 10, ny * 40 + 10, 3);

      /* brown earth base */
      let r = 105 + n1 * 30 + n2 * 15 + n3 * 8;
      let g = 85 + n1 * 22 + n2 * 12 + n3 * 5;
      let b = 65 + n1 * 15 + n2 * 8 + n3 * 4;

      /* pebble highlights */
      const pebble = fbm(nx * 30 + 20, ny * 30 + 20, 3);
      if (pebble > 0.6) {
        const s = (pebble - 0.6) * 2.5;
        r += s * 20;
        g += s * 18;
        b += s * 12;
      }

      /* darker cracks / crevices */
      const crack = Math.abs(fbm(nx * 15 + 15, ny * 15 + 15, 4) - 0.5) * 2;
      if (crack < 0.08) {
        const s = (0.08 - crack) * 12;
        r -= s * 25;
        g -= s * 22;
        b -= s * 18;
      }

      /* fine grain */
      const grain = (sr(x * 0.43 + y * 0.37) - 0.5) * 8;
      r += grain; g += grain * 0.85; b += grain * 0.7;

      const idx = (y * S + x) * 4;
      d[idx]     = Math.max(0, Math.min(255, Math.round(r)));
      d[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  return tex;
}

/* ═══════════ BARK TEXTURE ═══════════ */
function createBarkTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = x / S, ny = y / S;

      /* vertical grain lines */
      const grain1 = fbm(nx * 3, ny * 18, 5);
      const grain2 = fbm(nx * 6 + 5, ny * 30 + 5, 4);
      const n3 = fbm(nx * 12 + 10, ny * 12 + 10, 3);

      /* dark oak bark base */
      let r = 62 + grain1 * 18 + grain2 * 10;
      let g = 42 + grain1 * 12 + grain2 * 8;
      let b = 28 + grain1 * 8 + grain2 * 5;

      /* vertical streak highlights */
      const streak = noise2D(nx * 4, ny * 40);
      if (streak > 0.55) {
        const s = (streak - 0.55) * 4;
        r += s * 15;
        g += s * 10;
        b += s * 6;
      }

      /* deep grooves */
      const groove = Math.abs(fbm(nx * 2 + 8, ny * 25 + 8, 4) - 0.5) * 2;
      if (groove < 0.1) {
        const s = (0.1 - groove) * 10;
        r -= s * 20;
        g -= s * 15;
        b -= s * 10;
      }

      /* surface roughness */
      const rough = n3 * 8;
      r += rough - 4; g += rough - 4; b += rough - 3;

      const idx = (y * S + x) * 4;
      d[idx]     = Math.max(0, Math.min(255, Math.round(r)));
      d[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
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

/* ═══════════ SHARED TEXTURES (created once) ═══════════ */
let _grassTex: THREE.CanvasTexture | null = null;
let _dirtTex: THREE.CanvasTexture | null = null;
let _barkTex: THREE.CanvasTexture | null = null;

function getGrassTex() { if (!_grassTex) _grassTex = createGrassTexture(); return _grassTex; }
function getDirtTex() { if (!_dirtTex) _dirtTex = createDirtTexture(); return _dirtTex; }
function getBarkTex() { if (!_barkTex) _barkTex = createBarkTexture(); return _barkTex; }

/* ═══════════ MATERIALS ═══════════ */
function useGrassMat(color?: string) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    map: getGrassTex(), roughness: 0.88, metalness: 0.01,
    color: color || '#5a9a3a',
  }), [color]);
}

function useDirtMat(color?: string) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    map: getDirtTex(), roughness: 0.92, metalness: 0.01,
    color: color || '#8a7a62',
  }), [color]);
}

function useBarkMat() {
  return useMemo(() => new THREE.MeshStandardMaterial({
    map: getBarkTex(), roughness: 0.9, metalness: 0.01,
    color: new THREE.Color('#5D4037'),
  }), []);
}

/* ═══════════ ISLAND GEOMETRY ═══════════ */
const CHUNK_SIZE = 80;
const EXTEND_CHUNKS = 3;
const ISLANDS_PER_CHUNK = 12;
const MOUNTAINS_PER_CHUNK = 12;

interface IslandData {
  x: number; y: number; z: number;
  scale: number; rotation: number;
  type: number;
  bobSpeed: number; bobPhase: number; bobAmp: number;
  tiltSpeed: number; tiltPhase: number;
}

interface MountainData {
  x: number; z: number; h: number; r: number; color: string;
}

function generateChunkIslands(chunkZ: number, chunkIndex: number): IslandData[] {
  const items: IslandData[] = [];
  for (let i = 0; i < ISLANDS_PER_CHUNK; i++) {
    const seed = chunkIndex * 1000 + i;
    const side = sr(seed * 3) > 0.5 ? 1 : -1;
    items.push({
      x: side * (20 + sr(seed * 7) * 55),
      y: -1 - sr(seed * 11) * 6,
      z: chunkZ - sr(seed * 13) * CHUNK_SIZE,
      scale: 0.7 + sr(seed * 17) * 0.9,
      rotation: sr(seed * 19) * Math.PI * 2,
      type: Math.floor(sr(seed * 23) * 5),
      bobSpeed: 0.15 + sr(seed * 51) * 0.35,
      bobPhase: sr(seed * 53) * Math.PI * 2,
      bobAmp: 0.3 + sr(seed * 57) * 0.8,
      tiltSpeed: 0.08 + sr(seed * 59) * 0.2,
      tiltPhase: sr(seed * 61) * Math.PI * 2,
    });
  }
  return items;
}

function generateChunkMountains(chunkZ: number, chunkIndex: number): MountainData[] {
  const items: MountainData[] = [];
  const colors1 = ['#4DD0E1', '#26C6DA', '#80DEEA', '#00BCD4', '#0097A7'];
  const colors2 = ['#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#E0F7FA'];
  const colors3 = ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'];

  for (let i = 0; i < MOUNTAINS_PER_CHUNK; i++) {
    const seed = chunkIndex * 2000 + i;
    const layer = i % 3;
    const palette = layer === 0 ? colors1 : layer === 1 ? colors2 : colors3;
    const hBase = layer === 0 ? 30 : layer === 1 ? 20 : 15;
    const rBase = layer === 0 ? 22 : layer === 1 ? 16 : 10;
    items.push({
      x: -130 + sr(seed * 3 + 100) * 260,
      z: chunkZ - sr(seed * 7 + 100) * CHUNK_SIZE,
      h: hBase + sr(seed * 11 + 100) * 25,
      r: rBase + sr(seed * 13 + 100) * 20,
      color: palette[Math.floor(sr(seed * 17 + 100) * 5)],
    });
  }
  return items;
}

/* ═══════════ BUSH ═══════════ */
function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const grassMat = useGrassMat('#3a8030');
  const grassMat2 = useGrassMat('#2d6a24');
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <primitive object={grassMat} attach="material" />
      </mesh>
      <mesh position={[0.35, 0.2, 0.2]}>
        <sphereGeometry args={[0.35, 5, 4]} />
        <primitive object={grassMat2} attach="material" />
      </mesh>
    </group>
  );
}

/* ═══════════ ISLAND CLASSIC ═══════════ */
function IslandClassic({ scale }: { scale: number }) {
  const grass = useGrassMat();
  const dirt = useDirtMat();
  const bark = useBarkMat();
  const leaf1 = useGrassMat('#2E7D32');
  const leaf2 = useGrassMat('#388E3C');
  return (
    <group scale={scale}>
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[5.5, 2, 4.5, 8]} />
        <primitive object={dirt} attach="material" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[5.8, 5.5, 0.7, 8]} />
        <primitive object={grass} attach="material" />
      </mesh>
      <mesh position={[0.5, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 2, 6]} />
        <primitive object={bark} attach="material" />
      </mesh>
      <mesh position={[0.5, 3.2, 0]}>
        <coneGeometry args={[1.1, 1.8, 6]} />
        <primitive object={leaf1} attach="material" />
      </mesh>
      <mesh position={[0.5, 4.2, 0]}>
        <coneGeometry args={[0.7, 1.3, 6]} />
        <primitive object={leaf2} attach="material" />
      </mesh>
      <Bush position={[-2.5, 0.7, 1]} scale={1.1} />
      <Bush position={[2, 0.7, -0.8]} scale={0.8} />
    </group>
  );
}

/* ═══════════ ISLAND ELONGATED ═══════════ */
function IslandElongated({ scale }: { scale: number }) {
  const grass = useGrassMat('#66bb6a');
  const dirt = useDirtMat('#7a6a52');
  const bark = useBarkMat();
  const leaf1 = useGrassMat('#1B5E20');
  const leaf2 = useGrassMat('#388E3C');
  return (
    <group scale={scale}>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[7, 3, 4, 6]} />
        <primitive object={dirt} attach="material" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[7.3, 7, 0.6, 6]} />
        <primitive object={grass} attach="material" />
      </mesh>
      <mesh position={[-1.5, 1.3, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1.6, 6]} />
        <primitive object={bark} attach="material" />
      </mesh>
      <mesh position={[-1.5, 2.7, 0]}>
        <coneGeometry args={[0.9, 1.4, 6]} />
        <primitive object={leaf1} attach="material" />
      </mesh>
      <mesh position={[1.8, 1.1, 0.5]}>
        <cylinderGeometry args={[0.12, 0.2, 1.2, 6]} />
        <primitive object={bark} attach="material" />
      </mesh>
      <mesh position={[1.8, 2.1, 0.5]}>
        <coneGeometry args={[0.7, 1.1, 6]} />
        <primitive object={leaf2} attach="material" />
      </mesh>
      <Bush position={[-3.5, 0.7, 0.5]} scale={1.2} />
      <Bush position={[0, 0.7, -2]} scale={0.9} />
      <Bush position={[3.5, 0.7, -0.3]} scale={1} />
    </group>
  );
}

/* ═══════════ ISLAND TALL ═══════════ */
function IslandTall({ scale }: { scale: number }) {
  const grass = useGrassMat('#81C784');
  const dirt = useDirtMat('#6a5a42');
  const bark = useBarkMat();
  const leaf1 = useGrassMat('#2E7D32');
  const leaf2 = useGrassMat('#388E3C');
  return (
    <group scale={scale}>
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[4, 1.5, 6, 7]} />
        <primitive object={dirt} attach="material" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[4.2, 4, 0.5, 7]} />
        <primitive object={grass} attach="material" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.32, 1.4, 6]} />
        <primitive object={bark} attach="material" />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[2.5, 3, 5]} />
        <primitive object={leaf1} attach="material" />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <coneGeometry args={[1.5, 2, 5]} />
        <primitive object={leaf2} attach="material" />
      </mesh>
      <Bush position={[-2, 0.7, 1.5]} scale={1.3} />
      <Bush position={[1.5, 0.7, -1.5]} scale={1} />
    </group>
  );
}

/* ═══════════ ISLAND WIDE ═══════════ */
function IslandWide({ scale }: { scale: number }) {
  const grass = useGrassMat('#43a047');
  const dirt = useDirtMat('#80705a');
  const bush1 = useGrassMat('#388E3C');
  const bush2 = useGrassMat('#2E7D32');
  const bush3 = useGrassMat('#43A047');
  return (
    <group scale={scale}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[8, 4, 3.5, 8]} />
        <primitive object={dirt} attach="material" />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[8.3, 8, 0.5, 8]} />
        <primitive object={grass} attach="material" />
      </mesh>
      <mesh position={[-2, 1.2, 0]}>
        <sphereGeometry args={[0.8, 6, 5]} />
        <primitive object={bush1} attach="material" />
      </mesh>
      <mesh position={[2.5, 1.0, 1]}>
        <sphereGeometry args={[0.6, 6, 5]} />
        <primitive object={bush2} attach="material" />
      </mesh>
      <mesh position={[0, 1.1, -1.5]}>
        <sphereGeometry args={[0.7, 6, 5]} />
        <primitive object={bush3} attach="material" />
      </mesh>
      <Bush position={[-4.5, 0.7, 0.5]} scale={1.4} />
      <Bush position={[4, 0.7, -0.5]} scale={1.1} />
      <Bush position={[0.5, 0.7, 2.5]} scale={1} />
      <Bush position={[-1, 0.7, -3]} scale={0.9} />
    </group>
  );
}

/* ═══════════ ISLAND SMALL ═══════════ */
function IslandSmall({ scale }: { scale: number }) {
  const grass = useGrassMat();
  const dirt = useDirtMat('#7a6a50');
  const bark = useBarkMat();
  const leaf = useGrassMat('#2E7D32');
  return (
    <group scale={scale}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[3, 0.8, 3, 7]} />
        <primitive object={dirt} attach="material" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[3.3, 3, 0.5, 7]} />
        <primitive object={grass} attach="material" />
      </mesh>
      <mesh position={[0.2, 1.0, 0.1]}>
        <cylinderGeometry args={[0.12, 0.22, 1.2, 6]} />
        <primitive object={bark} attach="material" />
      </mesh>
      <mesh position={[0.2, 2.2, 0.1]}>
        <coneGeometry args={[0.7, 1.2, 6]} />
        <primitive object={leaf} attach="material" />
      </mesh>
      <Bush position={[-1.2, 0.6, 0.8]} scale={0.7} />
      <Bush position={[1, 0.6, -0.8]} scale={0.6} />
    </group>
  );
}

const ISLAND_COMPONENTS = [IslandClassic, IslandElongated, IslandTall, IslandWide, IslandSmall];

function FloatingIsland({ island }: { island: IslandData }) {
  const ref = useRef<THREE.Group>(null);
  const baseY = useRef(island.y);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = baseY.current + Math.sin(t * island.bobSpeed + island.bobPhase) * island.bobAmp;
    ref.current.rotation.z = Math.sin(t * island.tiltSpeed + island.tiltPhase) * 0.04;
  });

  const Component = ISLAND_COMPONENTS[island.type];
  return (
    <group
      ref={ref}
      position={[island.x, island.y, island.z]}
      rotation={[0, island.rotation, 0]}
    >
      <Component scale={island.scale} />
    </group>
  );
}

function MountainChunk({ mountains }: { mountains: MountainData[] }) {
  return (
    <group>
      {mountains.map((m, i) => (
        <group key={i} position={[m.x, -42, m.z]}>
          <mesh>
            <coneGeometry args={[m.r, m.h, 5]} />
            <meshStandardMaterial color={m.color} roughness={0.85} transparent opacity={0.5} />
          </mesh>
          <mesh position={[m.r * 0.3, m.h * 0.12, m.r * 0.2]}>
            <coneGeometry args={[m.r * 0.5, m.h * 0.55, 5]} />
            <meshStandardMaterial color="#B2EBF2" roughness={0.85} transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function FloatingIslands() {
  const questions = useGameStore((s) => s.questions);
  const START_Z = 12;
  const SPACING = 25;

  const { allIslands, allMountains, fogCenterZ, frontZ, backZ } = useMemo(() => {
    const totalZ = questions.length > 0
      ? START_Z - (questions.length - 1) * SPACING
      : START_Z;
    const frontZ = START_Z + EXTEND_CHUNKS * CHUNK_SIZE;
    const backZ = totalZ - EXTEND_CHUNKS * CHUNK_SIZE;
    const fogCenter = (frontZ + backZ) / 2;

    const islands: IslandData[] = [];
    const mountains: MountainData[] = [];

    for (let z = frontZ; z >= backZ; z -= CHUNK_SIZE) {
      const chunkIdx = Math.floor((frontZ - z) / CHUNK_SIZE);
      islands.push(...generateChunkIslands(z, chunkIdx));
      mountains.push(...generateChunkMountains(z, chunkIdx + 500));
    }

    return { allIslands: islands, allMountains: mountains, fogCenterZ: fogCenter, frontZ, backZ };
  }, [questions.length]);

  return (
    <group>
      {allIslands.map((island, i) => (
        <FloatingIsland key={i} island={island} />
      ))}
      <MountainChunk mountains={allMountains} />

      {(() => {
        const fogW = 800;
        const fogD = (frontZ - backZ) + 200;
        return (
          <>
            <mesh position={[0, -48, fogCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fogW, fogD]} />
              <meshBasicMaterial color="#B3E5FC" transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -44, fogCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fogW - 100, fogD - 100]} />
              <meshBasicMaterial color="#C8E6F5" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -40, fogCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fogW - 200, fogD - 200]} />
              <meshBasicMaterial color="#D4EEFB" transparent opacity={0.45} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      })()}

      <mesh position={[-250, -20, fogCenterZ]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[250, -20, fogCenterZ]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -20, frontZ + 40]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -20, backZ - 40]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

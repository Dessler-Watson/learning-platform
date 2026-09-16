'use client';
import { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

const WIDTH = 16;
const WALL_H = 6;
const Y = -0.1;
const EDGE_W = 0.4;

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

/* ═══════════ COBBLESTONE ═══════════ */
function createCobblestoneTexture(): THREE.CanvasTexture {
  const S = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  /* dark mortar base */
  ctx.fillStyle = '#3a342c';
  ctx.fillRect(0, 0, S, S);

  /* warm earth-tone palette */
  const pal: [number, number, number][] = [
    [185, 165, 135], [160, 140, 110], [200, 180, 150], [140, 125, 100],
    [190, 170, 135], [150, 132, 108], [175, 158, 128], [130, 118, 92],
    [210, 190, 155], [165, 148, 118], [145, 130, 105], [195, 178, 148],
    [120, 110, 85],  [180, 160, 125], [155, 140, 112], [170, 152, 122],
    [135, 122, 96],  [205, 185, 150], [148, 135, 110], [162, 145, 115],
  ];

  /* grid seeds – one per cell for tight Voronoi packing */
  const CS = 52;
  const cols = Math.ceil(S / CS);
  const rows = Math.ceil(S / CS);
  const seeds: { x: number; y: number; ci: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (sr(c * 3.1 + r * 7.3) - 0.5) * CS * 0.55;
      const jy = (sr(c * 11.7 + r * 13.9) - 0.5) * CS * 0.55;
      seeds.push({
        x: c * CS + CS * 0.5 + jx,
        y: r * CS + CS * 0.5 + jy,
        ci: Math.floor(sr(c * 17.1 + r * 23.7) * pal.length),
      });
    }
  }

  /* Voronoi: for each pixel find 2 nearest seeds */
  const imgData = ctx.createImageData(S, S);
  const px = imgData.data;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = y * S + x;
      let d1 = 1e9, d2 = 1e9, best = 0;
      const gc = Math.floor(x / CS), gr = Math.floor(y / CS);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = gr + dr, cc = gc + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          const si = rr * cols + cc;
          if (si >= seeds.length) continue;
          const s = seeds[si];
          const dx = x - s.x, dy = y - s.y;
          const d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; d1 = d; best = si; }
          else if (d < d2) { d2 = d; }
        }
      }

      const edge = d2 - d1;
      const [pr, pg, pb] = pal[seeds[best].ci];

      /* mortar / grout */
      const groutW = 4.5;
      if (edge < groutW) {
        const gNoise = fbm(x * 0.05, y * 0.05, 2);
        const gv = Math.floor(42 + gNoise * 20);
        const blend = edge / groutW;
        const r = Math.floor(gv * (0.8 + blend * 0.2));
        px[idx * 4] = r;
        px[idx * 4 + 1] = r - 2;
        px[idx * 4 + 2] = r - 5;
        px[idx * 4 + 3] = 255;
        continue;
      }

      /* stone interior with mineral texture */
      const sx2 = x * 0.006 + seeds[best].ci * 4.1;
      const sy2 = y * 0.006 + seeds[best].ci * 6.3;
      const n1 = fbm(sx2, sy2, 5);
      const n2 = fbm(sx2 * 2.5 + 7, sy2 * 2.5 + 7, 4);
      const n3 = fbm(sx2 * 5.3 + 13, sy2 * 5.3 + 13, 3);

      let r = pr + (n1 - 0.5) * 28;
      let g = pg + (n1 - 0.5) * 22;
      let b = pb + (n1 - 0.5) * 18;

      /* mineral veins */
      const vein = Math.abs(n2 - 0.5) * 2;
      if (vein < 0.12) {
        const s = 1 - vein / 0.12;
        r -= s * 22; g -= s * 20; b -= s * 16;
      }

      /* highlight patches */
      if (n3 > 0.58) {
        const s = (n3 - 0.58) * 2.4;
        r += s * 16; g += s * 14; b += s * 10;
      }

      /* edge bevel for 3D depth */
      const bevelW = 10;
      if (edge < groutW + bevelW) {
        const t = (edge - groutW) / bevelW;
        const s = seeds[best];
        const dx = x - s.x, dy = y - s.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const lightDot = (-dx / len * 0.5 + -dy / len * 0.6);
        const str = (1 - t) * 0.4;
        if (lightDot > 0) {
          r += lightDot * str * 38; g += lightDot * str * 32; b += lightDot * str * 26;
        } else {
          r += lightDot * str * 28; g += lightDot * str * 25; b += lightDot * str * 20;
        }
      }

      /* fine grain */
      const grain = (sr(x * 0.37 + y * 0.29 + seeds[best].ci * 100) - 0.5) * 7;
      r += grain; g += grain * 0.9; b += grain * 0.8;

      px[idx * 4]     = Math.max(0, Math.min(255, Math.round(r)));
      px[idx * 4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
      px[idx * 4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
      px[idx * 4 + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 80);
  tex.anisotropy = 8;
  return tex;
}

/* ═══════════ CONCRETE ═══════════ */
function createConcreteTexture(): THREE.CanvasTexture {
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
      const n2 = fbm(nx * 16 + 5, ny * 16 + 5, 4);
      const n3 = fbm(nx * 32 + 10, ny * 32 + 10, 3);
      const base = 138 + (n1 - 0.5) * 22 + (n2 - 0.5) * 12 + (n3 - 0.5) * 6;
      const grain = (sr(x * 0.41 + y * 0.33) - 0.5) * 8;
      const v = Math.max(0, Math.min(255, Math.round(base + grain)));
      d[(y * S + x) * 4] = v;
      d[(y * S + x) * 4 + 1] = v - 1;
      d[(y * S + x) * 4 + 2] = v - 3;
      d[(y * S + x) * 4 + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const drawCrack = (sx: number, sy: number, len: number, angle: number, seed: number, w: number) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    let cx = sx, cy = sy;
    for (let i = 0; i < len / 3; i++) {
      const a = angle + (sr(seed + i) - 0.5) * 0.8;
      const d = 2 + sr(seed + i + 50) * 4;
      cx += Math.cos(a) * d; cy += Math.sin(a) * d;
      ctx.lineTo(cx, cy);
      if (sr(seed + i + 100) > 0.65) {
        const ba = a + (sr(seed + i + 200) - 0.5) * 2.5;
        const bl = 3 + sr(seed + i + 300) * 15;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ba) * bl, cy + Math.sin(ba) * bl);
        ctx.moveTo(cx, cy);
      }
    }
    ctx.strokeStyle = `rgba(50,48,44,${0.3 + sr(seed) * 0.2})`;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.strokeStyle = `rgba(35,33,30,${0.15 + sr(seed + 1) * 0.1})`;
    ctx.lineWidth = w * 2.5;
    ctx.stroke();
  };

  for (let i = 0; i < 30; i++) {
    drawCrack(
      sr(i * 3.1) * S, sr(i * 7.3 + 50) * S,
      30 + sr(i * 11.7) * 100,
      sr(i * 13.9 + 200) * Math.PI * 2,
      i * 17.3, 0.6 + sr(i * 5.1) * 1.4
    );
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function Path({ length = 480, centerZ }: { length?: number; centerZ?: number }) {
  const cz = centerZ ?? (20 - length / 2);

  const cobbleTex = useMemo(() => createCobblestoneTexture(), []);
  const concTexL = useMemo(() => { const t = createConcreteTexture(); t.repeat.set(1, 8); return t; }, []);
  const concTexR = useMemo(() => { const t = createConcreteTexture(); t.repeat.set(1, 8); return t; }, []);
  const concTexB = useMemo(() => { const t = createConcreteTexture(); t.repeat.set(4, 80); return t; }, []);

  const topMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: cobbleTex, roughness: 0.72, metalness: 0.02,
    color: new THREE.Color('#d4c8b4'),
  }), [cobbleTex]);

  const wallL = useMemo(() => new THREE.MeshStandardMaterial({
    map: concTexL, roughness: 0.88, metalness: 0.02,
    color: new THREE.Color('#9a9da0'),
  }), [concTexL]);

  const wallR = useMemo(() => new THREE.MeshStandardMaterial({
    map: concTexR, roughness: 0.88, metalness: 0.02,
    color: new THREE.Color('#9a9da0'),
  }), [concTexR]);

  const btmMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: concTexB, roughness: 0.9, metalness: 0.01,
    color: new THREE.Color('#888a8d'),
  }), [concTexB]);

  return (
    <group>
      <RigidBody type="fixed" position={[0, Y, cz]} friction={0.8}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[WIDTH, 0.4, length]} />
          <primitive object={btmMat} attach="material" />
        </mesh>
      </RigidBody>

      <mesh receiveShadow position={[0, Y + 0.21, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WIDTH - 0.3, length - 0.3]} />
        <primitive object={topMat} attach="material" />
      </mesh>

      <mesh position={[-WIDTH / 2 + EDGE_W / 2, Y + 0.45, cz]} castShadow>
        <boxGeometry args={[EDGE_W, 0.55, length]} />
        <primitive object={wallL} attach="material" />
      </mesh>
      <mesh position={[WIDTH / 2 - EDGE_W / 2, Y + 0.45, cz]} castShadow>
        <boxGeometry args={[EDGE_W, 0.55, length]} />
        <primitive object={wallR} attach="material" />
      </mesh>

      <RigidBody type="fixed" position={[-WIDTH / 2 - 0.3, WALL_H / 2, cz]}>
        <CuboidCollider args={[0.3, WALL_H / 2, length / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[WIDTH / 2 + 0.3, WALL_H / 2, cz]}>
        <CuboidCollider args={[0.3, WALL_H / 2, length / 2]} />
      </RigidBody>
    </group>
  );
}

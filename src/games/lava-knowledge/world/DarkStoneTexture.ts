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

function fbm(x: number, y: number, oct = 6) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2D(x * f, y * f); f *= 2.05; a *= 0.48; }
  return v;
}

/**
 * Creates a very dark, near-black volcanic rock texture.
 * Output is grayscale 0-30 — essentially black with fine grain.
 * The material's `color` tint should be used to control final brightness.
 */
export function createDarkStoneTexture(size = 512): THREE.CanvasTexture {
  const S = size;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(S, S);
  const px = imgData.data;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = y * S + x;
      const gx = x * 0.035, gy = y * 0.035;

      // Start near-black
      let v = 6;

      // Multi-scale granular noise — small amplitude, stays dark
      v += (fbm(gx, gy, 5) - 0.5) * 5;          // ±2.5 broad
      v += (fbm(gx * 4 + 50, gy * 4 + 50, 4) - 0.5) * 3; // ±1.5 medium
      v += (fbm(gx * 10 + 100, gy * 10 + 100, 3) - 0.5) * 2; // ±1 fine

      // Sharp bright mineral speckles
      const speck = fbm(gx * 15 + 200, gy * 15 + 200, 2);
      if (speck > 0.7) v += (speck - 0.7) * 60;

      // Individual bright grains
      const grain = sr(x * 1.73 + y * 2.91);
      if (grain > 0.988) v += 18 + grain * 12;

      // Small dark pits
      const pit = fbm(gx * 7 + 300, gy * 7 + 300, 3);
      if (pit < 0.35) v -= (0.35 - pit) * 12;

      // Clamp: keep everything very dark (0-28)
      v = Math.max(2, Math.min(28, Math.round(v)));

      px[idx * 4]     = v;
      px[idx * 4 + 1] = v;
      px[idx * 4 + 2] = v;
      px[idx * 4 + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

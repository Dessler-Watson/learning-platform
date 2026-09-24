import * as THREE from 'three';

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

let _stoneTex: THREE.CanvasTexture | null = null;
let _stoneNormal: THREE.CanvasTexture | null = null;
let _stoneBump: THREE.CanvasTexture | null = null;

function drawStoneFieldstone(ctx: CanvasRenderingContext2D, size: number): void {
  const mortar = '#6e6a62';
  ctx.fillStyle = mortar;
  ctx.fillRect(0, 0, size, size);

  const rows = 7;
  const rowH = size / rows;
  for (let row = 0; row < rows + 1; row++) {
    const y = row * rowH;
    const offset = (row % 2) * (size * 0.07);
    let x = -size * 0.12 + offset;
    while (x < size + size * 0.1) {
      const w = size * (0.14 + sr(row * 17 + x) * 0.12);
      const h = rowH * (0.78 + sr(row * 31 + x * 7) * 0.18);
      const pad = size * 0.012;
      const cx = x + pad + sr(row * 13 + x * 3) * pad;
      const cy = y + pad + sr(row * 19 + x * 5) * pad;
      const bw = w - pad * 2;
      const bh = h - pad * 2;

      const base = 140 + Math.floor(sr(row * 41 + x * 11) * 70);
      const warm = Math.floor(sr(row * 7 + x * 23) * 25);
      const r = Math.min(255, base + warm);
      const g = Math.min(255, base + Math.floor(warm * 0.55));
      const b = Math.min(255, base - 10 + Math.floor(sr(row + x) * 20));

      const grad = ctx.createLinearGradient(cx, cy, cx + bw, cy + bh);
      grad.addColorStop(0, `rgb(${Math.min(255, r + 28)},${Math.min(255, g + 28)},${Math.min(255, b + 24)})`);
      grad.addColorStop(0.4, `rgb(${r},${g},${b})`);
      grad.addColorStop(1, `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 35)})`);

      ctx.beginPath();
      const radius = Math.min(bw, bh) * 0.28;
      const pts = 8;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const jx = cx + bw / 2 + Math.cos(a) * (bw / 2 - radius * 0.15) * (0.88 + sr(i * 3 + x + row) * 0.24);
        const jy = cy + bh / 2 + Math.sin(a) * (bh / 2 - radius * 0.15) * (0.88 + sr(i * 5 + x + row * 9) * 0.24);
        if (i === 0) ctx.moveTo(jx, jy);
        else ctx.lineTo(jx, jy);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = `rgba(50,48,44,0.55)`;
      ctx.lineWidth = Math.max(1, size * 0.004);
      ctx.stroke();

      // rock face noise speckles
      for (let s = 0; s < 28; s++) {
        const sx = cx + sr(s * 17 + x) * bw;
        const sy = cy + sr(s * 29 + x) * bh;
        const sr0 = sr(s * 11 + row + x);
        ctx.fillStyle = sr0 > 0.5
          ? `rgba(255,255,255,${0.08 + sr0 * 0.12})`
          : `rgba(0,0,0,${0.08 + sr0 * 0.14})`;
        ctx.fillRect(sx, sy, size * 0.012 + sr(s) * size * 0.01, size * 0.008 + sr(s * 3) * size * 0.01);
      }

      // top highlight
      ctx.beginPath();
      ctx.moveTo(cx + bw * 0.1, cy + bh * 0.18);
      ctx.lineTo(cx + bw * 0.9, cy + bh * 0.12);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = Math.max(1, size * 0.006);
      ctx.stroke();

      x += w;
    }
  }

  // overall dirt / age wash
  const wash = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.7);
  wash.addColorStop(0, 'rgba(120,110,95,0)');
  wash.addColorStop(1, 'rgba(60,55,48,0.28)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);
}

function heightFromColor(data: Uint8ClampedArray, i: number): number {
  return (data[i] + data[i + 1] + data[i + 2]) / 765;
}

function buildNormalFromHeight(heights: Float32Array, size: number, strength: number): ImageData {
  const out = new ImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const xl = heights[y * size + ((x - 1 + size) % size)];
      const xr = heights[y * size + ((x + 1) % size)];
      const yu = heights[((y - 1 + size) % size) * size + x];
      const yd = heights[((y + 1) % size) * size + x];
      let nx = (xl - xr) * strength;
      let ny = (yu - yd) * strength;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len; ny /= len;
      const nzz = nz / len;
      out.data[i * 4] = Math.round((nx * 0.5 + 0.5) * 255);
      out.data[i * 4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out.data[i * 4 + 2] = Math.round((nzz * 0.5 + 0.5) * 255);
      out.data[i * 4 + 3] = 255;
    }
  }
  return out;
}

export function getStoneRuinTextures(): {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  bumpMap: THREE.Texture;
} {
  if (!_stoneTex || !_stoneNormal || !_stoneBump) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    drawStoneFieldstone(ctx, size);

    const img = ctx.getImageData(0, 0, size, size);
    const heights = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) heights[i] = heightFromColor(img.data, i * 4);

    const normalData = buildNormalFromHeight(heights, size, 3.2);
    const nCanvas = document.createElement('canvas');
    nCanvas.width = size;
    nCanvas.height = size;
    nCanvas.getContext('2d')!.putImageData(normalData, 0, 0);

    const bCanvas = document.createElement('canvas');
    bCanvas.width = size;
    bCanvas.height = size;
    const bCtx = bCanvas.getContext('2d')!;
    const bImg = bCtx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = Math.round(heights[i] * 255);
      bImg.data[i * 4] = v;
      bImg.data[i * 4 + 1] = v;
      bImg.data[i * 4 + 2] = v;
      bImg.data[i * 4 + 3] = 255;
    }
    bCtx.putImageData(bImg, 0, 0);

    _stoneTex = new THREE.CanvasTexture(canvas);
    _stoneTex.wrapS = _stoneTex.wrapT = THREE.RepeatWrapping;
    _stoneTex.colorSpace = THREE.SRGBColorSpace;
    _stoneTex.anisotropy = 8;

    _stoneNormal = new THREE.CanvasTexture(nCanvas);
    _stoneNormal.wrapS = _stoneNormal.wrapT = THREE.RepeatWrapping;

    _stoneBump = new THREE.CanvasTexture(bCanvas);
    _stoneBump.wrapS = _stoneBump.wrapT = THREE.RepeatWrapping;
  }

  return { map: _stoneTex, normalMap: _stoneNormal, bumpMap: _stoneBump };
}

let _ruinMat: THREE.MeshStandardMaterial | null = null;

export function getStoneRuinMaterial(rx = 1.4, ry = 1.4): THREE.MeshStandardMaterial {
  const key = `${Math.round(rx * 100)}_${Math.round(ry * 100)}`;
  if (!_ruinMat || _ruinMat.userData.key !== key) {
    const tex = getStoneRuinTextures();
    const map = tex.map.clone();
    map.repeat.set(rx, ry);
    map.needsUpdate = true;
    const normalMap = tex.normalMap.clone();
    normalMap.repeat.set(rx, ry);
    normalMap.needsUpdate = true;
    const bumpMap = tex.bumpMap.clone();
    bumpMap.repeat.set(rx, ry);
    bumpMap.needsUpdate = true;

    _ruinMat = new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(1.6, 1.6),
      bumpMap,
      bumpScale: 0.35,
      color: '#d8d2c6',
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false,
    });
    _ruinMat.userData.key = key;
  }
  return _ruinMat;
}

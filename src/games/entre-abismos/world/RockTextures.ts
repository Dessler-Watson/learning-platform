import * as THREE from 'three';

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hash2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoiseTileable(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbmTileable(x: number, y: number, basePeriod: number, octaves: number, seed: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    value += amp * valueNoiseTileable(x * freq, y * freq, basePeriod * freq, seed + o * 131);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / norm;
}

function ridgeTileable(x: number, y: number, basePeriod: number, octaves: number, seed: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoiseTileable(x * freq, y * freq, basePeriod * freq, seed + o * 173);
    value += amp * (1 - Math.abs(n * 2 - 1));
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / norm;
}

export const ROCK_VARIANT_COUNT = 4;

interface VariantStyle {
  seed: number;
  strataA: number;
  strataB: number;
  r: number;
  g: number;
  b: number;
  warm: number;
  crackDepth: number;
  contrast: number;
}

const STYLES: VariantStyle[] = [
  { seed: 11, strataA: 18, strataB: 7, r: 205, g: 172, b: 128, warm: 55, crackDepth: 0.62, contrast: 1.0 },
  { seed: 211, strataA: 12, strataB: -11, r: 188, g: 168, b: 142, warm: 32, crackDepth: 0.58, contrast: 0.92 },
  { seed: 407, strataA: 22, strataB: 5, r: 212, g: 158, b: 112, warm: 68, crackDepth: 0.66, contrast: 1.08 },
  { seed: 631, strataA: -14, strataB: 16, r: 176, g: 152, b: 120, warm: 40, crackDepth: 0.7, contrast: 1.12 },
];

interface RockField {
  color: Uint8ClampedArray;
  normal: Uint8ClampedArray;
}

function buildRockField(size: number, style: VariantStyle): RockField {
  const color = new Uint8ClampedArray(size * size * 4);
  const normal = new Uint8ClampedArray(size * size * 4);
  const period = 8;
  const s = size;
  const seedBase = style.seed;

  const heights = new Float32Array(s * s);
  const cracks = new Float32Array(s * s);

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const u = x / s;
      const v = y / s;
      const nx = u * period;
      const ny = v * period;

      const base = fbmTileable(nx, ny, period, 6, seedBase + 11);
      const mid = fbmTileable(nx * 3, ny * 3, period * 3, 5, seedBase + 47);
      const fine = fbmTileable(nx * 9, ny * 9, period * 9, 4, seedBase + 89);
      const micro = fbmTileable(nx * 22, ny * 22, period * 22, 3, seedBase + 151);
      const ridged = ridgeTileable(nx * 2, ny * 2, period * 2, 5, seedBase + 131);

      const strataA = Math.sin((u * style.strataA + v * style.strataB + base * 3) * Math.PI);
      const strataB = Math.sin((u * 6 - v * 14 + mid * 2) * Math.PI * 1.3);
      const strata = Math.abs(strataA) * 0.48 + Math.abs(strataB) * 0.32;

      let h = base * 0.4 + mid * 0.26 + fine * 0.16 + micro * 0.08 + ridged * 0.38 + strata * 0.22;
      h = Math.min(1, Math.max(0, h));

      const fractureN = fbmTileable(nx * 4 + 3, ny * 4 - 2, period * 4, 4, seedBase + 201);
      const fracture =
        smooth(Math.min(1, Math.abs(fractureN - 0.5) * 8)) * 0.85 +
        smooth(Math.min(1, Math.abs(fbmTileable(nx * 7, ny * 7, period * 7, 3, seedBase + 251) - 0.5) * 10)) * 0.55;
      const crack = 1 - Math.min(1, fracture);

      const pore = fbmTileable(nx * 16, ny * 16, period * 16, 3, seedBase + 307);
      const grain = hash2(x * 1.7, y * 2.3, seedBase + 999);

      const i = y * s + x;
      heights[i] = h;
      cracks[i] = crack;

      const c = style.contrast;
      const light = (0.55 + (h - 0.5) * 0.7 * c) - crack * style.crackDepth - pore * 0.14 + (grain - 0.5) * 0.08;
      const warm = style.warm * 0.001 * (1 - h) + 0.06 * Math.sin(v * 9 + base * 4);

      const rC = style.r * light + warm * 55;
      const gC = style.g * light + warm * 28;
      const bC = style.b * light - warm * 8;

      const shade = 1 - crack * 0.4;
      const idx = i * 4;
      color[idx] = Math.min(255, Math.max(0, rC * shade));
      color[idx + 1] = Math.min(255, Math.max(0, gC * shade));
      color[idx + 2] = Math.min(255, Math.max(0, bC * shade));
      color[idx + 3] = 255;
    }
  }

  const lightDirX = -0.55;
  const lightDirY = -0.75;
  const strength = 34;
  const heightCopy = new Float32Array(heights);

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const xm = (x - 1 + s) % s;
      const xp = (x + 1) % s;
      const ym = (y - 1 + s) % s;
      const yp = (y + 1) % s;
      const dx = heightCopy[y * s + xp] - heightCopy[y * s + xm];
      const dy = heightCopy[yp * s + x] - heightCopy[ym * s + x];
      const emboss = (dx * lightDirX + dy * lightDirY) * strength;
      const i = (y * s + x) * 4;
      color[i] = Math.min(255, Math.max(0, color[i] + emboss));
      color[i + 1] = Math.min(255, Math.max(0, color[i + 1] + emboss * 0.95));
      color[i + 2] = Math.min(255, Math.max(0, color[i + 2] + emboss * 0.8));
    }
  }

  for (let i = 0; i < s * s; i++) {
    const crack = cracks[i];
    const k = i * 4;
    const deep = crack * crack;
    color[k] = Math.max(0, color[k] * (1 - deep * style.crackDepth));
    color[k + 1] = Math.max(0, color[k + 1] * (1 - deep * style.crackDepth));
    color[k + 2] = Math.max(0, color[k + 2] * (1 - deep * style.crackDepth * 0.9));
  }

  const nStrength = 3.2;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const xm = (x - 1 + s) % s;
      const xp = (x + 1) % s;
      const ym = (y - 1 + s) % s;
      const yp = (y + 1) % s;
      const hL = heightCopy[y * s + xm];
      const hR = heightCopy[y * s + xp];
      const hD = heightCopy[ym * s + x];
      const hU = heightCopy[yp * s + x];
      const dx = (hL - hR) * nStrength;
      const dy = (hD - hU) * nStrength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const nx = dx / len;
      const ny = dy / len;
      const nz = 1 / len;
      const i = (y * s + x) * 4;
      normal[i] = (nx * 0.5 + 0.5) * 255;
      normal[i + 1] = (ny * 0.5 + 0.5) * 255;
      normal[i + 2] = (nz * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
    }
  }

  return { color, normal };
}

function dataToTexture(data: Uint8ClampedArray, size: number, srgb: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

interface RockSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

const rockSets: (RockSet | null)[] = [null, null, null, null];
const mapClones = new Map<string, THREE.Texture>();
const normalClones = new Map<string, THREE.Texture>();
const ROCK_SIZE = 512;

function ensureRockSet(variant: number): RockSet {
  const v = ((variant % ROCK_VARIANT_COUNT) + ROCK_VARIANT_COUNT) % ROCK_VARIANT_COUNT;
  if (!rockSets[v]) {
    if (typeof document === 'undefined') {
      throw new Error('Rock textures require document');
    }
    const field = buildRockField(ROCK_SIZE, STYLES[v]);
    rockSets[v] = {
      map: dataToTexture(field.color, ROCK_SIZE, true),
      normalMap: dataToTexture(field.normal, ROCK_SIZE, false),
    };
  }
  return rockSets[v]!;
}

function hashColor(color: string): number {
  let h = 0;
  for (let i = 0; i < color.length; i++) {
    h = (h * 31 + color.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getRockVariantForColor(color: string): number {
  return hashColor(color) % ROCK_VARIANT_COUNT;
}

export function getRockSet(variant: number): RockSet {
  return ensureRockSet(variant);
}

export function getRockSetScaled(variant: number, rx: number, ry = rx): { map: THREE.Texture; normalMap: THREE.Texture } {
  const v = ((variant % ROCK_VARIANT_COUNT) + ROCK_VARIANT_COUNT) % ROCK_VARIANT_COUNT;
  const key = `${v}_${Math.round(rx * 100 + ry)}`;
  let map = mapClones.get(key);
  let normalMap = normalClones.get(key);
  if (!map) {
    const set = ensureRockSet(v);
    map = set.map.clone();
    map.repeat.set(rx, ry);
    map.needsUpdate = true;
    mapClones.set(key, map);
  }
  if (!normalMap) {
    const set = ensureRockSet(v);
    normalMap = set.normalMap.clone();
    normalMap.repeat.set(rx, ry);
    normalMap.needsUpdate = true;
    normalClones.set(key, normalMap);
  }
  return { map, normalMap };
}

export function getCliffRockTextureScaled(rx: number, ry = rx): THREE.Texture {
  return getRockSetScaled(0, rx, ry).map;
}

export function getCliffBumpTextureScaled(rx: number, ry = rx): THREE.Texture {
  return getRockSetScaled(0, rx, ry).normalMap;
}

let _glassTex: THREE.CanvasTexture | null = null;

export function createGlassTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#e8f4f6');
  g.addColorStop(0.25, '#f2fafa');
  g.addColorStop(0.4, '#d4e8ec');
  g.addColorStop(0.55, '#f8fcfc');
  g.addColorStop(0.7, '#c8dde2');
  g.addColorStop(0.85, '#eef7f8');
  g.addColorStop(1, '#dcecee');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 8; i++) {
    const x0 = -size + i * 70;
    const grad = ctx.createLinearGradient(x0, 0, x0 + 90, size);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, `rgba(255,255,255,${0.12 + sr(i) * 0.1})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-0.7);
    ctx.translate(-size / 2, -size / 2);
    ctx.fillRect(-size, -size, size * 3, size * 3);
    ctx.restore();
  }

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (sr(i * 0.29 + 3) - 0.5) * 18;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function getGlassTexture(): THREE.CanvasTexture {
  if (!_glassTex) _glassTex = createGlassTexture();
  return _glassTex;
}

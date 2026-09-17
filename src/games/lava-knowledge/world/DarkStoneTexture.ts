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

export function createDarkStoneTexture(size = 512): THREE.CanvasTexture {
  const S = size;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  /* ═══ STEP 1: Voronoi cell map ═══ */
  const CS = 34;
  const cols = Math.ceil(S / CS);
  const rows = Math.ceil(S / CS);
  const seeds: { x: number; y: number; sid: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (sr(c * 3.1 + r * 7.3) - 0.5) * CS * 0.55;
      const jy = (sr(c * 11.7 + r * 13.9) - 0.5) * CS * 0.55;
      seeds.push({
        x: c * CS + CS * 0.5 + jx,
        y: r * CS + CS * 0.5 + jy,
        sid: c * 1000 + r,
      });
    }
  }

  /* ═══ STEP 2: Pixel rendering ═══ */
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
      const sid = seeds[best].sid;

      /* ── Mortar — pure black ── */
      const groutW = 3;
      if (edge < groutW) {
        const gv = 2 + Math.floor(fbm(x * 0.1, y * 0.1, 2) * 3);
        px[idx * 4] = gv;
        px[idx * 4 + 1] = gv;
        px[idx * 4 + 2] = gv;
        px[idx * 4 + 3] = 255;
        continue;
      }

      /* ── Stone — black volcanic base ── */
      const sidHash = sr(sid * 7.1);
      const stoneBase = 5 + sidHash * 10;

      const sx2 = x * 0.006 + sid * 4.1;
      const sy2 = y * 0.006 + sid * 6.3;

      /* multi-layer surface detail */
      const n1 = fbm(sx2, sy2, 6);
      const n2 = fbm(sx2 * 2.5 + 7, sy2 * 2.5 + 7, 5);
      const n3 = fbm(sx2 * 5 + 13, sy2 * 5 + 13, 4);
      const n4 = fbm(sx2 * 10 + 20, sy2 * 10 + 20, 3);

      /* base value — near black */
      let v = stoneBase + (n1 - 0.5) * 10 + (n2 - 0.5) * 7 + (n3 - 0.5) * 4;

      /* angular facets — rough volcanic surface */
      const facet = n4;
      if (facet > 0.6) v += (facet - 0.6) * 12;
      else if (facet < 0.4) v -= (0.4 - facet) * 8;

      /* glossy obsidian patches */
      const gloss = fbm(sx2 * 1.5 + 30, sy2 * 1.5 + 30, 4);
      if (gloss > 0.6) {
        v += (gloss - 0.6) * 18;
      }

      /* dark veins / cooling cracks */
      const vein = Math.abs(fbm(sx2 * 3 + 40, sy2 * 3 + 40, 5) - 0.5) * 2;
      if (vein < 0.05) {
        v -= (0.05 - vein) * 80;
      }

      /* raised highlights */
      const highlight = fbm(sx2 * 2 + 50, sy2 * 2 + 50, 4);
      if (highlight > 0.65) {
        v += (highlight - 0.65) * 14;
      }

      /* fine grain */
      const grain = (sr(x * 0.31 + y * 0.27 + sid * 100) - 0.5) * 3;
      v += grain;

      /* edge bevel */
      const bevelW = 6;
      if (edge < groutW + bevelW) {
        const t = (edge - groutW) / bevelW;
        const s = seeds[best];
        const dx = x - s.x, dy = y - s.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const lightDot = (-dx / len * 0.5 + -dy / len * 0.6);
        const str = (1 - t) * 0.25;
        if (lightDot > 0) v += lightDot * str * 10;
        else v += lightDot * str * 7;
      }

      const cv = Math.max(0, Math.min(255, Math.round(v)));
      px[idx * 4]     = cv;
      px[idx * 4 + 1] = cv;
      px[idx * 4 + 2] = cv;
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

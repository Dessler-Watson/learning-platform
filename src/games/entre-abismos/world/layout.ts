export function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const START_Z = 2;
export const FINISH_Z = -54.5;
export const BRIDGE_Y = 2;

export interface WallDef {
  x: number;
  z: number;
  s: number;
  seed: number;
  h: number;
}

export interface SphereItem {
  pos: [number, number, number];
  radius: number;
}

export function generateValleyWalls(): WallDef[] {
  const list: WallDef[] = [];
  let n = 0;

  for (let i = 0; i < 9; i++) {
    list.push({ x: -(48 + sr(n++) * 10), z: 14 - i * 12, s: 0.75 + sr(n++) * 0.5, seed: n * 17, h: 38 + sr(n++) * 24 });
  }
  for (let i = 0; i < 9; i++) {
    list.push({ x: 48 + sr(n++) * 10, z: 12 - i * 12, s: 0.75 + sr(n++) * 0.5, seed: n * 17, h: 38 + sr(n++) * 24 });
  }

  for (let i = 0; i < 7; i++) {
    list.push({ x: -36 + i * 12 + sr(n++) * 6, z: 20 + sr(n++) * 10, s: 0.85 + sr(n++) * 0.5, seed: n * 19, h: 40 + sr(n++) * 22 });
  }
  for (let i = 0; i < 4; i++) {
    list.push({ x: -30 + i * 20 + sr(n++) * 8, z: 36 + sr(n++) * 10, s: 1.0 + sr(n++) * 0.6, seed: n * 19, h: 50 + sr(n++) * 25 });
  }

  const fz = FINISH_Z;
  for (let i = 0; i < 7; i++) {
    list.push({ x: -36 + i * 12 + sr(n++) * 6, z: fz - 16 - sr(n++) * 10, s: 0.85 + sr(n++) * 0.5, seed: n * 23, h: 40 + sr(n++) * 22 });
  }
  for (let i = 0; i < 4; i++) {
    list.push({ x: -30 + i * 20 + sr(n++) * 8, z: fz - 34 - sr(n++) * 10, s: 1.0 + sr(n++) * 0.6, seed: n * 23, h: 50 + sr(n++) * 25 });
  }

  for (let i = 0; i < 4; i++) {
    list.push({ x: -58 - sr(n++) * 8, z: 16 - i * 24, s: 0.9 + sr(n++) * 0.5, seed: n * 29, h: 45 + sr(n++) * 20 });
    list.push({ x: 58 + sr(n++) * 8, z: 16 - i * 24, s: 0.9 + sr(n++) * 0.5, seed: n * 29, h: 45 + sr(n++) * 20 });
  }

  return list;
}

export function mountainBaseRadius(seed: number): number {
  return 10.5 + sr(seed + 77) * 6.5;
}

/** Approximate horizontal radius of a valley-wall mountain (peaks + base). */
export function mountainRadius(w: WallDef): number {
  const r = mountainBaseRadius(w.seed);
  const sxz = w.s * 1.28;
  return r * 1.55 * sxz;
}

export function wallObstacles(walls: WallDef[]): SphereItem[] {
  return walls.map((w) => ({
    pos: [w.x, -25 + w.h * w.s * 0.35, w.z],
    radius: mountainRadius(w),
  }));
}

function dist2(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
}

export function overlaps(a: SphereItem, b: SphereItem, extra = 0): boolean {
  const r = a.radius + b.radius + extra;
  return dist2(a.pos[0], a.pos[1], a.pos[2], b.pos[0], b.pos[1], b.pos[2]) < r * r;
}

const MARGIN = 0.65;

function blocked(
  candidate: [number, number, number],
  radius: number,
  others: SphereItem[],
  selfIndex: number,
): boolean {
  const probe: SphereItem = { pos: candidate, radius };
  for (let i = 0; i < others.length; i++) {
    if (i === selfIndex) continue;
    if (overlaps(probe, others[i], MARGIN)) return true;
  }
  return false;
}

/**
 * Nudge items that overlap others. Mountains/obstacles never move;
 * only the provided movable items get new positions.
 * Returns how many items were moved.
 */
export function resolveOverlaps(
  movable: SphereItem[],
  fixed: SphereItem[],
  opts: {
    minXAbs?: number;
    maxXAbs?: number;
    minY?: number;
    maxY?: number;
    maxZ?: number;
    minZ?: number;
    seed?: number;
  } = {},
): number {
  const minXAbs = opts.minXAbs ?? 6.5;
  const maxXAbs = opts.maxXAbs ?? 42;
  const minY = opts.minY ?? -8;
  const maxY = opts.maxY ?? 24;
  const minZ = opts.minZ ?? FINISH_Z - 20;
  const maxZ = opts.maxZ ?? START_Z + 16;
  const seed = opts.seed ?? 9000;

  const items: SphereItem[] = [
    ...fixed.map((f) => ({ pos: [...f.pos] as [number, number, number], radius: f.radius })),
    ...movable.map((m) => ({ pos: [...m.pos] as [number, number, number], radius: m.radius })),
  ];
  const fixedCount = fixed.length;
  let moved = 0;

  const clampPos = (p: [number, number, number]): [number, number, number] => {
    let x = p[0];
    if (Math.abs(x) < minXAbs) x = x < 0 ? -minXAbs : minXAbs;
    x = Math.max(-maxXAbs, Math.min(maxXAbs, x));
    const y = Math.max(minY, Math.min(maxY, p[1]));
    const z = Math.max(minZ, Math.min(maxZ, p[2]));
    return [x, y, z];
  };

  for (let i = fixedCount; i < items.length; i++) {
    const item = items[i];
    if (!blocked(item.pos, item.radius, items, i)) continue;

    let placed = false;
    const base = item.pos;

    for (let attempt = 0; attempt < 48 && !placed; attempt++) {
      const ring = 1.5 + Math.floor(attempt / 8) * 2.5;
      const angle = sr(seed + i * 17 + attempt * 3) * Math.PI * 2;
      const dy = (sr(seed + i * 19 + attempt * 5) - 0.5) * (2 + Math.floor(attempt / 12) * 3);
      const candidate = clampPos([
        base[0] + Math.cos(angle) * ring,
        base[1] + dy,
        base[2] + Math.sin(angle) * ring,
      ]);
      if (!blocked(candidate, item.radius, items, i)) {
        item.pos = candidate;
        placed = true;
        moved++;
      }
    }

    if (!placed) {
      for (let attempt = 0; attempt < 32 && !placed; attempt++) {
        const side = base[0] >= 0 ? 1 : -1;
        const x = side * (minXAbs + sr(seed + i * 31 + attempt) * (maxXAbs - minXAbs));
        const y = minY + sr(seed + i * 37 + attempt) * (maxY - minY);
        const z = minZ + sr(seed + i * 41 + attempt) * (maxZ - minZ);
        const candidate: [number, number, number] = [x, y, z];
        if (!blocked(candidate, item.radius, items, i)) {
          item.pos = candidate;
          placed = true;
          moved++;
        }
      }
    }
  }

  for (let i = 0; i < movable.length; i++) {
    movable[i].pos = items[fixedCount + i].pos;
  }

  return moved;
}

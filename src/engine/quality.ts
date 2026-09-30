export type QualityTier = 'high' | 'medium' | 'low';

export interface GameQuality {
  tier: QualityTier;
  dprMax: number;
  shadowMapMax: number;
  countRatio: number;
  ambientStride: number;
  fullLights: boolean;
  anisotropy: number;
}

const TIERS: Record<QualityTier, GameQuality> = {
  high: {
    tier: 'high',
    dprMax: 2,
    shadowMapMax: 2048,
    countRatio: 1,
    ambientStride: 1,
    fullLights: true,
    anisotropy: 8,
  },
  medium: {
    tier: 'medium',
    dprMax: 1.5,
    shadowMapMax: 1024,
    countRatio: 0.7,
    ambientStride: 1,
    fullLights: true,
    anisotropy: 8,
  },
  low: {
    tier: 'low',
    dprMax: 1.5,
    shadowMapMax: 512,
    countRatio: 0.5,
    ambientStride: 2,
    fullLights: false,
    anisotropy: 4,
  },
};

function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const touch = (navigator.maxTouchPoints ?? 0) > 0;
  const smallTouch = touch && Math.min(window.innerWidth, window.innerHeight) < 600;
  if (!coarse && !smallTouch) return 'high';
  return Math.min(window.innerWidth, window.innerHeight) >= 600 ? 'medium' : 'low';
}

let cached: GameQuality | null = null;

export function getGameQuality(): GameQuality {
  if (!cached) cached = TIERS[detectTier()];
  return cached;
}

export function clampDpr(baseMax: number): number {
  const quality = getGameQuality();
  if (quality.tier === 'high') return Math.min(baseMax, quality.dprMax);
  const native =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(native, quality.dprMax);
}

export function clampShadowMap(base: number): number {
  return Math.min(base, getGameQuality().shadowMapMax);
}

export function scaleCount(base: number): number {
  return Math.max(1, Math.round(base * getGameQuality().countRatio));
}

export function texAnisotropy(): number {
  return getGameQuality().anisotropy;
}

export function ambientDelta(dt: number): number {
  return dt * getGameQuality().ambientStride;
}

export function makeAmbientGate(): () => boolean {
  let n = 0;
  return () => {
    const stride = getGameQuality().ambientStride;
    if (stride <= 1) return true;
    n = (n + 1) % stride;
    return n === 0;
  };
}

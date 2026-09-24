'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, ConvexHullCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { getRockSetScaled, getRockVariantForColor } from './RockTextures';
import {
  sr,
  START_Z,
  FINISH_Z,
  generateValleyWalls,
  wallObstacles,
  resolveOverlaps,
  type SphereItem,
} from './layout';

/** Cached after first generation so rocks/crystals stay consistent. */
export function getPlacedRocks(): FloatingRockData[] {
  if (!placedRocks) placedRocks = generateRocks();
  return placedRocks;
}

const ROCK_COLORS = [
  '#eadcc4', '#f0e4cc', '#e0d2b8', '#d8caa8', '#f2e6d0', '#e4d6bc', '#eee0c8', '#dccdb4',
  '#e8d8bc', '#f4ead8', '#dcc8a4', '#e2d0b0', '#f0e0c4', '#d6c4a0', '#ead6b8', '#e6d4b4',
];
const matCache = new Map<string, THREE.MeshStandardMaterial>();

function getRockMat(color: string): THREE.MeshStandardMaterial {
  let m = matCache.get(color);
  if (!m) {
    const variant = getRockVariantForColor(color);
    const rock = typeof document !== 'undefined' ? getRockSetScaled(variant, 4) : null;
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      flatShading: true,
      map: rock?.map,
      normalMap: rock?.normalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
    });
    matCache.set(color, m);
  }
  return m;
}

function posHash(x: number, y: number, z: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.37) * 43758.5453;
  return n - Math.floor(n);
}

function createRockGeometry(seed: number, variant: number): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;

  if (variant === 0) {
    geo = new THREE.DodecahedronGeometry(1, 0);
  } else if (variant === 1) {
    geo = new THREE.IcosahedronGeometry(1, 0);
  } else if (variant === 2) {
    geo = new THREE.OctahedronGeometry(1, 1);
  } else {
    geo = new THREE.IcosahedronGeometry(1, 1);
  }

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 0.82 + posHash(v.x, v.y, v.z, seed) * 0.36;
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

let sharedGeos: THREE.BufferGeometry[] | null = null;

function getSharedGeos(): THREE.BufferGeometry[] {
  if (!sharedGeos) {
    sharedGeos = [0, 1, 2, 3, 4, 5].map((i) => createRockGeometry(900 + i * 47, i % 4));
  }
  return sharedGeos;
}

interface FloatingRockData {
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  geoIndex: number;
  color: string;
  bobSpeed: number;
  bobAmp: number;
  rotSpeed: number;
  castShadow: boolean;
}

function rockBounds(data: FloatingRockData): number {
  const { scale } = data;
  const extent = Math.max(scale[0], scale[1], scale[2]) * 1.25;
  const sat = scale[0] > 1.8 ? scale[0] * 1.1 : 0;
  return Math.max(extent, sat) + data.bobAmp;
}

let placedRocks: FloatingRockData[] | null = null;

function generateRocks(): FloatingRockData[] {
  const rocks: FloatingRockData[] = [];
  const zRange = START_Z - FINISH_Z + 30;

  for (let i = 0; i < 36; i++) {
    const side = sr(i * 3 + 7000) > 0.5 ? 1 : -1;
    const x = side * (7 + sr(i * 3 + 7001) * 28);
    const z = sr(i * 3 + 7002) * zRange + FINISH_Z - 12;
    const yBand = sr(i * 3 + 7003);
    let y: number;
    if (yBand < 0.35) y = CFG.bridgeY + 3 + sr(i * 7 + 7010) * 7;
    else if (yBand < 0.7) y = CFG.bridgeY - 3 - sr(i * 7 + 7011) * 6;
    else y = CFG.bridgeY + 10 + sr(i * 7 + 7012) * 8;

    const sizeKind = sr(i * 3 + 7004);
    let baseS: number;
    if (sizeKind < 0.35) baseS = 0.35 + sr(i * 5 + 7020) * 0.5;
    else if (sizeKind < 0.75) baseS = 0.9 + sr(i * 5 + 7021) * 1.4;
    else baseS = 2.4 + sr(i * 5 + 7022) * 3.2;

    const shape = sr(i * 3 + 7005);
    let scale: [number, number, number];
    if (shape < 0.3) {
      scale = [baseS, baseS * (1.3 + sr(i + 7030) * 0.7), baseS * (0.85 + sr(i + 7031) * 0.3)];
    } else if (shape < 0.6) {
      scale = [baseS * (1.15 + sr(i + 7032) * 0.4), baseS * (0.55 + sr(i + 7033) * 0.35), baseS * (1.05 + sr(i + 7034) * 0.4)];
    } else if (shape < 0.85) {
      const a = baseS * (0.9 + sr(i + 7035) * 0.4);
      scale = [a, a * (0.95 + sr(i + 7036) * 0.5), a * (0.9 + sr(i + 7037) * 0.4)];
    } else {
      scale = [baseS * 1.4, baseS * 0.7, baseS * 0.9];
    }

    const bobAmp = sr(i * 5 + 7051) * 0.35 + 0.1;
    rocks.push({
      pos: [x, y, z],
      scale,
      rotation: [
        sr(i * 5 + 7040) * Math.PI * 2,
        sr(i * 5 + 7041) * Math.PI * 2,
        sr(i * 5 + 7042) * Math.PI * 2,
      ],
      geoIndex: Math.floor(sr(i * 3 + 7006) * 6),
      color: ROCK_COLORS[Math.floor(sr(i * 3 + 7007) * ROCK_COLORS.length)],
      bobSpeed: sr(i * 5 + 7050) * 0.25 + 0.08,
      bobAmp,
      rotSpeed: (sr(i * 5 + 7052) - 0.5) * 0.12,
      castShadow: baseS > 1.2,
    });
  }

  for (let i = 0; i < 8; i++) {
    const side = sr(i * 3 + 8000) > 0.5 ? 1 : -1;
    const x = side * (4 + sr(i * 3 + 8001) * 6);
    const z = sr(i * 3 + 8002) * zRange + FINISH_Z - 8;
    const y = CFG.bridgeY + 14 + sr(i * 3 + 8003) * 6;
    const baseS = 0.4 + sr(i * 5 + 8010) * 0.7;
    const bobAmp = sr(i + 8012) * 0.4 + 0.15;
    rocks.push({
      pos: [x, y, z],
      scale: [baseS, baseS * 1.5, baseS],
      rotation: [sr(i + 8020) * Math.PI * 2, sr(i + 8021) * Math.PI * 2, sr(i + 8022) * Math.PI * 2],
      geoIndex: Math.floor(sr(i + 8004) * 6),
      color: ROCK_COLORS[Math.floor(sr(i + 8005) * ROCK_COLORS.length)],
      bobSpeed: sr(i + 8011) * 0.2 + 0.1,
      bobAmp,
      rotSpeed: (sr(i + 8013) - 0.5) * 0.2,
      castShadow: false,
    });
  }

  const walls = wallObstacles(generateValleyWalls());
  const items: SphereItem[] = rocks.map((r) => ({
    pos: [...r.pos] as [number, number, number],
    radius: rockBounds(r),
  }));
  resolveOverlaps(items, walls, { minXAbs: 7, maxXAbs: 40, seed: 7777 });
  rocks.forEach((r, i) => {
    r.pos = items[i].pos;
  });

  return rocks;
}

function hullPoints(
  geo: THREE.BufferGeometry,
  scale: [number, number, number],
  offset: [number, number, number] = [0, 0, 0],
  euler?: [number, number, number],
): Float32Array {
  const pos = geo.attributes.position;
  const rot = new THREE.Euler(euler?.[0] ?? 0, euler?.[1] ?? 0, euler?.[2] ?? 0);
  const out = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiply(new THREE.Vector3(scale[0], scale[1], scale[2]));
    if (euler) v.applyEuler(rot);
    v.x += offset[0];
    v.y += offset[1];
    v.z += offset[2];
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  return out;
}

function FloatingRock({ data }: { data: FloatingRockData }) {
  const rbRef = useRef<any>(null);
  const geos = useMemo(() => getSharedGeos(), []);
  const mat = useMemo(() => getRockMat(data.color), [data.color]);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);

  const hasSatellite = data.scale[0] > 1.8;
  const mainHull = useMemo(
    () => hullPoints(geos[data.geoIndex], data.scale),
    [geos, data.geoIndex, data.scale],
  );
  const satHull = useMemo(() => {
    if (!hasSatellite) return null;
    return hullPoints(
      geos[(data.geoIndex + 2) % 6],
      [data.scale[0] * 0.4, data.scale[1] * 0.45, data.scale[2] * 0.4],
      [data.scale[0] * 0.7, -data.scale[1] * 0.35, data.scale[2] * 0.3],
      [0.4, 0.8, 0.2],
    );
  }, [hasSatellite, geos, data.geoIndex, data.scale]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const y = data.pos[1] + Math.sin(t * data.bobSpeed + data.pos[0]) * data.bobAmp;
    const rx = data.rotation[0] + Math.sin(t * data.bobSpeed * 0.5) * 0.04;
    const ry = data.rotation[1] + t * data.rotSpeed;
    euler.set(rx, ry, data.rotation[2]);
    quat.setFromEuler(euler);
    if (rbRef.current) {
      rbRef.current.setNextKinematicTranslation({ x: data.pos[0], y, z: data.pos[2] });
      rbRef.current.setNextKinematicRotation(quat);
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      colliders={false}
      position={data.pos}
      rotation={data.rotation}
      name="floating-rock"
    >
      <ConvexHullCollider args={[mainHull]} />
      {satHull && <ConvexHullCollider args={[satHull]} />}
      <mesh
        geometry={geos[data.geoIndex]}
        scale={data.scale}
        material={mat}
        castShadow={data.castShadow}
        receiveShadow={data.castShadow}
      />
      {hasSatellite && (
        <mesh
          geometry={geos[(data.geoIndex + 2) % 6]}
          material={mat}
          position={[data.scale[0] * 0.7, -data.scale[1] * 0.35, data.scale[2] * 0.3]}
          scale={[data.scale[0] * 0.4, data.scale[1] * 0.45, data.scale[2] * 0.4]}
          rotation={[0.4, 0.8, 0.2]}
        />
      )}
    </RigidBody>
  );
}

export function FloatingRocks() {
  const rocks = useMemo(() => getPlacedRocks(), []);

  return (
    <group>
      {rocks.map((r, i) => (
        <FloatingRock key={i} data={r} />
      ))}
    </group>
  );
}

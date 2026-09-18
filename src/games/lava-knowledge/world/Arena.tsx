'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { LavaSurface } from './LavaSurface';
import { createProceduralStoneMaterial } from './ProceduralStoneMaterial';

const LAVA_Y = -1.0;
const ARENA_HALF = 20;

/* ═══ CRACKED LAVA MATERIAL — dark plates with glowing orange cracks ═══ */
const glowVert = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
varying float vDistToCam;
uniform vec3 uCamPos;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vLocalPos = position;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vDistToCam = length(wp.xyz - uCamPos);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const glowFrag = `
uniform float uScale;
uniform float uCrackWidth;
uniform float uGlowStr;
uniform float uTime;
uniform float uTotalH;
uniform vec3 uPlateColor;
uniform vec3 uCrackColor;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
varying float vDistToCam;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

vec2 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.4 + 0.2 * sin(uTime * 0.15 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  return vec2(sqrt(d1), sqrt(d2));
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

vec2 triplanarUV(vec3 p, vec3 n) {
  vec3 a = abs(n);
  if (a.x >= a.y && a.x >= a.z) return p.yz;
  else if (a.y >= a.x && a.y >= a.z) return p.xz;
  else return p.xy;
}

float voronoiCrack(vec2 uv, out float cellId) {
  vec2 n = floor(uv);
  vec2 f = fract(uv);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 bestCell = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.4 + 0.2 * sin(uTime * 0.15 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; bestCell = n + g; }
      else if (d < d2) { d2 = d; }
    }
  }
  cellId = bestCell.x * 7.31 + bestCell.y * 13.79;
  float edge = d2 - d1;
  float crack = 1.0 - smoothstep(0.0, uCrackWidth, edge);
  return pow(crack, 1.3);
}

void main(){
  vec2 uv = triplanarUV(vWorldPos, vNormal) * uScale;
  vec2 distort = vec2(fbm(uv * 0.5 + 50.0), fbm(uv * 0.5 + 150.0));
  uv += distort * 0.4;

  float cellId;
  float crack = voronoiCrack(uv, cellId) * uGlowStr;

  // Per-cell individual glow: each crack has its own speed, phase, intensity
  float cellRand = fract(sin(cellId * 43758.5453) * 43758.5453);
  float cellRand2 = fract(sin(cellId * 12345.6789) * 98765.4321);

  float slowPulse = sin(uTime * (0.6 + cellRand * 0.8) + cellRand2 * 6.2831) * 0.5 + 0.5;
  float fastFlicker = sin(uTime * (2.0 + cellRand * 3.0) + cellRand2 * 10.0) * 0.5 + 0.5;

  float cellBrightness = 0.3 + slowPulse * 0.5 + fastFlicker * 0.2;
  cellBrightness *= 0.5 + cellRand * 0.5;

  crack *= cellBrightness;

  // Hot center color in cracks
  vec3 hotColor = vec3(1.0, 0.85, 0.2);
  vec3 crackCol = mix(uCrackColor, hotColor, crack * 0.6);

  // Bottom-to-top lava glow
  float lavaHeight = uTotalH + 2.0;
  float fromBottom = clamp((lavaHeight - (vWorldPos.y - (-1.0))) / lavaHeight, 0.0, 1.0);
  float verticalGlow = pow(fromBottom, 2.5) * 0.6;
  vec3 lavaLight = vec3(1.0, 0.4, 0.02);

  vec3 col = mix(uPlateColor, crackCol, crack);

  float glowOnCrack = crack * 0.5 + 0.5;
  col += lavaLight * verticalGlow * glowOnCrack;

  // Per-block orange glow: bottom to top gradient on each cube
  float blockHalfH = 0.5;
  float localBottom = clamp((blockHalfH - vLocalPos.y) / (blockHalfH * 2.0), 0.0, 1.0);
  float blockGlow = pow(localBottom, 1.8) * 0.2;
  blockGlow *= 0.7 + 0.3 * sin(uTime * 0.9 + cellRand2 * 5.0);
  vec3 blockGlowColor = vec3(1.0, 0.45, 0.03);
  col += blockGlowColor * blockGlow;

  // Distance fog: fade to black in the background
  float fogStart = 22.0;
  float fogEnd = 48.0;
  float fogFactor = smoothstep(fogStart, fogEnd, vDistToCam);
  col = mix(col, vec3(0.0), fogFactor);

  gl_FragColor = vec4(col, 1.0);
}`;

function LavaGlowMaterial({ baseColor, totalHeight }: {
  baseColor: string; totalHeight: number;
}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1.2 },
      uCrackWidth: { value: 0.18 },
      uGlowStr: { value: 1.3 },
      uTime: { value: 0 },
      uTotalH: { value: totalHeight },
      uPlateColor: { value: new THREE.Color(baseColor) },
      uCrackColor: { value: new THREE.Color('#FF6600') },
      uCamPos: { value: new THREE.Vector3() },
    },
    vertexShader: glowVert,
    fragmentShader: glowFrag,
  }), [baseColor, totalHeight]);

  useFrame(({ clock, camera }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uCamPos.value.copy(camera.position);
  });

  return <primitive object={mat} attach="material" />;
}

function RockWall({ x, z, rotY, scaleX, height }: {
  x: number; z: number; rotY: number; scaleX: number; height: number;
}) {
  const wallColor = useMemo(() => {
    const colors = ['#121215', '#16161A', '#0E0E11', '#131317'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  return (
    <group position={[x, height / 2 - 1, z]} rotation={[0, rotY, 0]}>
      <RigidBody type="fixed">
        <CuboidCollider args={[scaleX * 3, height / 2, 0.8]} />
      </RigidBody>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[scaleX * 6, height, 1.6]} />
        <LavaGlowMaterial baseColor={wallColor} totalHeight={height} />
      </mesh>
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <boxGeometry args={[scaleX * 6, height, 0.4]} />
        <LavaGlowMaterial baseColor={wallColor} totalHeight={height} />
      </mesh>
    </group>
  );
}

interface VolcanoLayer {
  y: number; w: number; d: number; h: number; rotY: number;
  offsetX?: number; offsetZ?: number;
}

interface LavaCascade {
  angle: number; w: number; startLayer: number;
}

function seededVolcano(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

/* ── LAVA CASCADE: thick 3D box flush against volcano wall ── */
function LavaCascadeMesh({ c, layers }: { c: LavaCascade; layers: VolcanoLayer[] }) {
  const startIdx = Math.min(c.startLayer, layers.length - 2);
  const endIdx = Math.min(startIdx + 3, layers.length - 1);
  const startLayer = layers[startIdx];
  const endLayer = layers[endIdx];
  if (!startLayer || !endLayer) return null;

  const startY = startLayer.y + startLayer.h / 2;
  const endY = endLayer.y - endLayer.h / 2;
  const cascadeH = startY - endY;
  if (cascadeH <= 0) return null;

  const avgR = (startLayer.w + endLayer.w) / 4;
  const x = Math.cos(c.angle) * avgR;
  const z = Math.sin(c.angle) * avgR;
  const cascadeLen = cascadeH * 1.2;
  const facingAngle = c.angle + Math.PI / 2;

  return (
    <group>
      <mesh
        position={[x, startY - cascadeH * 0.4, z]}
        rotation={[0, facingAngle, Math.atan2(cascadeH * 0.8, avgR * 0.3)]}
      >
        <boxGeometry args={[c.w * 2.5, cascadeLen, 0.15]} />
        <meshBasicMaterial color="#FF4400" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        position={[x, startY - cascadeH * 0.4, z]}
        rotation={[0, facingAngle, Math.atan2(cascadeH * 0.8, avgR * 0.3)]}
      >
        <boxGeometry args={[c.w, cascadeLen, 0.3]} />
        <meshBasicMaterial color="#FF5500" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        position={[x, startY - cascadeH * 0.4, z]}
        rotation={[0, facingAngle, Math.atan2(cascadeH * 0.8, avgR * 0.3)]}
      >
        <boxGeometry args={[c.w * 0.4, cascadeLen * 0.7, 0.1]} />
        <meshBasicMaterial color="#FFAA00" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════
   TYPE 1: CLIFF — tall, narrow, stepped with safe overhangs
   ══════════════════════════════════════════════════════════ */
function VolcanoCliff({ x, z, rotY, layers, cascades }: {
  x: number; z: number; rotY: number; layers: VolcanoLayer[]; cascades: LavaCascade[];
}) {
  const totalH = layers.reduce((a, l) => a + l.h, 0);
  const topLayer = layers[layers.length - 1];

  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      {layers.map((l, i) => {
        const baseColor = i < 2 ? '#0E0E11' : i < layers.length - 2 ? '#121215' : '#16161A';
        return (
          <mesh key={i} position={[l.offsetX ?? 0, l.y, l.offsetZ ?? 0]} castShadow rotation={[0, l.rotY, 0]}>
            <boxGeometry args={[l.w, l.h, l.d]} />
            <LavaGlowMaterial baseColor={baseColor} totalHeight={totalH} />
          </mesh>
        );
      })}
      {/* Lava glow on overhang undersides */}
      {layers.slice(1).filter((l, i) => {
        const prev = layers[i];
        return prev && (l.w > prev.w + 0.5 || l.d > prev.d + 0.5);
      }).map((l, i) => (
        <mesh key={`ov-${i}`} position={[l.offsetX ?? 0, l.y + l.h / 2 + 0.05, l.offsetZ ?? 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[l.w * 0.8, l.d * 0.8]} />
          <meshBasicMaterial color="#FF5500" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, totalH + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[topLayer.w * 0.4, 8]} />
        <meshBasicMaterial color="#FF6600" transparent opacity={0.8} />
      </mesh>
      {cascades.map((c, i) => (
        <LavaCascadeMesh key={`c-${i}`} c={c} layers={layers} />
      ))}
      <pointLight position={[0, totalH + 2, 0]} intensity={3} color="#FF6600" distance={25} decay={2} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════
   TYPE 2: SHIELD — wide, flat, few thick layers
   ══════════════════════════════════════════════════════════ */
function VolcanoShield({ x, z, rotY, layers, cascades }: {
  x: number; z: number; rotY: number; layers: VolcanoLayer[]; cascades: LavaCascade[];
}) {
  const totalH = layers.reduce((a, l) => a + l.h, 0);
  const topLayer = layers[layers.length - 1];

  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      {layers.map((l, i) => {
        const baseColor = i === 0 ? '#0E0E11' : i === 1 ? '#121215' : '#16161A';
        return (
          <mesh key={i} position={[l.offsetX ?? 0, l.y, l.offsetZ ?? 0]} castShadow rotation={[0, l.rotY, 0]}>
            <boxGeometry args={[l.w, l.h, l.d]} />
            <LavaGlowMaterial baseColor={baseColor} totalHeight={totalH} />
          </mesh>
        );
      })}
      <mesh position={[0, totalH + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[topLayer.w * 0.5, 12]} />
        <meshBasicMaterial color="#FF7700" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, totalH + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[topLayer.w * 0.35, topLayer.w * 0.55, 12]} />
        <meshBasicMaterial color="#FF4400" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {cascades.map((c, i) => (
        <LavaCascadeMesh key={`c-${i}`} c={c} layers={layers} />
      ))}
      <pointLight position={[0, totalH + 1.5, 0]} intensity={3} color="#FF6600" distance={22} decay={2} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════
   TYPE 3: SPIKE — asymmetric offset layers, capped offsets
   ══════════════════════════════════════════════════════════ */
function VolcanoSpike({ x, z, rotY, layers, cascades }: {
  x: number; z: number; rotY: number; layers: VolcanoLayer[]; cascades: LavaCascade[];
}) {
  const totalH = layers.reduce((a, l) => a + l.h, 0);
  const topLayer = layers[layers.length - 1];

  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      {layers.map((l, i) => {
        const baseColor = i % 3 === 0 ? '#0E0E11' : i % 3 === 1 ? '#121215' : '#0E0E11';
        return (
          <mesh key={i} position={[l.offsetX ?? 0, l.y, l.offsetZ ?? 0]} castShadow rotation={[0, l.rotY, 0]}>
            <boxGeometry args={[l.w, l.h, l.d]} />
            <LavaGlowMaterial baseColor={baseColor} totalHeight={totalH} />
          </mesh>
        );
      })}
      {layers.slice(1).filter((_, i) => i % 2 === 0).map((l, i) => (
        <mesh key={`cr-${i}`}
          position={[(l.offsetX ?? 0) + (i % 2 === 0 ? 1 : -1) * l.w * 0.25, l.y + l.h / 2, l.offsetZ ?? 0]}
          rotation={[0, l.rotY + i, Math.PI / 4 * (i % 2 === 0 ? 1 : -1)]}
        >
          <boxGeometry args={[0.25, l.h * 1.2, 0.15]} />
          <meshBasicMaterial color="#FF6600" transparent opacity={0.6} />
        </mesh>
      ))}
      <mesh position={[0, totalH + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[topLayer.w * 0.4, 6]} />
        <meshBasicMaterial color="#FF5500" transparent opacity={0.75} />
      </mesh>
      {cascades.map((c, i) => (
        <LavaCascadeMesh key={`c-${i}`} c={c} layers={layers} />
      ))}
      <pointLight position={[0, totalH + 2.5, 0]} intensity={3} color="#FF5500" distance={25} decay={2} />
    </group>
  );
}

/* ── Layer generators with fixed floating-block issue ── */

function clampOffset(offset: number, blockW: number): number {
  return Math.max(-blockW * 0.35, Math.min(blockW * 0.35, offset));
}

function generateCliffLayers(seed: number): { layers: VolcanoLayer[]; cascades: LavaCascade[] } {
  const rand = seededVolcano(seed);
  const layers: VolcanoLayer[] = [];
  const count = 8 + Math.floor(rand() * 3);
  let y = 0;
  let w = 10 + rand() * 3;
  let d = 9 + rand() * 3;
  for (let i = 0; i < count; i++) {
    const h = 2.0 + rand() * 1.0;
    const shrinkW = 0.6 + rand() * 0.6;
    const shrinkD = 0.6 + rand() * 0.6;
    const overhang = rand() > 0.75 && i > 1;
    const prevW = i > 0 ? layers[i - 1].w : w + 2;
    const prevD = i > 0 ? layers[i - 1].d : d + 2;
    // Overhang capped so it never exceeds the layer below
    const maxOverhangW = Math.max(prevW - 0.5, w);
    const maxOverhangD = Math.max(prevD - 0.5, d);
    const actualW = overhang ? Math.min(w + 1 + rand() * 1.5, maxOverhangW) : w;
    const actualD = overhang ? Math.min(d + 1 + rand() * 1.5, maxOverhangD) : d;
    // Offset capped so block never hangs more than 35% beyond its own width
    const ox = clampOffset((rand() - 0.5) * 1.5, actualW);
    const oz = clampOffset((rand() - 0.5) * 1.5, actualD);
    layers.push({ y: y + h / 2, w: actualW, d: actualD, h, rotY: (rand() - 0.5) * 0.1, offsetX: ox, offsetZ: oz });
    y += h;
    w = (overhang ? w : actualW) - shrinkW;
    d = (overhang ? d : actualD) - shrinkD;
    if (w < 3) w = 3 + rand();
    if (d < 3) d = 3 + rand();
  }
  const cascades: LavaCascade[] = [];
  for (const a of [0, 1.5, 3.0, 4.8]) {
    if (rand() > 0.3) cascades.push({ angle: a + (rand() - 0.5) * 0.4, w: 0.3 + rand() * 0.4, startLayer: Math.floor(rand() * 2) + 1 });
  }
  return { layers, cascades };
}

function generateShieldLayers(seed: number): { layers: VolcanoLayer[]; cascades: LavaCascade[] } {
  const rand = seededVolcano(seed);
  const layers: VolcanoLayer[] = [];
  const count = 3 + Math.floor(rand() * 2);
  let y = 0;
  let w = 20 + rand() * 8;
  let d = 19 + rand() * 8;
  for (let i = 0; i < count; i++) {
    const h = 5 + rand() * 4;
    const ox = clampOffset((rand() - 0.5) * 2, w);
    const oz = clampOffset((rand() - 0.5) * 2, d);
    layers.push({ y: y + h / 2, w, d, h, rotY: (rand() - 0.5) * 0.08, offsetX: ox, offsetZ: oz });
    y += h;
    w -= 3 + rand() * 3; d -= 3 + rand() * 3;
    if (w < 6) w = 6 + rand() * 2; if (d < 6) d = 6 + rand() * 2;
  }
  const cascades: LavaCascade[] = [];
  for (const a of [0.3, 1.8, 3.5, 5.2]) {
    if (rand() > 0.4) cascades.push({ angle: a + (rand() - 0.5) * 0.3, w: 0.6 + rand() * 0.5, startLayer: Math.floor(rand() * 2) });
  }
  return { layers, cascades };
}

function generateSpikeLayers(seed: number): { layers: VolcanoLayer[]; cascades: LavaCascade[] } {
  const rand = seededVolcano(seed);
  const layers: VolcanoLayer[] = [];
  const count = 5 + Math.floor(rand() * 3);
  let y = 0;
  let w = 8 + rand() * 4;
  let d = 7 + rand() * 4;
  for (let i = 0; i < count; i++) {
    const h = 3 + rand() * 2.5;
    const side = Math.floor(rand() * 4);
    const offsetAmt = Math.min(1.5 + rand() * 2, w * 0.35);
    const ox = side === 0 ? offsetAmt : side === 1 ? -offsetAmt : clampOffset((rand() - 0.5) * 2, w);
    const oz = side === 2 ? offsetAmt : side === 3 ? -offsetAmt : clampOffset((rand() - 0.5) * 2, d);
    layers.push({ y: y + h / 2, w, d, h, rotY: (rand() - 0.5) * 0.25, offsetX: ox, offsetZ: oz });
    y += h;
    w -= 0.5 + rand() * 1.0; d -= 0.5 + rand() * 1.0;
    if (w < 2.5) w = 2.5 + rand(); if (d < 2.5) d = 2.5 + rand();
  }
  const cascades: LavaCascade[] = [];
  for (const a of [0.5, 2.2, 4.0, 5.8]) {
    if (rand() > 0.35) cascades.push({ angle: a + (rand() - 0.5) * 0.5, w: 0.25 + rand() * 0.35, startLayer: Math.floor(rand() * 3) + 1 });
  }
  return { layers, cascades };
}

function generateSmallMound(seed: number): { layers: VolcanoLayer[] } {
  const rand = seededVolcano(seed);
  const layers: VolcanoLayer[] = [];
  const count = 2 + Math.floor(rand() * 2);
  let y = 0;
  let w = 4 + rand() * 4;
  let d = 3.5 + rand() * 4;
  for (let i = 0; i < count; i++) {
    const h = 1.5 + rand() * 2;
    const ox = clampOffset((rand() - 0.5) * 1, w);
    const oz = clampOffset((rand() - 0.5) * 1, d);
    layers.push({ y: y + h / 2, w, d, h, rotY: (rand() - 0.5) * 0.15, offsetX: ox, offsetZ: oz });
    y += h;
    w -= 0.8 + rand() * 1; d -= 0.8 + rand() * 1;
    if (w < 2) w = 2 + rand(); if (d < 2) d = 2 + rand();
  }
  return { layers };
}

/* ── Small mound component ── */
function MoundSmall({ x, z, rotY, layers }: {
  x: number; z: number; rotY: number; layers: VolcanoLayer[];
}) {
  const totalH = layers.reduce((a, l) => a + l.h, 0);
  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      {layers.map((l, i) => {
        const baseColor = i === 0 ? '#121215' : '#16161A';
        return (
          <mesh key={i} position={[l.offsetX ?? 0, l.y, l.offsetZ ?? 0]} castShadow rotation={[0, l.rotY, 0]}>
            <boxGeometry args={[l.w, l.h, l.d]} />
            <LavaGlowMaterial baseColor={baseColor} totalHeight={totalH} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════
   SPIRE — tall narrow pillar, stacked blocks tapering to a point
   ══════════════════════════════════════════════════════════ */
function VolcanoSpire({ x, z, rotY, layers }: {
  x: number; z: number; rotY: number; layers: VolcanoLayer[];
}) {
  const totalH = layers.reduce((a, l) => a + l.h, 0);
  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      {layers.map((l, i) => {
        const baseColor = i < layers.length * 0.4 ? '#0E0E11' : '#121215';
        return (
          <mesh key={i} position={[l.offsetX ?? 0, l.y, l.offsetZ ?? 0]} castShadow rotation={[0, l.rotY, 0]}>
            <boxGeometry args={[l.w, l.h, l.d]} />
            <LavaGlowMaterial baseColor={baseColor} totalHeight={totalH} />
          </mesh>
        );
      })}
      {/* Tiny lava glow at peak */}
      <mesh position={[0, totalH + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[layers[layers.length - 1].w * 0.6, 6]} />
        <meshBasicMaterial color="#FF5500" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function generateSpireLayers(seed: number): VolcanoLayer[] {
  const rand = seededVolcano(seed);
  const layers: VolcanoLayer[] = [];
  const count = 6 + Math.floor(rand() * 4);
  let y = 0;
  let w = 2.5 + rand() * 2;
  let d = 2.5 + rand() * 2;
  for (let i = 0; i < count; i++) {
    const h = 2 + rand() * 3;
    const ox = clampOffset((rand() - 0.5) * 0.8, w);
    const oz = clampOffset((rand() - 0.5) * 0.8, d);
    layers.push({ y: y + h / 2, w, d, h, rotY: (rand() - 0.5) * 0.12, offsetX: ox, offsetZ: oz });
    y += h;
    w -= 0.2 + rand() * 0.3;
    d -= 0.2 + rand() * 0.3;
    if (w < 0.8) w = 0.8 + rand() * 0.3;
    if (d < 0.8) d = 0.8 + rand() * 0.3;
  }
  return layers;
}

/* ══════════════════════════════════════════════════════════
   CROSSING MOUNTAIN — large mountain that overlaps the wall
   ══════════════════════════════════════════════════════════ */
function CrossingMountain({ x, z, rotY, layers, scale = 0.55 }: {
  x: number; z: number; rotY: number; layers: VolcanoLayer[]; scale?: number;
}) {
  const totalH = layers.reduce((a, l) => a + l.h, 0);
  return (
    <group position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]} scale={scale}>
      {layers.map((l, i) => {
        const baseColor = i < 2 ? '#0E0E11' : i < layers.length - 2 ? '#121215' : '#16161A';
        return (
          <mesh key={i} position={[l.offsetX ?? 0, l.y, l.offsetZ ?? 0]} castShadow rotation={[0, l.rotY, 0]}>
            <boxGeometry args={[l.w, l.h, l.d]} />
            <LavaGlowMaterial baseColor={baseColor} totalHeight={totalH} />
          </mesh>
        );
      })}
      <pointLight position={[0, totalH + 1, 0]} intensity={1} color="#FF6600" distance={10} decay={2} />
    </group>
  );
}

/* ── Rocks ── */

interface RockPlacement { x: number; z: number; type: number; scale: number; rotY: number; }

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function getRockPlacements(): RockPlacement[] {
  const rand = seededRandom(42);
  const placements: RockPlacement[] = [];
  const count = 50;
  const minDist = 3.0;
  for (let i = 0; i < count; i++) {
    let x: number, z: number, valid: boolean;
    let attempts = 0;
    do {
      x = (rand() - 0.5) * (ARENA_HALF * 2 - 6);
      z = (rand() - 0.5) * (ARENA_HALF * 2 - 6);
      valid = true;
      if (Math.abs(x) < 3 && Math.abs(z) < 3) { valid = false; continue; }
      for (const p of placements) { const dx = p.x - x, dz = p.z - z; if (dx * dx + dz * dz < minDist * minDist) { valid = false; break; } }
      attempts++;
    } while (!valid && attempts < 50);
    if (valid) placements.push({ x, z, type: Math.floor(rand() * 5), scale: 0.4 + rand() * 0.8, rotY: rand() * Math.PI * 2 });
  }
  return placements;
}

/* ═══ CRACKED LAVA — floating rocks (smaller cells) ═══ */
const rockGlowVert = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vLocalPos = position;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const rockGlowFrag = `
uniform float uScale;
uniform float uCrackWidth;
uniform float uGlowStr;
uniform float uTime;
uniform float uTotalH;
uniform vec3 uPlateColor;
uniform vec3 uCrackColor;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

vec2 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.4 + 0.2 * sin(uTime * 0.15 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  return vec2(sqrt(d1), sqrt(d2));
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

vec2 triplanarUV(vec3 p, vec3 n) {
  vec3 a = abs(n);
  if (a.x >= a.y && a.x >= a.z) return p.yz;
  else if (a.y >= a.x && a.y >= a.z) return p.xz;
  else return p.xy;
}

float voronoiCrack(vec2 uv, out float cellId) {
  vec2 n = floor(uv);
  vec2 f = fract(uv);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 bestCell = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.4 + 0.2 * sin(uTime * 0.15 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; bestCell = n + g; }
      else if (d < d2) { d2 = d; }
    }
  }
  cellId = bestCell.x * 7.31 + bestCell.y * 13.79;
  float edge = d2 - d1;
  float crack = 1.0 - smoothstep(0.0, uCrackWidth, edge);
  return pow(crack, 1.3);
}

void main(){
  vec2 uv = triplanarUV(vLocalPos, vNormal) * uScale;
  vec2 distort = vec2(fbm(uv * 0.5 + 50.0), fbm(uv * 0.5 + 150.0));
  uv += distort * 0.4;

  float cellId;
  float crack = voronoiCrack(uv, cellId) * uGlowStr;

  float cellRand = fract(sin(cellId * 43758.5453) * 43758.5453);
  float cellRand2 = fract(sin(cellId * 12345.6789) * 98765.4321);
  float slowPulse = sin(uTime * (0.6 + cellRand * 0.8) + cellRand2 * 6.2831) * 0.5 + 0.5;
  float fastFlicker = sin(uTime * (2.0 + cellRand * 3.0) + cellRand2 * 10.0) * 0.5 + 0.5;
  float cellBrightness = 0.3 + slowPulse * 0.5 + fastFlicker * 0.2;
  cellBrightness *= 0.5 + cellRand * 0.5;
  crack *= cellBrightness;

  vec3 hotColor = vec3(1.0, 0.85, 0.2);
  vec3 crackCol = mix(uCrackColor, hotColor, crack * 0.6);

  float lavaHeight = uTotalH + 2.0;
  float fromBottom = clamp((lavaHeight - (vWorldPos.y - (-1.0))) / lavaHeight, 0.0, 1.0);
  float verticalGlow = pow(fromBottom, 2.5) * 0.6;
  vec3 lavaLight = vec3(1.0, 0.4, 0.02);

  vec3 col = mix(uPlateColor, crackCol, crack);
  float glowOnCrack = crack * 0.5 + 0.5;
  col += lavaLight * verticalGlow * glowOnCrack;

  // Per-block glow: bottom to top
  float blockHalfH = 0.5;
  float localBottom = clamp((blockHalfH - vLocalPos.y) / (blockHalfH * 2.0), 0.0, 1.0);
  float blockGlow = pow(localBottom, 1.8) * 0.2;
  blockGlow *= 0.7 + 0.3 * sin(uTime * 0.9 + cellRand2 * 5.0);
  vec3 blockGlowColor = vec3(1.0, 0.45, 0.03);
  col += blockGlowColor * blockGlow;

  gl_FragColor = vec4(col, 1.0);
}`;

function LavaRockGlowMaterial({ baseColor, totalHeight }: { baseColor: string; totalHeight: number }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 3.5 },
      uCrackWidth: { value: 0.14 },
      uGlowStr: { value: 1.3 },
      uTime: { value: 0 },
      uTotalH: { value: totalHeight },
      uPlateColor: { value: new THREE.Color(baseColor) },
      uCrackColor: { value: new THREE.Color('#FF6600') },
    },
    vertexShader: rockGlowVert,
    fragmentShader: rockGlowFrag,
  }), [baseColor, totalHeight]);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return <primitive object={mat} attach="material" />;
}

function LavaRock({ x, z, type, scale, rotY }: RockPlacement) {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.3 + Math.random() * 0.5, []);
  const bobAmount = useMemo(() => 0.08 + Math.random() * 0.15, []);

  const stoneMat = useMemo(() => createProceduralStoneMaterial({ scale: 1.2, brightness: 0.14 }), []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = LAVA_Y + Math.sin(clock.elapsedTime * speed + phase) * bobAmount;
    }
  });

  const geometry = useMemo(() => {
    const s = scale;
    switch (type) {
      case 0: return <icosahedronGeometry args={[s, 0]} />;
      case 1: return <octahedronGeometry args={[s, 0]} />;
      case 2: return <boxGeometry args={[s * 2, s * 0.6, s * 1.4]} />;
      case 3: return <coneGeometry args={[s * 0.6, s * 2.5, 5]} />;
      case 4: return <dodecahedronGeometry args={[s, 0]} />;
      default: return <icosahedronGeometry args={[s, 0]} />;
    }
  }, [type, scale]);
  return (
    <group ref={groupRef} position={[x, LAVA_Y, z]} rotation={[0, rotY, 0]}>
      <mesh castShadow>{geometry}<primitive object={stoneMat} attach="material" /></mesh>
    </group>
  );
}

export function Arena({ children }: { children: React.ReactNode }) {
  const rocks = useMemo(() => getRockPlacements(), []);

  // Big volcanoes (3 types × multiple instances)
  const cliff1 = useMemo(() => generateCliffLayers(100), []);
  const cliff2 = useMemo(() => generateCliffLayers(200), []);
  const cliff3 = useMemo(() => generateCliffLayers(250), []);
  const shield1 = useMemo(() => generateShieldLayers(300), []);
  const shield2 = useMemo(() => generateShieldLayers(400), []);
  const shield3 = useMemo(() => generateShieldLayers(450), []);
  const spike1 = useMemo(() => generateSpikeLayers(500), []);
  const spike2 = useMemo(() => generateSpikeLayers(600), []);
  const spike3 = useMemo(() => generateSpikeLayers(700), []);
  const spike4 = useMemo(() => generateSpikeLayers(750), []);

  const crossing1 = useMemo(() => generateCliffLayers(1200), []);
  const crossing2 = useMemo(() => generateCliffLayers(1300), []);
  const crossing3 = useMemo(() => generateCliffLayers(1400), []);
  const crossing4 = useMemo(() => generateCliffLayers(1500), []);
  const crossing5 = useMemo(() => generateSpikeLayers(1600), []);
  const crossing6 = useMemo(() => generateSpikeLayers(1700), []);

  // Spires — ALL behind the walls (outside arena, |x| or |z| > 25)
  const spires = useMemo(() => {
    const rand = seededRandom(1100);
    const positions = [
      // Behind left wall
      { x: -34, z: -10 }, { x: -36, z: 0 }, { x: -34, z: 10 },
      { x: -38, z: -18 }, { x: -40, z: -6 }, { x: -38, z: 6 }, { x: -40, z: 18 },
      // Behind right wall
      { x: 34, z: -10 }, { x: 36, z: 0 }, { x: 34, z: 10 },
      { x: 38, z: -18 }, { x: 40, z: -6 }, { x: 38, z: 6 }, { x: 40, z: 18 },
      // Behind front wall
      { x: -10, z: -34 }, { x: 0, z: -36 }, { x: 10, z: -34 },
      { x: -18, z: -38 }, { x: -6, z: -40 }, { x: 6, z: -38 }, { x: 18, z: -40 },
      // Behind back wall
      { x: -10, z: 34 }, { x: 0, z: 36 }, { x: 10, z: 34 },
      { x: -18, z: 38 }, { x: -6, z: 40 }, { x: 6, z: 38 }, { x: 18, z: 40 },
      // Far outer ring — deep background
      { x: -42, z: -12 }, { x: -44, z: 0 }, { x: -42, z: 12 },
      { x: 42, z: -12 }, { x: 44, z: 0 }, { x: 42, z: 12 },
      { x: -12, z: -42 }, { x: 0, z: -44 }, { x: 12, z: -42 },
      { x: -12, z: 42 }, { x: 0, z: 44 }, { x: 12, z: 42 },
      // Corners far
      { x: -35, z: -35 }, { x: 35, z: -35 }, { x: -35, z: 35 }, { x: 35, z: 35 },
      { x: -40, z: -28 }, { x: 40, z: -28 }, { x: -40, z: 28 }, { x: 40, z: 28 },
      { x: -28, z: -40 }, { x: 28, z: -40 }, { x: -28, z: 40 }, { x: 28, z: 40 },
    ];
    return positions.map((p, i) => ({
      x: p.x + (rand() - 0.5) * 4,
      z: p.z + (rand() - 0.5) * 4,
      rotY: rand() * Math.PI * 2,
      layers: generateSpireLayers(1100 + i * 53),
    }));
  }, []);

  // Small mounds — ALL behind walls (outside arena)
  const mounds = useMemo(() => {
    const rand = seededRandom(900);
    return Array.from({ length: 14 }, (_, i) => ({
      data: generateSmallMound(900 + i * 37),
      x: 30 + rand() * 14,
      z: (rand() - 0.5) * 50,
      rotY: rand() * Math.PI * 2,
    }));
  }, []);
  const mounds2 = useMemo(() => {
    const rand = seededRandom(950);
    return Array.from({ length: 14 }, (_, i) => ({
      data: generateSmallMound(950 + i * 41),
      x: -(30 + rand() * 14),
      z: (rand() - 0.5) * 50,
      rotY: rand() * Math.PI * 2,
    }));
  }, []);
  const mounds3 = useMemo(() => {
    const rand = seededRandom(1000);
    return Array.from({ length: 14 }, (_, i) => ({
      data: generateSmallMound(1000 + i * 43),
      x: (rand() - 0.5) * 50,
      z: 30 + rand() * 14,
      rotY: rand() * Math.PI * 2,
    }));
  }, []);
  const mounds4 = useMemo(() => {
    const rand = seededRandom(1050);
    return Array.from({ length: 14 }, (_, i) => ({
      data: generateSmallMound(1050 + i * 47),
      x: (rand() - 0.5) * 50,
      z: -(30 + rand() * 14),
      rotY: rand() * Math.PI * 2,
    }));
  }, []);

  return (
    <group>
      <LavaSurface />

      {/* Perimeter walls */}
      <RockWall x={0} z={-ARENA_HALF} rotY={0} scaleX={6.5} height={5} />
      <RockWall x={0} z={ARENA_HALF} rotY={Math.PI} scaleX={6.5} height={5} />
      <RockWall x={-ARENA_HALF} z={0} rotY={Math.PI / 2} scaleX={6.5} height={5} />
      <RockWall x={ARENA_HALF} z={0} rotY={-Math.PI / 2} scaleX={6.5} height={5} />
      {/* Corner walls — fill the diagonal gaps */}
      <RockWall x={-15} z={-17} rotY={Math.PI / 4} scaleX={2} height={4} />
      <RockWall x={15} z={-17} rotY={-Math.PI / 4} scaleX={2} height={4} />
      <RockWall x={-15} z={17} rotY={Math.PI * 3 / 4} scaleX={2} height={4} />
      <RockWall x={15} z={17} rotY={-Math.PI * 3 / 4} scaleX={2} height={4} />
      <RockWall x={-18} z={-14} rotY={Math.PI / 3} scaleX={1.5} height={3.5} />
      <RockWall x={18} z={-14} rotY={-Math.PI / 3} scaleX={1.5} height={3.5} />
      <RockWall x={-18} z={14} rotY={Math.PI * 2 / 3} scaleX={1.5} height={3.5} />
      <RockWall x={18} z={14} rotY={-Math.PI * 2 / 3} scaleX={1.5} height={3.5} />

      {/* ═══ CLIFF volcanoes (tall, stepped) ═══ */}
      <VolcanoCliff x={-34} z={-30} rotY={0.3} layers={cliff1.layers} cascades={cliff1.cascades} />
      <VolcanoCliff x={28} z={-32} rotY={-0.4} layers={cliff2.layers} cascades={cliff2.cascades} />
      <VolcanoCliff x={-34} z={18} rotY={0.6} layers={cliff3.layers} cascades={cliff3.cascades} />

      {/* ═══ SHIELD volcanoes (wide, flat) ═══ */}
      <VolcanoShield x={32} z={25} rotY={0.6} layers={shield1.layers} cascades={shield1.cascades} />
      <VolcanoShield x={-25} z={32} rotY={-0.2} layers={shield2.layers} cascades={shield2.cascades} />
      <VolcanoShield x={30} z={-15} rotY={1.0} layers={shield3.layers} cascades={shield3.cascades} />

      {/* ═══ SPIKE volcanoes (asymmetric, offset) ═══ */}
      <VolcanoSpike x={-38} z={5} rotY={0.8} layers={spike1.layers} cascades={spike1.cascades} />
      <VolcanoSpike x={15} z={-35} rotY={-0.5} layers={spike2.layers} cascades={spike2.cascades} />
      <VolcanoSpike x={35} z={-5} rotY={1.2} layers={spike3.layers} cascades={spike3.cascades} />
      <VolcanoSpike x={-15} z={-35} rotY={-0.8} layers={spike4.layers} cascades={spike4.cascades} />

      {/* ═══ Spires (tall narrow pillars) ═══ */}
      {spires.map((s, i) => <VolcanoSpire key={`sp-${i}`} x={s.x} z={s.z} rotY={s.rotY} layers={s.layers} />)}

      {/* ═══ No crossing mountains — all structures behind walls ═══ */}

      {/* ═══ Small mounds — all behind walls ═══ */}
      {mounds.map((m, i) => <MoundSmall key={`ms1-${i}`} x={m.x} z={m.z} rotY={m.rotY} layers={m.data.layers} />)}
      {mounds2.map((m, i) => <MoundSmall key={`ms2-${i}`} x={m.x} z={m.z} rotY={m.rotY} layers={m.data.layers} />)}
      {mounds3.map((m, i) => <MoundSmall key={`ms3-${i}`} x={m.x} z={m.z} rotY={m.rotY} layers={m.data.layers} />)}
      {mounds4.map((m, i) => <MoundSmall key={`ms4-${i}`} x={m.x} z={m.z} rotY={m.rotY} layers={m.data.layers} />)}

      {/* Decorative rocks — half submerged in lava */}
      {rocks.map((r, i) => <LavaRock key={i} {...r} />)}

      {children}
    </group>
  );
}

'use client';
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useLavaStore } from '@/stores/lava.store';
import { characterRigidBody } from '@/shared/refs/characterRef';
import type { LavaPlayer } from '@/games/lava-knowledge/types';
import RobloxAvatar from '@/shared/characters/RobloxAvatar';

const BLOCK_HEIGHT = 0.8;
const LAVA_Y = -1.0;
const AVATAR_FEET_OFFSET = 1.6;
const SINK_SPEED = 1.5;

function getPlatformY(blocks: number): number { return LAVA_Y + blocks * BLOCK_HEIGHT; }
function getAvatarY(blocks: number): number { return getPlatformY(blocks) + AVATAR_FEET_OFFSET; }

/* ═══ CRACKED LAVA MATERIAL — same as Arena walls/mountains ═══ */
const platVert = `
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
const platFrag = `
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

  // Per-block orange glow: bottom to top gradient
  float blockHalfH = 0.5;
  float localBottom = clamp((blockHalfH - vLocalPos.y) / (blockHalfH * 2.0), 0.0, 1.0);
  float blockGlow = pow(localBottom, 1.8) * 0.2;
  blockGlow *= 0.7 + 0.3 * sin(uTime * 0.9 + cellRand2 * 5.0);
  vec3 blockGlowColor = vec3(1.0, 0.45, 0.03);
  col += blockGlowColor * blockGlow;

  gl_FragColor = vec4(col, 1.0);
}`;

function PlatformGlowMaterial({ baseColor, totalHeight }: { baseColor: string; totalHeight: number }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1.5 },
      uCrackWidth: { value: 0.18 },
      uGlowStr: { value: 1.3 },
      uTime: { value: 0 },
      uTotalH: { value: totalHeight },
      uPlateColor: { value: new THREE.Color(baseColor) },
      uCrackColor: { value: new THREE.Color('#FF6600') },
    },
    vertexShader: platVert,
    fragmentShader: platFrag,
  }), [baseColor, totalHeight]);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return <primitive object={mat} attach="material" />;
}

function PlayerAnchor({ player, sinkY }: { player: LavaPlayer; sinkY: number }) {
  const rb = useRef<any>(null);
  useFrame(() => {
    if (!rb.current) return;
    const y = player.eliminated ? sinkY : getAvatarY(player.blocks);
    rb.current.setTranslation({ x: 0, y, z: 0 }, true);
    if (!characterRigidBody.current) characterRigidBody.current = rb.current;
  });
  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={[0, getAvatarY(player.blocks), 0]}>
      <CuboidCollider args={[0.3, 1.2, 0.3]} sensor />
    </RigidBody>
  );
}

function SmokeParticle({ origin, delay }: { origin: [number, number, number]; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const elapsed = useRef(-delay);
  const drift = useRef((Math.random() - 0.5) * 3);
  const driftZ = useRef((Math.random() - 0.5) * 3);

  useFrame((_, dt) => {
    if (!ref.current) return;
    elapsed.current += dt;
    if (elapsed.current < 0) { ref.current.visible = false; return; }
    ref.current.visible = true;
    const t = elapsed.current;
    const life = 2.5;
    const progress = Math.min(t / life, 1);
    ref.current.position.x = origin[0] + drift.current * progress;
    ref.current.position.y = origin[1] + progress * 5;
    ref.current.position.z = origin[2] + driftZ.current * progress;
    ref.current.scale.setScalar(0.2 + progress * 1.8);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.5;
    if (progress >= 1) elapsed.current = -delay;
  });

  return (
    <mesh ref={ref} position={origin}>
      <sphereGeometry args={[0.3, 5, 5]} />
      <meshBasicMaterial color="#777" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

function SinkingSmoke({ active, y }: { active: boolean; y: number }) {
  if (!active) return null;
  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      key: i,
      origin: [(Math.random() - 0.5) * 4, y, (Math.random() - 0.5) * 4] as [number, number, number],
      delay: i * 0.12,
    })), [active, y]);
  return <group>{particles.map((p) => <SmokeParticle key={p.key} origin={p.origin} delay={p.delay} />)}</group>;
}

function LavaEmbers() {
  const ptsRef = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const a = new Float32Array(15 * 3);
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.random() * 1.2;
      a[i * 3] = Math.cos(angle) * r;
      a[i * 3 + 1] = Math.random() * 1.5;
      a[i * 3 + 2] = Math.sin(angle) * r;
    }
    return a;
  }, []);

  useFrame((_, dt) => {
    if (!ptsRef.current) return;
    const p = ptsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 15; i++) {
      p[i * 3 + 1] += dt * (0.4 + Math.random() * 0.6);
      if (p[i * 3 + 1] > 2) {
        p[i * 3 + 1] = 0;
        const angle = Math.random() * Math.PI * 2;
        const r = 2.2 + Math.random() * 1.2;
        p[i * 3] = Math.cos(angle) * r;
        p[i * 3 + 2] = Math.sin(angle) * r;
      }
    }
    ptsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#FFAA33" size={0.12} transparent opacity={0.6} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function PlayerTowers() {
  const player = useLavaStore((s) => s.players[0]);
  if (!player) return null;
  return (
    <group>
      <RockPlatform player={player} />
    </group>
  );
}

function RockPlatform({ player }: { player: LavaPlayer }) {
  const groupRef = useRef<THREE.Group>(null);
  const smoothY = useRef(getPlatformY(player.blocks));
  const sinkY = useRef(getPlatformY(player.blocks));
  const [sinkingDone, setSinkingDone] = useState(false);

  useFrame((_, dt) => {
    const targetY = player.eliminated ? LAVA_Y - 3 : getPlatformY(player.blocks);

    if (player.eliminated) {
      sinkY.current += (targetY - sinkY.current) * Math.min(dt * SINK_SPEED, 1);
      if (groupRef.current) groupRef.current.position.y = sinkY.current;
      if (sinkY.current < LAVA_Y - 2 && !sinkingDone) setSinkingDone(true);
    } else {
      const diff = targetY - smoothY.current;
      if (Math.abs(diff) > 0.005) smoothY.current += diff * Math.min(dt * 4, 1);
      if (groupRef.current) groupRef.current.position.y = smoothY.current;
      sinkY.current = smoothY.current;
      setSinkingDone(false);
    }
  });

  const topSurfaceY = 0;

  return (
    <group>
      <RigidBody type="fixed">
        <CuboidCollider args={[2, 0.4, 2]} />
      </RigidBody>

      <group ref={groupRef} position={[0, smoothY.current, 0]}>
        {/* Main rock body — top at Y=0, extends 2.0 below (emerges from lava) */}
        <mesh castShadow receiveShadow position={[0, -1.0, 0]}>
          <cylinderGeometry args={[1.8, 2.4, 2.0, 12]} />
          <PlatformGlowMaterial baseColor="#121215" totalHeight={2.5} />
        </mesh>

        {/* Top surface — flat disc for standing */}
        <mesh position={[0, topSurfaceY + 0.04, 0]} castShadow>
          <cylinderGeometry args={[1.7, 1.8, 0.08, 12]} />
          <PlatformGlowMaterial baseColor="#121215" totalHeight={2.5} />
        </mesh>

        {/* Bottom widening — sits IN the lava */}
        <mesh position={[0, -1.9, 0]}>
          <cylinderGeometry args={[2.5, 2.0, 0.5, 12]} />
          <PlatformGlowMaterial baseColor="#0E0E11" totalHeight={2.5} />
        </mesh>

        {/* Warm point light at base */}
        <pointLight position={[0, -0.5, 0]} intensity={3} color="#FF6600" distance={6} decay={2} />

        {/* Lava embers */}
        <LavaEmbers />

        {/* Player avatar */}
        {!sinkingDone && (
          <group position={[0, topSurfaceY + AVATAR_FEET_OFFSET, 0]} frustumCulled={false}>
            <RobloxAvatar envTint="#FF6600" envTintIntensity={0.25} />
          </group>
        )}
      </group>

      <SinkingSmoke active={player.eliminated && !sinkingDone} y={smoothY.current} />
      <PlayerAnchor player={player} sinkY={sinkY.current} />
    </group>
  );
}

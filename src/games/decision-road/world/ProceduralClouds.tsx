'use client';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/stores/game.store';

const CHUNK_SIZE = 80;
const EXTEND_CHUNKS = 3;
const CLOUDS_PER_CHUNK = 4;

const cloudVert = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const cloudFrag = `
uniform float uTime;
uniform float uDensity;
uniform float uSoftness;
uniform float uScale;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = vUv * 2.0 - 1.0;

  float mask = 1.0 - smoothstep(0.2, 1.15, length(uv * vec2(0.35, 1.0)));

  vec2 q = vec2(fbm(uv * uScale + uTime * 0.018), fbm(uv * uScale + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(uv * uScale * 1.4 + q * 1.6 + uTime * 0.013 + vec2(1.7, 9.2)),
                fbm(uv * uScale * 1.4 + q * 1.6 + uTime * 0.01 + vec2(8.3, 2.8)));
  float f = fbm(uv * uScale * 2.0 + r * 1.3);

  float cloud = smoothstep(uSoftness, uSoftness + 0.45, f) * mask;

  float detail = fbm(uv * uScale * 3.5 + r * 1.8 + uTime * 0.008);
  cloud *= 0.65 + detail * 0.35;

  vec3 white = vec3(1.0, 1.0, 1.0);
  vec3 grey = vec3(0.72, 0.76, 0.8);
  vec3 col = mix(grey, white, cloud);

  float alpha = cloud * uDensity;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(col, alpha);
}`;

interface CloudData {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  speed: number;
  seed: number;
  density: number;
  softness: number;
  scale: number;
}

const VARIANTS = [
  { density: 0.9, softness: 0.28, scale: 1.0, sxMin: 2.5, sxMax: 4.0, syMin: 0.8, syMax: 1.2 },
  { density: 0.7, softness: 0.35, scale: 1.3, sxMin: 3.5, sxMax: 5.5, syMin: 0.5, syMax: 0.8 },
  { density: 0.8, softness: 0.32, scale: 0.8, sxMin: 4.0, sxMax: 6.0, syMin: 0.35, syMax: 0.6 },
  { density: 0.95, softness: 0.25, scale: 1.4, sxMin: 1.8, sxMax: 2.8, syMin: 0.8, syMax: 1.3 },
  { density: 0.75, softness: 0.3, scale: 0.9, sxMin: 3.0, sxMax: 5.0, syMin: 0.9, syMax: 1.4 },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function generateChunkClouds(chunkZ: number, chunkIndex: number): CloudData[] {
  const clouds: CloudData[] = [];
  for (let i = 0; i < CLOUDS_PER_CHUNK; i++) {
    const seed = chunkIndex * 1000 + i;
    const v = VARIANTS[Math.floor(seededRandom(seed * 23) * VARIANTS.length)];
    const side = seededRandom(seed * 3) > 0.5 ? 1 : -1;
    clouds.push({
      x: side * (20 + seededRandom(seed * 7) * 55),
      y: 18 + seededRandom(seed * 81) * 30,
      z: chunkZ - seededRandom(seed * 13) * CHUNK_SIZE,
      scaleX: v.sxMin + seededRandom(seed * 41) * (v.sxMax - v.sxMin),
      scaleY: v.syMin + seededRandom(seed * 51) * (v.syMax - v.syMin),
      speed: 0.2 + seededRandom(seed * 101) * 0.5,
      seed: seed * 7.31,
      density: v.density,
      softness: v.softness,
      scale: v.scale,
    });
  }
  return clouds;
}

function CloudUnit({ data }: { data: CloudData }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.x += data.speed * 0.016;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime + data.seed;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDensity: { value: data.density },
    uSoftness: { value: data.softness },
    uScale: { value: data.scale },
  }), [data.density, data.softness, data.scale]);

  return (
    <mesh ref={ref} position={[data.x, data.y, data.z]} scale={[data.scaleX, data.scaleY, 1]} renderOrder={-1}>
      <planeGeometry args={[80, 18, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={cloudVert}
        fragmentShader={cloudFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function ProceduralClouds() {
  const questions = useGameStore((s) => s.questions);
  const START_Z = 12;
  const SPACING = 25;

  const allClouds = useMemo(() => {
    const totalZ = questions.length > 0
      ? START_Z - (questions.length - 1) * SPACING
      : START_Z;
    const frontZ = START_Z + EXTEND_CHUNKS * CHUNK_SIZE;
    const backZ = totalZ - EXTEND_CHUNKS * CHUNK_SIZE;

    const clouds: CloudData[] = [];
    let chunkIdx = 0;
    for (let z = frontZ; z >= backZ; z -= CHUNK_SIZE) {
      clouds.push(...generateChunkClouds(z, chunkIdx));
      chunkIdx++;
    }
    return clouds;
  }, [questions.length]);

  return (
    <group>
      {allClouds.map((c, i) => (
        <CloudUnit key={i} data={c} />
      ))}
    </group>
  );
}

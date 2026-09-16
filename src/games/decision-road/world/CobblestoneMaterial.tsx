'use client';
import * as THREE from 'three';
import { useMemo } from 'react';

const cobbleVert = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const cobbleFrag = `
uniform float uScale;
varying vec2 vUv;
varying vec3 vWorldPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

vec2 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash(n + g) * 0.8 + 0.1;
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  return vec2(sqrt(d1), sqrt(d2));
}

void main(){
  vec2 uv = vWorldPos.xz * uScale;

  // Add slight distortion for organic feel
  uv += vec2(noise(uv * 0.3 + 10.0), noise(uv * 0.3 + 50.0)) * 0.15;

  vec2 v = voronoi(uv);

  // Stone cell ID for per-stone color variation
  vec2 cell = floor(uv);
  float stoneRand = hash(cell);
  float stoneRand2 = hash(cell + 42.0);

  // Grout/gaps between stones
  float edge = v.y - v.x;
  float grout = 1.0 - smoothstep(0.0, 0.15, edge);

  // Stone surface — slight height variation per stone
  float stoneHeight = 0.85 + stoneRand * 0.15;

  // Stone colors — grey/blue-grey range like the reference image
  vec3 stoneBase = vec3(0.52, 0.55, 0.58);
  vec3 stoneVar1 = vec3(0.48, 0.52, 0.56);
  vec3 stoneVar2 = vec3(0.56, 0.58, 0.6);
  vec3 stoneColor = mix(stoneBase, mix(stoneVar1, stoneVar2, stoneRand2), stoneRand);

  // Add subtle noise to stone surface for texture
  float surfNoise = noise(uv * 8.0 + stoneRand * 100.0) * 0.08;
  stoneColor += surfNoise;

  // Grout color — darker
  vec3 groutColor = vec3(0.28, 0.3, 0.32);

  // Combine
  vec3 col = mix(stoneColor * stoneHeight, groutColor, grout * 0.85);

  // Subtle edge highlight on stones
  float edgeHighlight = smoothstep(0.02, 0.08, edge) * (1.0 - smoothstep(0.08, 0.2, edge));
  col += vec3(0.06) * edgeHighlight;

  gl_FragColor = vec4(col, 1.0);
}`;

export function CobblestoneMaterial() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 3.5 },
    },
    vertexShader: cobbleVert,
    fragmentShader: cobbleFrag,
  }), []);

  return <primitive object={mat} attach="material" />;
}

import * as THREE from 'three';

/* ── Shared GLSL procedural volcanic rock ──
   Multi-scale ridged noise + pits + mineral grain for a rough basalt look.
   Optional bottom-up lava glow (world-Y falloff) for walls/mountains.     */

const vertexShader = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vLocalPos = position;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const fragmentShader = /* glsl */ `
uniform float uScale;
uniform float uBrightness;
uniform float uGlowStrength;
uniform float uGlowHeight;
uniform float uGlowBaseY;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vNormal;

float hash31(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i);
  float n100 = hash31(i + vec3(1, 0, 0));
  float n010 = hash31(i + vec3(0, 1, 0));
  float n110 = hash31(i + vec3(1, 1, 0));
  float n001 = hash31(i + vec3(0, 0, 1));
  float n101 = hash31(i + vec3(1, 0, 1));
  float n011 = hash31(i + vec3(0, 1, 1));
  float n111 = hash31(i + vec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm3(vec3 p, int oct) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    v += a * noise3D(p);
    p *= 2.03;
    a *= 0.49;
  }
  return v;
}

float ridged(vec3 p, int oct) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= oct) break;
    float n = noise3D(p);
    v += a * (1.0 - abs(n * 2.0 - 1.0));
    p *= 2.11;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 p = vLocalPos * uScale;

  // Broad basalt plates + medium roughness + fine sharp grain
  float plate = fbm3(p, 5);
  float rough = ridged(p * 2.4 + 3.0, 4);
  float fine = ridged(p * 7.5 + 11.0, 3);
  float micro = fbm3(p * 16.0 + 40.0, 2);

  // Height field — raised areas lighter, crevices darker
  float h = plate * 0.42 + rough * 0.38 + fine * 0.28 + micro * 0.12;
  h = clamp(h, 0.0, 1.0);

  // Deep volcanic pits / vesicles
  float pit = fbm3(p * 5.5 + 80.0, 4);
  float pitMask = smoothstep(0.42, 0.22, pit);

  // Sharp bright mineral speckles (quartz / feldspar flecks)
  float speck = fbm3(p * 22.0 + 55.0, 2);
  float speckMask = smoothstep(0.72, 0.88, speck);
  float grain = hash31(floor(p * 48.0));
  float grainMask = step(0.982, grain);

  // Base albedo — charcoal basalt with cool gray highlights (ref image)
  float v = 0.055 + h * 0.16;
  v -= pitMask * 0.045;
  v += speckMask * 0.14;
  v += grainMask * 0.1;

  // Slight warm iron oxide in mid tones
  float warm = smoothstep(0.35, 0.7, h) * 0.02;

  v = clamp(v, 0.012, uBrightness);

  // Dual-direction lighting for rocky relief
  vec3 n = normalize(vNormal);
  vec3 lightA = normalize(vec3(0.45, 0.85, 0.3));
  vec3 lightB = normalize(vec3(-0.4, 0.2, -0.55));
  float diff = max(dot(n, lightA), 0.0) * 0.45 + max(dot(n, lightB), 0.0) * 0.18 + 0.42;

  // Fake AO in pits
  diff *= 1.0 - pitMask * 0.35;

  vec3 base = vec3(v) * diff;
  base += vec3(warm * 1.4, warm * 0.7, warm * 0.35) * diff;

  // Bottom-up lava glow (walls / mountain bases)
  float glowT = 1.0 - clamp((vWorldPos.y - uGlowBaseY) / max(uGlowHeight, 0.001), 0.0, 1.0);
  glowT = pow(glowT, 1.7);
  // modulate slightly by surface texture so glow sits in crevices too
  float glowNoise = 0.75 + 0.25 * rough;
  vec3 lavaCol = vec3(1.0, 0.32, 0.04);
  base += lavaCol * glowT * uGlowStrength * glowNoise;

  gl_FragColor = vec4(base, 1.0);
}`;

export function createProceduralStoneMaterial(opts?: {
  scale?: number;
  brightness?: number;
  glowStrength?: number;
  glowHeight?: number;
  glowBaseY?: number;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: opts?.scale ?? 1.0 },
      uBrightness: { value: opts?.brightness ?? 0.2 },
      uGlowStrength: { value: opts?.glowStrength ?? 0.0 },
      uGlowHeight: { value: opts?.glowHeight ?? 6.0 },
      uGlowBaseY: { value: opts?.glowBaseY ?? -1.0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.FrontSide,
  });
}

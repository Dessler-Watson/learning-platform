import * as THREE from 'three';

/* ── Shared GLSL procedural dark volcanic stone ──
   Uses 3D noise on world/local position — no UV mapping, no pixelation.
   Outputs near-black surface with fine mineral grain.              */

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
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vNormal;

// ── Hash + noise helpers ──
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

void main() {
  vec3 p = vLocalPos * uScale;

  // Multi-scale noise for rocky surface
  float n1 = fbm3(p, 5);            // broad shape
  float n2 = fbm3(p * 3.7 + 7.0, 4); // medium detail
  float n3 = fbm3(p * 9.0 + 13.0, 3); // fine grain

  // Combine — stays very dark
  float v = 0.07;
  v += (n1 - 0.5) * 0.06;   // ±0.03
  v += (n2 - 0.5) * 0.04;   // ±0.02
  v += (n3 - 0.5) * 0.025;  // ±0.0125

  // Bright mineral speckles
  float speck = fbm3(p * 18.0 + 50.0, 2);
  if (speck > 0.68) v += (speck - 0.68) * 0.35;

  // Tiny bright grains
  float grain = hash31(floor(p * 40.0));
  if (grain > 0.97) v += 0.08;

  // Dark pits
  float pit = fbm3(p * 6.0 + 100.0, 3);
  if (pit < 0.34) v -= (0.34 - pit) * 0.12;

  // Clamp to very dark range
  v = clamp(v, 0.01, uBrightness);

  // Simple lighting — diffuse from directional light
  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
  float diff = max(dot(vNormal, lightDir), 0.0) * 0.4 + 0.6;

  vec3 color = vec3(v) * diff;

  gl_FragColor = vec4(color, 1.0);
}`;

/** Creates a procedural dark stone ShaderMaterial — infinite resolution, no pixelation. */
export function createProceduralStoneMaterial(opts?: {
  scale?: number;
  brightness?: number;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: opts?.scale ?? 1.0 },
      uBrightness: { value: opts?.brightness ?? 0.16 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.FrontSide,
  });
}

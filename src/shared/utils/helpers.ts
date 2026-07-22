import * as THREE from 'three';
export function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
export function simpleNoise2D(x: number, z: number): number {
  return Math.sin(x * 1.8 + z * 1.3) * 0.35 + Math.sin(x * 3.5 + z * 2.7) * 0.2 + Math.cos(x * 5.2 - z * 4.1) * 0.12 + Math.sin(x * 7.0 + z * 6.0) * 0.08;
}
export function createIslandGeometry(radius: number, height: number, radialSegments: number, heightSegments: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.25, height, radialSegments, heightSegments, false);
  geo.translate(0, -height / 2, 0);
  const pos = geo.attributes.position;
  const vertCount = pos.count;
  const topY = height;
  const bottomY = 0;
  const noiseThreshold = topY - height * 0.25;
  for (let i = 0; i < vertCount; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y > noiseThreshold) { const factor = (y - noiseThreshold) / (topY - noiseThreshold); const noise = simpleNoise2D(x, z) * 0.6 * factor; pos.setXYZ(i, x, y + noise, z); }
    const angle = Math.atan2(z, x);
    const irregularity = 1 + Math.sin(angle * 3 + 1.2) * 0.06 + Math.cos(angle * 5 - 0.8) * 0.04 + Math.sin(angle * 7 + 2.5) * 0.03;
    pos.setXYZ(i, x * irregularity, y, z * irregularity);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

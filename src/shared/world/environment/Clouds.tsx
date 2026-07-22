'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
const CLOUDS = Array.from({ length: 20 }, () => ({ x: (Math.random() - 0.5) * 130, y: 16 + Math.random() * 20, z: Math.random() * 510 - 430, s: 5 + Math.random() * 4, spd: 0.03 + Math.random() * 0.07, flat: 0.3 + Math.random() * 0.3, wide: 1.4 + Math.random() * 0.8 }));
function noise(x: number, y: number, z: number) { return Math.sin(x * 3.7 + y * 2.1) * 0.14 + Math.cos(z * 3.2 + x * 1.8) * 0.11 + Math.sin(y * 4.5 + z * 2.7) * 0.09 + Math.cos(x * 5.8 - y * 4.1) * 0.07 + Math.sin(z * 6.1 + x * 3.4) * 0.05 + Math.cos(y * 7.3 - z * 5.2) * 0.04; }
function cloudGeom(scale: number, flat: number, wide: number) {
  const geo = new THREE.SphereGeometry(1, 14, 10); const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const n = noise(x, y, z); const nx = x * wide, ny = y * flat, nz = z * (wide - 0.2); const len = Math.sqrt(nx * nx + ny * ny + nz * nz); const r = (1 + n) * scale; pos.setXYZ(i, (nx / len) * r, (ny / len) * r, (nz / len) * r); }
  pos.needsUpdate = true; geo.computeVertexNormals(); return geo;
}
function CloudUnit({ x, y, z, s, spd, flat, wide }: typeof CLOUDS[number]) {
  const ref = useRef<THREE.Mesh>(null); const geo = useMemo(() => cloudGeom(s, flat, wide), [s, flat, wide]);
  useFrame((_, dt) => { if (ref.current) { ref.current.position.x += spd * dt; if (ref.current.position.x > 70) ref.current.position.x = -70; } });
  return <mesh ref={ref} position={[x, y, z]} geometry={geo} frustumCulled={false} castShadow={false} receiveShadow={false}><meshBasicMaterial color="#ffffff" transparent opacity={0.75} depthWrite={false} /></mesh>;
}
export function Clouds() { const list = useMemo(() => CLOUDS, []); return <group>{list.map((c, i) => <CloudUnit key={i} {...c} />)}</group>; }

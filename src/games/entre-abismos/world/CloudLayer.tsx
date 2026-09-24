'use client';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface CloudData {
  pos: THREE.Vector3;
  scale: number;
  speed: number;
  bobPhase: number;
}

const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

export function CloudLayer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const upperMeshRef = useRef<THREE.InstancedMesh>(null);

  const clouds = useMemo(() => {
    const data: CloudData[] = [];
    const count = CFG.cloudDensity + 150;
    for (let i = 0; i < count; i++) {
      const x = (sr(i * 2) - 0.5) * 120;
      const z = sr(i * 2 + 1) * 140 - 70;
      const y = CFG.cloudLevel - 2 + (sr(i * 3) - 0.5) * 3;
      const scale = 3 + sr(i * 4) * 5;
      data.push({ pos: new THREE.Vector3(x, y, z), scale, speed: sr(i * 5) * 0.15 + 0.05, bobPhase: sr(i * 6) * Math.PI * 2 });
    }
    return data;
  }, []);

  const upperClouds = useMemo(() => {
    const data: CloudData[] = [];
    for (let i = 0; i < 80; i++) {
      const x = (sr(i * 2 + 3000) - 0.5) * 100;
      const z = sr(i * 2 + 3001) * 120 - 60;
      const y = CFG.cloudLevel + 6 + sr(i * 3 + 3002) * 4;
      const scale = 2 + sr(i * 4 + 3003) * 3.5;
      data.push({ pos: new THREE.Vector3(x, y, z), scale, speed: sr(i * 5 + 3004) * 0.1 + 0.03, bobPhase: sr(i * 6 + 3005) * Math.PI * 2 });
    }
    return data;
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < clouds.length; i++) {
        const dist = Math.abs(sr(i * 8) - 0.5) * 2;
        if (dist > 0.7) tempColor.setRGB(0.92, 0.93, 0.96);
        else if (dist > 0.4) tempColor.setRGB(0.95, 0.96, 0.98);
        else tempColor.setRGB(1.0, 1.0, 1.0);
        meshRef.current.setColorAt(i, tempColor);
      }
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
    if (upperMeshRef.current) {
      for (let i = 0; i < upperClouds.length; i++) {
        tempColor.setRGB(0.96, 0.97, 1.0);
        upperMeshRef.current.setColorAt(i, tempColor);
      }
      if (upperMeshRef.current.instanceColor) upperMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [clouds, upperClouds]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        dummy.position.set(c.pos.x + Math.sin(time * c.speed + c.bobPhase) * 0.5, c.pos.y + Math.sin(time * 0.2 + c.bobPhase) * 0.3, c.pos.z);
        dummy.scale.setScalar(c.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (upperMeshRef.current) {
      for (let i = 0; i < upperClouds.length; i++) {
        const c = upperClouds[i];
        dummy.position.set(c.pos.x + Math.sin(time * c.speed + c.bobPhase) * 0.3, c.pos.y + Math.sin(time * 0.15 + c.bobPhase) * 0.2, c.pos.z);
        dummy.scale.setScalar(c.scale * 0.8);
        dummy.updateMatrix();
        upperMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      upperMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, clouds.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.45} roughness={1} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={upperMeshRef} args={[undefined, undefined, upperClouds.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 5, 4]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} roughness={1} depthWrite={false} />
      </instancedMesh>
      <mesh position={[0, CFG.cloudLevel - 3.5, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 200]} />
        <meshStandardMaterial color="#e8eef5" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, CFG.cloudLevel + 0.5, -15]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 180]} />
        <meshStandardMaterial color="#f0f4f8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

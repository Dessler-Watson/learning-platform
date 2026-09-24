'use client';
import { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useTierrasStore } from '@/stores/tierras.store';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';
import { createSwampWaterMaterial } from './SwampWaterMaterial';
import { createGoldBrickTexture, createStoneMossTexture, createWoodPlankTexture, createGoldBrickNormal, createStoneMossNormal, createBarkTexture, createLeafTexture, createRockTexture, createRockNormal } from './PlatformTextures';

function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const _platformZones: { x: number; z: number; hw: number; hd: number }[] = [];
(function buildZones() {
  _platformZones.push({ x: 0, z: 2, hw: CFG.startPlatformWidth / 2 + 0.4, hd: CFG.startPlatformDepth / 2 + 0.4 });
  const halfGap = CFG.gapBetweenPlatforms / 2;
  for (let i = 0; i < CFG.questionsPerGame; i++) {
    const pz = -(i + 1) * CFG.platformSpacing;
    _platformZones.push({ x: -halfGap, z: pz, hw: CFG.platformWidth / 2 + 0.4, hd: CFG.platformDepth / 2 + 0.4 });
    _platformZones.push({ x: halfGap, z: pz, hw: CFG.platformWidth / 2 + 0.4, hd: CFG.platformDepth / 2 + 0.4 });
  }
  const finishZ = -(CFG.questionsPerGame + 1) * CFG.platformSpacing - CFG.platformSpacing;
  _platformZones.push({ x: 0, z: finishZ, hw: CFG.finishPlatformWidth / 2 + 0.4, hd: CFG.finishPlatformDepth / 2 + 0.4 });
})();

function isOverPlatform(x: number, z: number): boolean {
  for (const zone of _platformZones) {
    if (Math.abs(x - zone.x) < zone.hw && Math.abs(z - zone.z) < zone.hd) return true;
  }
  return false;
}

interface PlatformProps {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  choice?: 'A' | 'B';
  isStart?: boolean;
  isFinish?: boolean;
  isSinking?: boolean;
  questionIndex?: number;
}

function makeLetterTexture(letter: string, bgColor: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, bgColor + '88');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#ffffff44';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy + size * 0.02);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const letterTextures = {
  A: makeLetterTexture('A', '#cc2222'),
  B: makeLetterTexture('B', '#2288cc'),
};

const sharedTextures = {
  start: createStoneMossTexture(),
  startNormal: createStoneMossNormal(),
  finish: createWoodPlankTexture(),
  goldBrick: createGoldBrickTexture(),
  goldBrickNormal: createGoldBrickNormal(),
  bark: createBarkTexture(),
  leaf: createLeafTexture(),
  rock: createRockTexture(),
  rockNormal: createRockNormal(),
};

function SwampPlatformInner({ position, width, depth, height, choice, isStart, isFinish, isSinking, questionIndex }: PlatformProps) {
  const meshRef = useRef<THREE.Group>(null);
  const rbRef = useRef<RapierRigidBody>(null);
  const sinkStartRef = useRef<number | null>(null);
  const sinkDoneRef = useRef(false);
  const glowRingRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    if (isSinking) {
      if (sinkStartRef.current === null) sinkStartRef.current = performance.now();
      const elapsed = (performance.now() - sinkStartRef.current) / 1000;
      const t = Math.min(elapsed / CFG.platformSinkingDuration, 1);
      meshRef.current.position.y = -t * 6;
      meshRef.current.rotation.x = Math.sin(t * Math.PI) * 0.15 * t;
      if (rbRef.current) {
        rbRef.current.setNextKinematicTranslation({
          x: position[0],
          y: position[1] - t * 6,
          z: position[2],
        });
      }
      if (t >= 1) sinkDoneRef.current = true;
    }
    if (glowRingRef.current && questionIndex !== undefined) {
      const qIndex = useTierrasStore.getState().currentQuestionIndex;
      const nearby = Math.abs(questionIndex - qIndex) <= 2;
      const m = glowRingRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = nearby
        ? 1.5 + Math.sin(performance.now() * 0.003) * 0.5
        : 0.35;
    }
  });

  const rbType = isSinking ? 'kinematicPosition' : 'fixed';

  if (isStart) {
    return (
      <group>
        <RigidBody ref={rbRef} type={rbType} position={position} colliders={false} name="platform-start">
          <CuboidCollider args={[width / 2, height / 2, depth / 2]} />
          <group ref={meshRef}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#5a4a35" roughness={0.85} metalness={0.12} map={sharedTextures.start} normalMap={sharedTextures.startNormal} normalScale={new THREE.Vector2(0.8, 0.8)} />
            </mesh>
            <mesh position={[0, height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[width - 0.15, depth - 0.15]} />
              <meshStandardMaterial color="#5a4a35" roughness={0.85} metalness={0.12} map={sharedTextures.start} normalMap={sharedTextures.startNormal} normalScale={new THREE.Vector2(0.8, 0.8)} transparent opacity={0.92} />
            </mesh>
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[width + 0.6, 0.2, depth + 0.6]} />
              <meshStandardMaterial color="#3a2a18" roughness={0.95} />
            </mesh>
            {Array.from({ length: 8 }).map((_, i) => (
              <mesh key={i} position={[
                (Math.sin(i * 1.3) * width * 0.35),
                height / 2 + 0.03,
                (Math.cos(i * 1.7) * depth * 0.35),
              ]} rotation={[-Math.PI / 2, i * 0.8, 0]}>
                <circleGeometry args={[0.15 + Math.random() * 0.1, 6]} />
                <meshStandardMaterial color="#3a5a2a" roughness={0.95} transparent opacity={0.7} />
              </mesh>
            ))}
          </group>
        </RigidBody>
        <Lantern position={[-width / 2 + 0.5, position[1] + height / 2 + 0.1, depth / 2 - 0.5]} intensity={3.5} />
        <Lantern position={[width / 2 - 0.5, position[1] + height / 2 + 0.1, depth / 2 - 0.5]} intensity={3.5} />
        <pointLight position={[-width / 2 + 0.5, position[1] + 2, depth / 2 - 0.5]} color="#FF9800" intensity={3.5} distance={16} castShadow={false} />
        <pointLight position={[width / 2 - 0.5, position[1] + 2, depth / 2 - 0.5]} color="#FF9800" intensity={3.5} distance={16} castShadow={false} />
        <pointLight position={[0, position[1] + 2, 0]} color="#FFA726" intensity={1} distance={12} />
      </group>
    );
  }

  if (isFinish) {
    return (
      <group>
        <RigidBody ref={rbRef} type={rbType} position={position} colliders={false} name="platform-finish">
          <CuboidCollider args={[width / 2, height / 2, depth / 2]} />
          <group ref={meshRef}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#5a4228" roughness={0.7} metalness={0.2} emissive="#3a2510" emissiveIntensity={0.35} map={sharedTextures.finish} />
            </mesh>
            <mesh position={[0, height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[width - 0.15, depth - 0.15]} />
              <meshStandardMaterial color="#5a4228" roughness={0.65} metalness={0.25} emissive="#3a2510" emissiveIntensity={0.4} map={sharedTextures.finish} transparent opacity={0.92} />
            </mesh>
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh key={`plank-${i}`} position={[
                -width / 2 + 0.5 + i * (width - 1) / 5,
                height / 2 + 0.01,
                0,
              ]} receiveShadow>
                <boxGeometry args={[0.08, 0.04, depth - 0.4]} />
                <meshStandardMaterial color="#3a2510" roughness={0.9} emissive="#2a1a0a" emissiveIntensity={0.15} />
              </mesh>
            ))}
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[width + 0.5, 0.2, depth + 0.5]} />
              <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
            </mesh>
          </group>
        </RigidBody>
        <DockPost position={[position[0] - width / 2 + 0.3, position[1] - 0.5, position[2] - depth / 2 + 0.3]} height={3.5} />
        <DockPost position={[position[0] + width / 2 - 0.3, position[1] - 0.5, position[2] - depth / 2 + 0.3]} height={3.5} />
        <DockPost position={[position[0] - width / 2 + 0.3, position[1] - 0.5, position[2] + depth / 2 - 0.3]} height={3.5} />
        <DockPost position={[position[0] + width / 2 - 0.3, position[1] - 0.5, position[2] + depth / 2 - 0.3]} height={3.5} />
        <group position={[0, height / 2 + 0.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.18, 1.2, 8]} />
            <meshStandardMaterial color="#7a6a45" roughness={0.8} metalness={0.3} emissive="#5a4a25" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <octahedronGeometry args={[0.65, 0]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFC107" emissiveIntensity={6} transparent opacity={0.95} roughness={0.1} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <octahedronGeometry args={[0.85, 0]} />
            <meshStandardMaterial color="#FFEB3B" emissive="#FFD54F" emissiveIntensity={3} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[1.4, 16, 12]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFC107" emissiveIntensity={2} transparent opacity={0.1} side={THREE.BackSide} />
          </mesh>
          <pointLight position={[0, 1.0, 0]} color="#FFD54F" intensity={14} distance={30} />
          <pointLight position={[0, 0.6, 0]} color="#FFC107" intensity={6} distance={18} />
          <pointLight position={[0, 1.5, 0]} color="#FFEB3B" intensity={4} distance={22} />
        </group>
        <pointLight position={[0, position[1] + 2.5, 0]} color="#FF9800" intensity={8} distance={25} />
        <pointLight position={[0, position[1] + 1.0, 0]} color="#FFA726" intensity={6} distance={22} />
        <pointLight position={[-width / 3, position[1] + 1.2, -depth / 3]} color="#FFB74D" intensity={4} distance={16} />
        <pointLight position={[width / 3, position[1] + 1.2, -depth / 3]} color="#FFB74D" intensity={4} distance={16} />
        <pointLight position={[-width / 3, position[1] + 1.2, depth / 3]} color="#FFB74D" intensity={4} distance={16} />
        <pointLight position={[width / 3, position[1] + 1.2, depth / 3]} color="#FFB74D" intensity={4} distance={16} />
        <pointLight position={[0, position[1] + 0.8, -depth / 2 + 0.3]} color="#FFD54F" intensity={5} distance={14} />
        <pointLight position={[0, position[1] + 0.8, depth / 2 - 0.3]} color="#FFD54F" intensity={5} distance={14} />
        <pointLight position={[-width / 2 + 0.3, position[1] + 0.8, 0]} color="#FFD54F" intensity={5} distance={14} />
        <pointLight position={[width / 2 - 0.3, position[1] + 0.8, 0]} color="#FFD54F" intensity={5} distance={14} />
        <Lantern position={[-width / 2 + 0.5, position[1] + height / 2 + 0.1, position[2]]} intensity={7} />
        <Lantern position={[width / 2 - 0.5, position[1] + height / 2 + 0.1, position[2]]} intensity={7} />
      </group>
    );
  }

  const symbolColor = choice === 'A' ? '#cc2222' : '#2288cc';
  const symbolEmissive = choice === 'A' ? '#aa1111' : '#1166aa';
  const rimColor = choice === 'A' ? '#8B0000' : '#0D47A1';

  return (
    <group>
      <RigidBody ref={rbRef} type={rbType} position={position} colliders={false} name={`platform-${choice}`}>
        <CuboidCollider args={[width / 2, height / 2, depth / 2]} />
        <group ref={meshRef}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#8a7535" roughness={0.6} metalness={0.4} emissive="#6a5a25" emissiveIntensity={0.15} map={sharedTextures.goldBrick} normalMap={sharedTextures.goldBrickNormal} />
          </mesh>
          <mesh position={[0, height / 2 + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width - 0.1, depth - 0.1]} />
            <meshStandardMaterial color="#8a7535" roughness={0.6} metalness={0.4} emissive="#6a5a25" emissiveIntensity={0.15} map={sharedTextures.goldBrick} normalMap={sharedTextures.goldBrickNormal} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[width + 0.3, 0.18, depth + 0.3]} />
            <meshStandardMaterial color="#5a4a20" roughness={0.85} metalness={0.2} />
          </mesh>

          <mesh ref={glowRingRef} position={[0, height / 2 + 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.65, 0.95, 48]} />
            <meshStandardMaterial color={rimColor} emissive={symbolEmissive} emissiveIntensity={1.5} side={THREE.DoubleSide} />
          </mesh>

          <mesh position={[0, height / 2 + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.65, 48]} />
            <meshStandardMaterial
              color={symbolColor}
              emissive={symbolEmissive}
              emissiveIntensity={1.2}
              side={THREE.DoubleSide}
              transparent
              opacity={0.7}
            />
          </mesh>

          {choice && (
            <mesh position={[0, height / 2 + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.4, 1.4]} />
              <meshBasicMaterial map={letterTextures[choice]} transparent side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      </RigidBody>
    </group>
  );
}

const SwampPlatform = memo(SwampPlatformInner);

function Lantern({ position, intensity = 2.5 }: { position: [number, number, number]; intensity?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.5, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.9} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.12, 6]} />
        <meshStandardMaterial color="#3E2723" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#FFF8E1" emissive="#FF9800" emissiveIntensity={6} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#FF9800" intensity={intensity} distance={10} />
      <pointLight position={[0, 0.4, 0]} color="#FFA726" intensity={intensity * 0.5} distance={6} />
    </group>
  );
}

function DockPost({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, height, 6]} />
        <meshStandardMaterial color="#3d2b18" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[0, height - 0.1, 0]}>
        <sphereGeometry args={[0.15, 6, 5]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SwampWater() {
  const mat = useMemo(() => createSwampWaterMaterial(), []);
  const underRef = useRef<THREE.Mesh>(null);
  const waterGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    if (underRef.current) {
      const m = underRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.1 + Math.sin(performance.now() * 0.0008) * 0.03;
    }
    if (waterGroupRef.current) {
      waterGroupRef.current.position.z = camera.position.z;
    }
  });

  return (
    <group ref={waterGroupRef}>
      <mesh position={[0, CFG.waterLevel, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 300]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh ref={underRef} position={[0, CFG.waterLevel - 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[84, 304]} />
        <meshBasicMaterial color="#050f08" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <RigidBody type="fixed" position={[0, CFG.waterLevel - 0.5, 0]} colliders={false} name="water-defeat">
        <CuboidCollider args={[40, 1, 150]} sensor />
      </RigidBody>
    </group>
  );
}

function DenseForest() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const darkSphereRef = useRef<THREE.InstancedMesh>(null);
  const greenSphereRef = useRef<THREE.InstancedMesh>(null);
  const lightSphereRef = useRef<THREE.InstancedMesh>(null);
  const darkConeRef = useRef<THREE.InstancedMesh>(null);
  const greenConeRef = useRef<THREE.InstancedMesh>(null);
  const darkCylRef = useRef<THREE.InstancedMesh>(null);
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const geos = useMemo(() => ({
    trunk: new THREE.CylinderGeometry(0.2, 0.4, 5.6, 7),
    sphere: new THREE.SphereGeometry(1, 8, 7),
    cone: new THREE.ConeGeometry(1, 1, 8),
    cyl: new THREE.CylinderGeometry(1.5, 2.0, 3, 6),
    branch: new THREE.CylinderGeometry(0.05, 0.08, 0.8, 5),
  }), []);

  const mats = useMemo(() => ({
    trunk: new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.9, map: sharedTextures.bark, emissive: '#1a0a02', emissiveIntensity: 0.15 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1a5020', roughness: 0.8, map: sharedTextures.leaf, emissive: '#0a2008', emissiveIntensity: 0.1 }),
    green: new THREE.MeshStandardMaterial({ color: '#2a6a2a', roughness: 0.8, map: sharedTextures.leaf, emissive: '#0a2008', emissiveIntensity: 0.1 }),
    light: new THREE.MeshStandardMaterial({ color: '#358035', roughness: 0.8, map: sharedTextures.leaf, emissive: '#0a2808', emissiveIntensity: 0.1 }),
    bark: new THREE.MeshStandardMaterial({ color: '#4a3018', roughness: 0.9, map: sharedTextures.bark, emissive: '#1a0a02', emissiveIntensity: 0.1 }),
  }), []);

  const counts = useMemo(() => {
    const trunks: THREE.Matrix4[] = [];
    const darkSpheres: THREE.Matrix4[] = [];
    const greenSpheres: THREE.Matrix4[] = [];
    const lightSpheres: THREE.Matrix4[] = [];
    const darkCones: THREE.Matrix4[] = [];
    const greenCones: THREE.Matrix4[] = [];
    const darkCyls: THREE.Matrix4[] = [];
    const branchArr: THREE.Matrix4[] = [];

    const dummy = new THREE.Object3D();
    const child = new THREE.Object3D();
    const halfGap = CFG.gapBetweenPlatforms / 2;
    const minX = halfGap + 2.0;
    let sd = 1000;

    for (let z = 50; z > -250; z -= 0.8) {
      for (let side = -1; side <= 1; side += 2) {
        const x = side * (minX + 0.3 + sr(sd++) * 18);
        const sz = 0.5 + sr(sd++) * 1.5;
        const rotY = sr(sd++) * Math.PI * 2;
        const type = Math.floor(sr(sd++) * 4);
        const pz = z + (sr(sd++) - 0.5) * 1.2;

        dummy.position.set(x, 0, pz);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.setScalar(sz);
        dummy.updateMatrix();

        child.position.set(0, 2.8, 0);
        child.scale.set(1, 1, 1);
        child.rotation.set(0, 0, 0);
        child.updateMatrix();
        trunks.push(dummy.matrix.clone().multiply(child.matrix));

        if (type === 0) {
          child.position.set(0, 6.5, 0); child.scale.setScalar(2.2); child.updateMatrix();
          darkSpheres.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(1.0, 5.8, 0.6); child.scale.setScalar(1.4); child.updateMatrix();
          greenSpheres.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(-0.8, 6.0, -0.5); child.scale.setScalar(1.1); child.updateMatrix();
          lightSpheres.push(dummy.matrix.clone().multiply(child.matrix));
        } else if (type === 1) {
          child.position.set(0, 7.5, 0); child.scale.set(2.5, 5, 2.5); child.updateMatrix();
          darkCones.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(0, 5.5, 0); child.scale.set(3.0, 3.5, 3.0); child.updateMatrix();
          greenCones.push(dummy.matrix.clone().multiply(child.matrix));
        } else if (type === 2) {
          child.position.set(0, 6.0, 0); child.scale.setScalar(1.8); child.updateMatrix();
          darkSpheres.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(0.7, 6.8, 0.4); child.scale.setScalar(1.3); child.updateMatrix();
          greenSpheres.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(-0.9, 6.2, -0.4); child.scale.setScalar(1.0); child.updateMatrix();
          lightSpheres.push(dummy.matrix.clone().multiply(child.matrix));
        } else {
          child.position.set(0, 5.5, 0); child.scale.set(1, 1, 1); child.updateMatrix();
          darkCyls.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(0, 7.5, 0); child.scale.setScalar(1.5); child.updateMatrix();
          greenSpheres.push(dummy.matrix.clone().multiply(child.matrix));
        }

        if (sr(sd++) > 0.5) {
          child.position.set(0.3, 0.4, 0.2); child.scale.set(1, 1, 1); child.updateMatrix();
          branchArr.push(dummy.matrix.clone().multiply(child.matrix));
          child.position.set(-0.2, 0.3, -0.3); child.scale.set(1, 0.75, 1); child.updateMatrix();
          branchArr.push(dummy.matrix.clone().multiply(child.matrix));
        }
      }
    }

    return {
      trunkCount: trunks.length, darkSphereCount: darkSpheres.length,
      greenSphereCount: greenSpheres.length, lightSphereCount: lightSpheres.length,
      darkConeCount: darkCones.length, greenConeCount: greenCones.length,
      darkCylCount: darkCyls.length, branchCount: branchArr.length,
      trunks, darkSpheres, greenSpheres, lightSpheres,
      darkCones, greenCones, darkCyls, branches: branchArr,
    };
  }, []);

  useEffect(() => {
    const set = (ref: THREE.InstancedMesh | null, arr: THREE.Matrix4[]) => {
      if (!ref || arr.length === 0) return;
      arr.forEach((m, i) => ref.setMatrixAt(i, m));
      ref.instanceMatrix.needsUpdate = true;
    };
    set(trunkRef.current, counts.trunks);
    set(darkSphereRef.current, counts.darkSpheres);
    set(greenSphereRef.current, counts.greenSpheres);
    set(lightSphereRef.current, counts.lightSpheres);
    set(darkConeRef.current, counts.darkCones);
    set(greenConeRef.current, counts.greenCones);
    set(darkCylRef.current, counts.darkCyls);
    set(branchRef.current, counts.branches);
  }, [counts]);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
        child.frustumCulled = false;
      }
    });
  }, [counts]);

  return (
    <group ref={groupRef}>
      <instancedMesh ref={trunkRef} args={[geos.trunk, mats.trunk, counts.trunkCount]} />
      <instancedMesh ref={darkSphereRef} args={[geos.sphere, mats.dark, counts.darkSphereCount]} />
      <instancedMesh ref={greenSphereRef} args={[geos.sphere, mats.green, counts.greenSphereCount]} />
      <instancedMesh ref={lightSphereRef} args={[geos.sphere, mats.light, counts.lightSphereCount]} />
      <instancedMesh ref={darkConeRef} args={[geos.cone, mats.dark, counts.darkConeCount]} />
      <instancedMesh ref={greenConeRef} args={[geos.cone, mats.green, counts.greenConeCount]} />
      <instancedMesh ref={darkCylRef} args={[geos.cyl, mats.dark, counts.darkCylCount]} />
      <instancedMesh ref={branchRef} args={[geos.branch, mats.bark, counts.branchCount]} />
    </group>
  );
}

function SwampRocks() {
  const rocks = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotY: number; rotX: number; type: number }[] = [];
    const halfGap = CFG.gapBetweenPlatforms / 2;
    let sd = 2000;
    for (let i = 0; i < 80; i++) {
      const side = sr(sd++) > 0.5 ? 1 : -1;
      const x = side * (halfGap * 0.6 + sr(sd++) * 28);
      const z = (sr(sd++) - 0.5) * 280 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, -0.15 + sr(sd++) * 0.25, z],
        scale: 0.25 + sr(sd++) * 1.5,
        rotY: sr(sd++) * Math.PI * 2,
        rotX: (sr(sd++) - 0.5) * 0.4,
        type: Math.floor(sr(sd++) * 3),
      });
    }
    for (let i = 0; i < 25; i++) {
      const x = (sr(sd++) - 0.5) * (halfGap * 1.0);
      const z = (sr(sd++) - 0.5) * 250 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, -0.08, z],
        scale: 0.2 + sr(sd++) * 0.6,
        rotY: sr(sd++) * Math.PI * 2,
        rotX: (sr(sd++) - 0.5) * 0.3,
        type: Math.floor(sr(sd++) * 3),
      });
    }
    return items;
  }, []);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) child.frustumCulled = false;
    });
  }, [rocks]);

  return (
    <group ref={groupRef}>
      {rocks.map((r, i) => (
        <group key={i} position={r.pos} rotation={[r.rotX, r.rotY, r.rotX * 0.5]} scale={r.scale}>
          {r.type === 0 && (
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial color="#3a3a2a" roughness={0.94} metalness={0.04} map={sharedTextures.rock} normalMap={sharedTextures.rockNormal} normalScale={new THREE.Vector2(0.6, 0.6)} />
            </mesh>
          )}
          {r.type === 1 && (
            <>
              <mesh castShadow receiveShadow>
                <dodecahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color="#2d2d1d" roughness={0.94} metalness={0.04} map={sharedTextures.rock} normalMap={sharedTextures.rockNormal} normalScale={new THREE.Vector2(0.6, 0.6)} />
              </mesh>
              <mesh position={[0.25, 0.1, 0.15]} castShadow receiveShadow>
                <icosahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color="#353525" roughness={0.94} metalness={0.04} map={sharedTextures.rock} />
              </mesh>
            </>
          )}
          {r.type === 2 && (
            <>
              <mesh castShadow receiveShadow>
                <octahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial color="#4a4a3a" roughness={0.94} metalness={0.04} map={sharedTextures.rock} normalMap={sharedTextures.rockNormal} normalScale={new THREE.Vector2(0.6, 0.6)} />
              </mesh>
              <mesh position={[-0.2, 0.15, -0.1]} castShadow receiveShadow>
                <dodecahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial color="#2a2a1a" roughness={0.94} metalness={0.04} map={sharedTextures.rock} />
              </mesh>
            </>
          )}
          <mesh position={[0, 0.22, 0]} receiveShadow>
            <sphereGeometry args={[0.32, 5, 4]} />
            <meshStandardMaterial color="#1a3a15" roughness={0.95} transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GoldenRocks() {
  const rocks = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotY: number; type: number }[] = [];
    const halfGap = CFG.gapBetweenPlatforms / 2;
    let sd = 3000;
    for (let i = 0; i < 35; i++) {
      const side = sr(sd++) > 0.5 ? 1 : -1;
      const x = side * (halfGap * 0.5 + sr(sd++) * 22);
      const z = (sr(sd++) - 0.5) * 280 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, -0.15 + sr(sd++) * 0.3, z],
        scale: 0.4 + sr(sd++) * 1.2,
        rotY: sr(sd++) * Math.PI * 2,
        type: Math.floor(sr(sd++) * 4),
      });
    }
    return items;
  }, []);

  return (
    <group>
      {rocks.map((r, i) => (
        <group key={i} position={r.pos} rotation={[0, r.rotY, Math.random() * 0.3]} scale={r.scale}>
          {r.type === 0 && (
            <mesh castShadow>
              <dodecahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial color="#c9a82c" roughness={0.55} metalness={0.6} />
            </mesh>
          )}
          {r.type === 1 && (
            <mesh castShadow>
              <icosahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial color="#d4b63a" roughness={0.5} metalness={0.65} />
            </mesh>
          )}
          {r.type === 2 && (
            <mesh castShadow>
              <octahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial color="#e0c448" roughness={0.45} metalness={0.7} />
            </mesh>
          )}
          {r.type === 3 && (
            <>
              <mesh castShadow position={[0, 0.15, 0]}>
                <coneGeometry args={[0.35, 0.7, 6]} />
                <meshStandardMaterial color="#c9a82c" roughness={0.55} metalness={0.55} />
              </mesh>
              <mesh castShadow position={[0.15, 0, 0.1]}>
                <octahedronGeometry args={[0.22, 0]} />
                <meshStandardMaterial color="#e0c448" roughness={0.5} metalness={0.6} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function PurpleCrystals() {
  const crystals = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotY: number }[] = [];
    const halfGap = CFG.gapBetweenPlatforms / 2;
    let sd = 4000;
    for (let i = 0; i < 50; i++) {
      const side = sr(sd++) > 0.5 ? 1 : -1;
      const x = side * (halfGap + 3 + sr(sd++) * 14);
      const z = (sr(sd++) - 0.5) * 260 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, 0.2 + sr(sd++) * 0.8, z],
        scale: 0.15 + sr(sd++) * 0.55,
        rotY: sr(sd++) * Math.PI * 2,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {crystals.map((c, i) => (
        <group key={i} position={c.pos} rotation={[0, c.rotY, 0]} scale={c.scale}>
          <mesh position={[0, 0.7, 0]} rotation={[0.1, 0, 0.12]}>
            <octahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial
              color="#BA68C8"
              emissive="#9C27B0"
              emissiveIntensity={3}
              transparent
              opacity={0.9}
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[0.18, 0.35, 0.12]} rotation={[0.2, 0.5, 0.18]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial
              color="#CE93D8"
              emissive="#AB47BC"
              emissiveIntensity={2.5}
              transparent
              opacity={0.85}
              roughness={0.1}
              metalness={0.7}
            />
          </mesh>
          <mesh position={[-0.12, 0.25, -0.08]} rotation={[0.3, 0.8, 0.1]}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial
              color="#E1BEE7"
              emissive="#CE93D8"
              emissiveIntensity={2}
              transparent
              opacity={0.8}
              roughness={0.15}
              metalness={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LilyPads() {
  const pads = useMemo(() => {
    const items: { pos: [number, number, number]; rotY: number; scale: number }[] = [];
    const halfGap = CFG.gapBetweenPlatforms / 2;
    let sd = 5000;
    for (let i = 0; i < 35; i++) {
      const x = (sr(sd++) - 0.5) * (halfGap * 1.8);
      const z = (sr(sd++) - 0.5) * 260 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, CFG.waterLevel + 0.015, z],
        rotY: sr(sd++) * Math.PI * 2,
        scale: 0.12 + sr(sd++) * 0.22,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {pads.map((p, i) => (
        <group key={i} position={p.pos} rotation={[-Math.PI / 2, p.rotY, 0]} scale={p.scale}>
          <mesh>
            <circleGeometry args={[1, 12, 0, Math.PI * 1.8]} />
            <meshStandardMaterial color="#1a5a1a" roughness={0.65} side={THREE.DoubleSide} emissive="#0a2a0a" emissiveIntensity={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Fireflies() {
  const count = 80;
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    let sd = 9000;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (sr(sd++) - 0.5) * 50;
      positions[i * 3 + 1] = 0.8 + sr(sd++) * 5;
      positions[i * 3 + 2] = (sr(sd++) - 0.5) * 280 + 0;
      speeds[i] = 0.4 + sr(sd++) * 1.2;
    }
    return { positions, speeds };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * data.speeds[i] + i) * 0.002;
      arr[i * 3 + 1] += Math.cos(t * data.speeds[i] * 0.6 + i * 2) * 0.0015;
      arr[i * 3 + 2] += Math.sin(t * data.speeds[i] * 0.4 + i * 3) * 0.0015;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.18} color="#FFEB3B" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function SwampFog() {
  const fogRef = useRef<THREE.Points>(null);
  const count = 500;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let sd = 8000;
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (sr(sd++) - 0.5) * 70;
      arr[i * 3 + 1] = sr(sd++) * 2.0 + 0.2;
      arr[i * 3 + 2] = (sr(sd++) - 0.5) * 300 + 0;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!fogRef.current) return;
    fogRef.current.rotation.y += 0.0001;
  });

  return (
    <points ref={fogRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={1.5} color="#2a4a3a" transparent opacity={0.15} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function SwampPlants() {
  const plants = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotY: number }[] = [];
    const halfGap = CFG.gapBetweenPlatforms / 2;
    let sd = 6000;
    for (let i = 0; i < 60; i++) {
      const side = sr(sd++) > 0.5 ? 1 : -1;
      const x = side * (halfGap * 0.4 + sr(sd++) * 20);
      const z = (sr(sd++) - 0.5) * 280 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, 0.1, z],
        scale: 0.15 + sr(sd++) * 0.5,
        rotY: sr(sd++) * Math.PI * 2,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {plants.map((p, i) => (
        <group key={i} position={p.pos} rotation={[0, p.rotY, 0]} scale={p.scale}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.1, 0.9, 5]} />
            <meshStandardMaterial color="#1a5a1a" roughness={0.75} />
          </mesh>
          <mesh position={[0.1, 0.3, 0]}>
            <coneGeometry args={[0.07, 0.6, 4]} />
            <meshStandardMaterial color="#2a6a2a" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SwampLogs() {
  const logs = useMemo(() => {
    const items: { pos: [number, number, number]; rotY: number; len: number }[] = [];
    let sd = 7000;
    for (let i = 0; i < 12; i++) {
      const side = sr(sd++) > 0.5 ? 1 : -1;
      const x = side * (2 + sr(sd++) * 18);
      const z = (sr(sd++) - 0.5) * 250 + 0;
      if (isOverPlatform(x, z)) continue;
      items.push({
        pos: [x, -0.08, z],
        rotY: sr(sd++) * Math.PI,
        len: 1 + sr(sd++) * 3,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {logs.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={[0, l.rotY, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, l.len, 6]} />
          <meshStandardMaterial color="#3a2510" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function SideFog({ position, side }: { position: [number, number, number]; side: 1 | -1 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.6 + Math.sin(performance.now() * 0.0005 + position[2] * 0.1) * 0.12;
  });
  return (
    <mesh ref={ref} position={position} rotation={[0, side * Math.PI / 2, 0]}>
      <planeGeometry args={[160, 12]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function FrontFog() {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const fogZ = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const targetZ = camera.position.z - 38;
    if (fogZ.current === null) fogZ.current = targetZ;
    const k = Math.min(1, delta * 1.1);
    fogZ.current += (targetZ - fogZ.current) * k;
    ref.current.position.z = fogZ.current;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 5, 0]}>
        <planeGeometry args={[70, 30]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 5, 10]}>
        <planeGeometry args={[80, 35]} />
        <meshBasicMaterial color="#010a05" transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 5, -10]}>
        <planeGeometry args={[60, 25]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FogEnvironment() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const fogZ = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetZ = camera.position.z;
    const k = Math.min(1, delta * 2.8);
    fogZ.current += (targetZ - fogZ.current) * k;
    groupRef.current.position.z = fogZ.current;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[16, 6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[160, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.92} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[20, 6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[160, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[24, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[160, 35]} />
        <meshBasicMaterial color="#020804" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-16, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[160, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.92} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-20, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[160, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-24, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[160, 35]} />
        <meshBasicMaterial color="#020804" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 160]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      <SideFog position={[14, 3, 0]} side={1} />
      <SideFog position={[-14, 3, 0]} side={-1} />
      <SideFog position={[18, 5, 0]} side={1} />
      <SideFog position={[-18, 5, 0]} side={-1} />
      <SideFog position={[12, 1.5, 0]} side={1} />
      <SideFog position={[-12, 1.5, 0]} side={-1} />
    </group>
  );
}

function MovingLights() {
  const { camera } = useThree();
  const refs = [useRef<THREE.PointLight>(null), useRef<THREE.PointLight>(null), useRef<THREE.PointLight>(null), useRef<THREE.PointLight>(null)];
  const offsets = [-12, -30, -48, -66];
  useFrame(() => {
    refs.forEach((r, i) => {
      if (r.current) {
        r.current.position.z = camera.position.z + offsets[i];
      }
    });
  });
  return (
    <>
      {refs.map((r, i) => (
        <pointLight key={i} ref={r} position={[0, 3, offsets[i]]} intensity={0.5} color="#FFA726" distance={20} />
      ))}
    </>
  );
}

export function TierrasWorld({ children }: { children?: React.ReactNode }) {
  const questions = useTierrasStore((s) => s.questions);
  const sinkingPlatform = useTierrasStore((s) => s.sinkingPlatform);
  const currentQuestionIndex = useTierrasStore((s) => s.currentQuestionIndex);
  const worldRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!worldRef.current) return;
    worldRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh || child instanceof THREE.Points) {
        child.frustumCulled = false;
      }
    });
  }, []);

  const platformPairs = useMemo(() => {
    return questions.map((q, i) => {
      const z = -(i + 1) * CFG.platformSpacing;
      const halfGap = CFG.gapBetweenPlatforms / 2;
      return {
        question: q,
        index: i,
        z,
        platformA: [-halfGap, CFG.platformHeight / 2, z] as [number, number, number],
        platformB: [halfGap, CFG.platformHeight / 2, z] as [number, number, number],
      };
    });
  }, [questions]);

  const finishZ = -(questions.length + 1) * CFG.platformSpacing - CFG.platformSpacing;

  return (
    <group ref={worldRef}>
      <ambientLight intensity={0.45} color="#1a2a3a" />
      <hemisphereLight args={['#2a3a4a', '#1a2a1a', 0.7]} />
      <directionalLight
        position={[4, 20, 8]}
        intensity={0.8}
        color="#4a5a6a"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={130}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
      <pointLight position={[0, 10, 5]} intensity={0.6} color="#2a4a3a" distance={35} />
      <MovingLights />

      <SwampWater />
      <DenseForest />
      <SwampRocks />
      <GoldenRocks />
      <PurpleCrystals />
      <LilyPads />
      <SwampPlants />
      <SwampLogs />
      <SwampFog />
      <Fireflies />

      <FogEnvironment />
      <FrontFog />

      <SwampPlatform
        position={[0, CFG.platformHeight / 2, 2]}
        width={CFG.startPlatformWidth}
        depth={CFG.startPlatformDepth}
        height={CFG.platformHeight}
        isStart
      />

      {platformPairs.map((pair, i) => {
        const isSinkingA = sinkingPlatform === 'A' && i === currentQuestionIndex;
        const isSinkingB = sinkingPlatform === 'B' && i === currentQuestionIndex;
        return (
          <group key={i}>
            <SwampPlatform
              position={pair.platformA}
              width={CFG.platformWidth}
              depth={CFG.platformDepth}
              height={CFG.platformHeight}
              choice="A"
              isSinking={isSinkingA}
              questionIndex={i}
            />
            <SwampPlatform
              position={pair.platformB}
              width={CFG.platformWidth}
              depth={CFG.platformDepth}
              height={CFG.platformHeight}
              choice="B"
              isSinking={isSinkingB}
              questionIndex={i}
            />
          </group>
        );
      })}

      <SwampPlatform
        position={[0, CFG.platformHeight / 2, finishZ]}
        width={CFG.finishPlatformWidth}
        depth={CFG.finishPlatformDepth}
        height={CFG.platformHeight}
        isFinish
      />

      {children}
    </group>
  );
}

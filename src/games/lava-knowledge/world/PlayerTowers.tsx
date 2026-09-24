'use client';
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useLavaStore } from '@/stores/lava.store';
import { characterRigidBody } from '@/shared/refs/characterRef';
import type { LavaPlayer } from '@/games/lava-knowledge/types';
import RobloxAvatar from '@/shared/characters/RobloxAvatar';
import { createProceduralStoneMaterial } from './ProceduralStoneMaterial';

const BLOCK_HEIGHT = 0.8;
const LAVA_Y = -1.0;
const AVATAR_FEET_OFFSET = 1.6;
const SINK_SPEED = 1.5;

function getPlatformY(blocks: number): number { return LAVA_Y + blocks * BLOCK_HEIGHT; }
function getAvatarY(blocks: number): number { return getPlatformY(blocks) + AVATAR_FEET_OFFSET; }

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

  const stoneMat = useMemo(() => createProceduralStoneMaterial({
    scale: 1.4,
    brightness: 0.2,
    glowStrength: 0.7,
    glowHeight: 4.5,
    glowBaseY: -1,
  }), []);

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#220800'),
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

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
        {/* Main rock body */}
        <mesh castShadow receiveShadow position={[0, -1.0, 0]}>
          <cylinderGeometry args={[1.8, 2.4, 2.0, 12]} />
          <primitive object={stoneMat} attach="material" />
        </mesh>

        {/* Glow halo */}
        <mesh position={[0, -1.0, 0]} scale={[1.15, 1.05, 1.15]}>
          <cylinderGeometry args={[1.8, 2.4, 2.0, 12]} />
          <primitive object={glowMat} attach="material" />
        </mesh>

        {/* Top surface */}
        <mesh position={[0, topSurfaceY + 0.04, 0]} castShadow>
          <cylinderGeometry args={[1.7, 1.8, 0.08, 12]} />
          <primitive object={stoneMat} attach="material" />
        </mesh>

        {/* Bottom widening */}
        <mesh position={[0, -1.9, 0]}>
          <cylinderGeometry args={[2.5, 2.0, 0.5, 12]} />
          <primitive object={stoneMat} attach="material" />
        </mesh>

        <pointLight position={[0, -2.5, 0]} intensity={0.5} color="#FF6600" distance={4} decay={2} />

        <LavaEmbers />

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

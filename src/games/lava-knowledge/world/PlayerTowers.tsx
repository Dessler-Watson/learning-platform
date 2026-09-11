'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useLavaStore } from '@/stores/lava.store';
import { characterRigidBody } from '@/shared/refs/characterRef';
import type { LavaPlayer } from '@/games/lava-knowledge/types';
import RobloxAvatar from '@/shared/characters/RobloxAvatar';

const TOWER_POS: [number, number, number] = [0, 0, 0];
const TOWER_COLOR = '#4FC3F7';
const BLOCK_HEIGHT = 0.5;
const BASE_Y = 0.3;
const AVATAR_FOOT_OFFSET = 1.35;

function getTowerTop(blocks: number): number { return BASE_Y + blocks * BLOCK_HEIGHT; }
function getPlayerY(blocks: number): number { return getTowerTop(blocks) + AVATAR_FOOT_OFFSET; }

function PlayerAnchor({ player }: { player: LavaPlayer }) {
  const rb = useRef<any>(null);
  useFrame(() => {
    if (!rb.current) return;
    const y = getPlayerY(player.blocks);
    rb.current.setTranslation({ x: TOWER_POS[0], y, z: TOWER_POS[2] }, true);
    if (!characterRigidBody.current) characterRigidBody.current = rb.current;
  });
  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={[TOWER_POS[0], getPlayerY(player.blocks), TOWER_POS[2]]}>
      <CuboidCollider args={[0.3, 1.2, 0.3]} sensor />
    </RigidBody>
  );
}

export function PlayerTowers() {
  const player = useLavaStore((s) => s.players[0]);
  if (!player) return null;
  return (
    <group>
      <Tower player={player} position={TOWER_POS} color={TOWER_COLOR} />
    </group>
  );
}

function Tower({ player, position, color }: { player: LavaPlayer; position: [number, number, number]; color: string }) {
  const charRef = useRef<THREE.Group>(null);
  const smoothY = useRef(getPlayerY(player.blocks));
  const prevBlocks = useRef(player.blocks);

  useFrame((_, dt) => {
    const targetY = getPlayerY(player.blocks);
    const diff = targetY - smoothY.current;
    if (Math.abs(diff) > 0.005) smoothY.current += diff * Math.min(dt * 5, 1);
    if (charRef.current) charRef.current.position.y = smoothY.current;
  });

  const blockYs = useMemo(() => {
    const b: number[] = [];
    for (let i = 0; i < player.blocks; i++) b.push(BASE_Y + i * BLOCK_HEIGHT + BLOCK_HEIGHT / 2);
    return b;
  }, [player.blocks]);

  const prevLen = prevBlocks.current;
  const isNewBlock = player.blocks > prevLen;
  prevBlocks.current = player.blocks;
  const visible = !player.eliminated;

  return (
    <group position={position}>
      <RigidBody type="fixed">
        <CuboidCollider args={[1.8, 0.25, 1.8]} />
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[3.6, 0.5, 3.6]} />
          <meshLambertMaterial color="#888" />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[3.9, 0.08, 3.9]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </RigidBody>
      {blockYs.map((y, i) => (
        <AnimatedBlock key={i} y={y} color={player.eliminated ? '#555' : color} isNew={i === player.blocks - 1 && isNewBlock} />
      ))}
      {visible && (
        <group ref={charRef} position={[0, smoothY.current, 0]} frustumCulled={false}>
          <RobloxAvatar />
        </group>
      )}
      <PlayerAnchor player={player} />
    </group>
  );
}

function AnimatedBlock({ y, color, isNew }: { y: number; color: string; isNew: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const scale = useRef(isNew ? 0 : 1);
  const elapsed = useRef(0);

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (isNew) {
      elapsed.current += dt;
      const t = Math.min(elapsed.current / 0.4, 1);
      const s = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI * 2) * (1 - t) * 0.15;
      scale.current = Math.max(0, s);
    }
    ref.current.scale.setScalar(scale.current);
  });

  return (
    <mesh ref={ref} position={[0, y, 0]} castShadow scale={scale.current}>
      <boxGeometry args={[2.6, BLOCK_HEIGHT, 2.6]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

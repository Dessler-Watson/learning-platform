'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useLavaStore } from '@/stores/lava.store';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { LAVA_CONFIG as C } from '@/games/lava-knowledge/config';
import type { LavaPlayer } from '@/games/lava-knowledge/types';
import RobloxAvatar from '@/shared/characters/RobloxAvatar';

const POS: [number, number, number][] = [[-6, 0, -6], [6, 0, -6], [-6, 0, 6], [6, 0, 6]];
const CLR = ['#4FC3F7', '#FF6B9D', '#FFD93D', '#4BC94B'];
const BASE_Y = 0.3; const AVATAR_FOOT_OFFSET = 1.35;

function getTowerTop(blocks: number): number { return BASE_Y + blocks * C.blockHeight; }
function getPlayerY(blocks: number): number { return getTowerTop(blocks) + AVATAR_FOOT_OFFSET; }

function PlayerAnchor({ player, pos }: { player: LavaPlayer; pos: [number, number, number] }) {
  const rb = useRef<any>(null);
  useFrame(() => { if (!rb.current) return; const y = getPlayerY(player.blocks); rb.current.setTranslation({ x: pos[0], y, z: pos[2] }, true); if (player.id === 0 && !characterRigidBody.current) characterRigidBody.current = rb.current; });
  return (<RigidBody ref={rb} type="kinematicPosition" colliders={false} position={[pos[0], getPlayerY(player.blocks), pos[2]]}><CuboidCollider args={[0.3, 1.2, 0.3]} sensor /></RigidBody>);
}

export function PlayerTowers() {
  const players = useLavaStore((s) => s.players);
  return (<group>{players.map((p) => (<Tower key={p.id} player={p} position={POS[p.id]} color={CLR[p.id]} />))}</group>);
}

function Tower({ player, position, color }: { player: LavaPlayer; position: [number, number, number]; color: string }) {
  const charRef = useRef<THREE.Group>(null);
  const smoothY = useRef(getPlayerY(player.blocks));
  const prevBlocks = useRef(player.blocks);
  useFrame((_, dt) => { const targetY = getPlayerY(player.blocks); const diff = targetY - smoothY.current; if (Math.abs(diff) > 0.005) smoothY.current += diff * Math.min(dt * 5, 1); if (charRef.current) charRef.current.position.y = smoothY.current; });
  const blockYs = useMemo(() => { const b: number[] = []; for (let i = 0; i < player.blocks; i++) b.push(BASE_Y + i * C.blockHeight + C.blockHeight / 2); return b; }, [player.blocks]);
  const prevLen = prevBlocks.current; const isNewBlock = player.blocks > prevLen; prevBlocks.current = player.blocks;
  const visible = !player.eliminated;
  return (
    <group position={position}>
      <RigidBody type="fixed"><CuboidCollider args={[1.8, 0.25, 1.8]} /><mesh position={[0, 0.15, 0]}><boxGeometry args={[3.6, 0.5, 3.6]} /><meshLambertMaterial color="#888" /></mesh><mesh position={[0, 0.42, 0]}><boxGeometry args={[3.9, 0.08, 3.9]} /><meshLambertMaterial color={color} /></mesh></RigidBody>
      {blockYs.map((y, i) => (<AnimatedBlock key={i} y={y} color={player.eliminated ? '#555' : color} isNew={i === player.blocks - 1 && isNewBlock} />))}
      {visible && (<group ref={charRef} position={[0, smoothY.current, 0]} frustumCulled={false}><RobloxAvatar /></group>)}
      {player.id === 0 && <PlayerAnchor player={player} pos={position} />}
    </group>
  );
}

function AnimatedBlock({ y, color, isNew }: { y: number; color: string; isNew: boolean }) {
  const ref = useRef<THREE.Mesh>(null); const scale = useRef(isNew ? 0 : 1); const elapsed = useRef(0);
  useFrame((_, dt) => { if (!ref.current) return; if (isNew) { elapsed.current += dt; const t = Math.min(elapsed.current / 0.4, 1); const s = 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI * 2) * (1 - t) * 0.15; scale.current = Math.max(0, s); } ref.current.scale.setScalar(scale.current); });
  return (<mesh ref={ref} position={[0, y, 0]} castShadow scale={scale.current}><boxGeometry args={[2.6, C.blockHeight, 2.6]} /><meshLambertMaterial color={color} /></mesh>);
}

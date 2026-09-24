'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboard } from '@/shared/hooks/useKeyboard';
import { useGameStore } from '@/stores/game.store';
import { CHARACTER } from '@/shared/config/game.config';
import { characterRigidBody } from '@/shared/refs/characterRef';
import RobloxAvatar from './RobloxAvatar';
import { gameAudio } from '@/shared/lib/gameAudio';

export function CharacterController() {
  const rb = useRef<RapierRigidBody>(null);
  const avatarRef = useRef<THREE.Group>(null);
  const keysRef = useKeyboard();
  const grounded = useRef(false);
  const jumpRequested = useRef(false);
  const jumpLocked = useRef(false);
  const leftGroundSinceJump = useRef(false);
  const lastJumpAt = useRef(0);
  const JUMP_COOLDOWN = 250;
  const completedAt = useRef(0);
  const { world, rapier } = useRapier();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!jumpLocked.current) jumpRequested.current = true;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const isOnSurface = (body: RapierRigidBody): boolean => {
    const t = body.translation();
    const ray = new rapier.Ray({ x: t.x, y: t.y + 0.12, z: t.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 0.2, true, undefined, undefined, undefined, body);
    return !!hit;
  };

  useFrame(({ camera }, delta) => {
    if (!rb.current) return;
    if (!characterRigidBody.current) characterRigidBody.current = rb.current;
    const pos = rb.current.translation();
    const vel = rb.current.linvel();
    const keys = keysRef.current;
    const phase = useGameStore.getState().phase;
    if (phase === 'completed' && completedAt.current === 0) completedAt.current = performance.now();
    if (phase !== 'completed' && phase !== 'results') completedAt.current = 0;
    const blocked = (phase === 'completed' || phase === 'results') && completedAt.current > 0 && performance.now() - completedAt.current > 500;

    // Clamp position to stay on the path
    const HALF_W = 7;
    const MAX_Z = 37;
    const MIN_Z = -500;
    const MIN_Y = -3;
    let clampedX = Math.max(-HALF_W, Math.min(HALF_W, pos.x));
    let clampedZ = Math.max(MIN_Z, Math.min(MAX_Z, pos.z));
    let clampedY = pos.y;
    let blockedX = false;
    let blockedZ = false;
    let blockedY = false;
    if (pos.x !== clampedX) blockedX = true;
    if (pos.z !== clampedZ) blockedZ = true;
    if (pos.y < MIN_Y) { clampedY = MIN_Y; blockedY = true; }
    if (blockedX || blockedZ || blockedY) {
      rb.current.setTranslation({ x: clampedX, y: clampedY, z: clampedZ }, true);
      const bv = rb.current.linvel();
      rb.current.setLinvel({ x: blockedX ? 0 : bv.x, y: blockedY ? 0 : bv.y, z: blockedZ ? 0 : bv.z }, true);
    }

    let yv = vel.y;
    if (blocked) {
      rb.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
      return;
    }
    const onSurface = isOnSurface(rb.current);
    grounded.current = onSurface;
    if (jumpLocked.current) {
      if (!onSurface) leftGroundSinceJump.current = true;
      if (onSurface && leftGroundSinceJump.current) {
        jumpLocked.current = false;
        leftGroundSinceJump.current = false;
      }
      jumpRequested.current = false;
    } else if (!onSurface) {
      jumpRequested.current = false;
    }
    const cf = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); cf.y = 0; cf.normalize();
    const cr = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); cr.y = 0; cr.normalize();
    const dir = new THREE.Vector3();
    if (keys.forward) dir.add(cf); if (keys.backward) dir.sub(cf);
    if (keys.right) dir.add(cr); if (keys.left) dir.sub(cr);
    const hasInput = dir.lengthSq() > 0; if (hasInput) dir.normalize();
    const tgtX = dir.x * CHARACTER.maxSpeed; const tgtZ = dir.z * CHARACTER.maxSpeed;
    const acc = hasInput ? CHARACTER.acceleration : CHARACTER.deceleration;
    const t = Math.min(acc * delta, 1);
    const nx = THREE.MathUtils.lerp(vel.x, tgtX, t); const nz = THREE.MathUtils.lerp(vel.z, tgtZ, t);
    if (
      jumpRequested.current &&
      !jumpLocked.current &&
      grounded.current &&
      performance.now() - lastJumpAt.current > JUMP_COOLDOWN
    ) {
      yv = CHARACTER.jumpForce;
      jumpRequested.current = false;
      jumpLocked.current = true;
      leftGroundSinceJump.current = false;
      lastJumpAt.current = performance.now();
      gameAudio.decisionJump();
    }
    rb.current.setLinvel({ x: nx, y: yv, z: nz }, true);
    if (hasInput && avatarRef.current) {
      const ta = Math.atan2(dir.x, dir.z); const ca = avatarRef.current.rotation.y;
      const d = ta - ca; const s = Math.atan2(Math.sin(d), Math.cos(d));
      avatarRef.current.rotation.y += s * Math.min(CHARACTER.rotationSpeed * delta, 1);
      if (grounded.current) gameAudio.decisionFootstep();
    }
  });

  return (
    <RigidBody ref={rb} type="dynamic" position={[0, 1.5, 37]} enabledRotations={[false, false, false]} colliders={false} gravityScale={1} friction={0.05}>
      <CapsuleCollider args={[0.9, 0.2]} position={[0, 1.1, 0]} restitution={0} />
      <group position={[0, 1.35, 0]}>
        <RobloxAvatar ref={avatarRef} envTint="#B3E5FC" envTintIntensity={0.15} />
      </group>
    </RigidBody>
  );
}

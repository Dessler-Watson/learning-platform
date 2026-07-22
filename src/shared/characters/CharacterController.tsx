'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboard } from '@/shared/hooks/useKeyboard';
import { CHARACTER } from '@/shared/config/game.config';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useGameStore } from '@/stores/game.store';
import RobloxAvatar from './RobloxAvatar';

export function CharacterController() {
  const rb = useRef<RapierRigidBody>(null);
  const avatarRef = useRef<THREE.Group>(null);
  const keysRef = useKeyboard();
  const grounded = useRef(false);
  const jumpRequested = useRef(false);
  const phase = useGameStore((s) => s.phase);
  const isVisible = phase !== 'incorrectFeedback';

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); jumpRequested.current = true; } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useFrame(({ camera }, delta) => {
    if (!rb.current) return;
    if (!characterRigidBody.current) characterRigidBody.current = rb.current;
    const pos = rb.current.translation();
    const vel = rb.current.linvel();
    const keys = keysRef.current;
    grounded.current = Math.abs(vel.y) < 0.05;
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
    let yv = vel.y;
    if (jumpRequested.current && grounded.current) { yv = CHARACTER.jumpForce; jumpRequested.current = false; }
    rb.current.setLinvel({ x: nx, y: yv, z: nz }, true);
    if (hasInput && avatarRef.current) {
      const ta = Math.atan2(dir.x, dir.z); const ca = avatarRef.current.rotation.y;
      const d = ta - ca; const s = Math.atan2(Math.sin(d), Math.cos(d));
      avatarRef.current.rotation.y += s * Math.min(CHARACTER.rotationSpeed * delta, 1);
    }
  });

  return (
    <RigidBody ref={rb} type="dynamic" position={[0, 1.5, 22]} enabledRotations={[false, false, false]} colliders={false} gravityScale={1} friction={0.05}>
      <CapsuleCollider args={[0.9, 0.2]} position={[0, 1.1, 0]} restitution={0} />
      <group visible={isVisible} position={[0, 1.35, 0]}>
        <RobloxAvatar ref={avatarRef} />
      </group>
    </RigidBody>
  );
}

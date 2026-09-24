'use client';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useAbismosStore } from '@/stores/abismos.store';
import { CHARACTER } from '@/shared/config/game.config';
import { characterRigidBody } from '@/shared/refs/characterRef';
import RobloxAvatar from '@/shared/characters/RobloxAvatar';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { gameAudio } from '@/shared/lib/gameAudio';

const MAX_Z = 10;
const MIN_Z = -(CFG.startPlatformDepth / 2 + CFG.platformGap + CFG.platformDepth / 2 + (CFG.maxPlatforms - 1) * (CFG.platformDepth + CFG.platformGap) + CFG.platformDepth / 2 + CFG.platformGap + CFG.finishPlatformDepth / 2 + 5);

function useKeyboard() {
  const keys = useRef({ forward: false, backward: false, left: false, right: false, jump: false });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break;
        case 'Space': keys.current.jump = true; break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = false; break;
        case 'Space': keys.current.jump = false; break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return keys;
}

export function AbismosCharacterController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const avatarRef = useRef<THREE.Group>(null);
  const keys = useKeyboard();
  const canMove = useRef(false);
  const cameraQuat = useRef(new THREE.Quaternion());
  const grounded = useRef(false);
  const jumpRequested = useRef(false);
  const jumpLocked = useRef(false);
  const leftGroundSinceJump = useRef(false);
  const lastJumpAt = useRef(0);
  const JUMP_COOLDOWN = 250;
  const fallDetected = useRef(false);
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

  const isOnSurface = (rb: RapierRigidBody): boolean => {
    const t = rb.translation();
    const ray = new rapier.Ray({ x: t.x, y: t.y + 0.12, z: t.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 0.2, true, undefined, undefined, undefined, rb);
    return !!hit;
  };

  useFrame((state, delta) => {
    const store = useAbismosStore.getState();
    const phase = store.phase;

    canMove.current = phase === 'freeMove' || phase === 'crossing';

    characterRigidBody.current = rigidBodyRef.current;
    if (!rigidBodyRef.current) return;

    const pos = rigidBodyRef.current.translation();
    const vel = rigidBodyRef.current.linvel();

    if (
      pos.y < CFG.fallThreshold &&
      !fallDetected.current &&
      (phase === 'questions' || phase === 'freeMove' || phase === 'crossing') &&
      !store.fellInAbyss
    ) {
      fallDetected.current = true;
      store.triggerFall();
      return;
    }

    if (phase === 'defeat' || phase === 'completed' || phase === 'results') {
      fallDetected.current = true;
      rigidBodyRef.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
      return;
    }

    const cam = state.camera;
    cameraQuat.current.copy(cam.quaternion);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuat.current);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuat.current);
    forward.y = 0; forward.normalize();
    right.y = 0; right.normalize();

    const input = keys.current;
    const moveDir = new THREE.Vector3();
    const hasInput = canMove.current && (input.forward || input.backward || input.left || input.right);

    if (hasInput) {
      if (input.forward) moveDir.add(forward);
      if (input.backward) moveDir.sub(forward);
      if (input.left) moveDir.sub(right);
      if (input.right) moveDir.add(right);
      moveDir.normalize();
    }

    const tgtX = moveDir.x * CHARACTER.maxSpeed;
    const tgtZ = moveDir.z * CHARACTER.maxSpeed;
    const acc = hasInput ? CHARACTER.acceleration : CHARACTER.deceleration;
    const t = Math.min(acc * delta, 1);
    let nx = THREE.MathUtils.lerp(vel.x, tgtX, t);
    let nz = THREE.MathUtils.lerp(vel.z, tgtZ, t);

    if (pos.z < MIN_Z) nz = Math.max(nz, 0.5);
    if (pos.z > MAX_Z) nz = Math.min(nz, -0.5);

    nx = THREE.MathUtils.clamp(nx, -CHARACTER.maxSpeed, CHARACTER.maxSpeed);
    nz = THREE.MathUtils.clamp(nz, -CHARACTER.maxSpeed, CHARACTER.maxSpeed);

    let yv = vel.y;
    const onSurface = isOnSurface(rigidBodyRef.current);
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

    rigidBodyRef.current.setLinvel({ x: nx, y: yv, z: nz }, true);

    if (hasInput && avatarRef.current) {
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      const currentAngle = avatarRef.current.rotation.y;
      const diff = targetAngle - currentAngle;
      const smoothed = Math.atan2(Math.sin(diff), Math.cos(diff));
      avatarRef.current.rotation.y += smoothed * Math.min(CHARACTER.rotationSpeed * delta, 1);
    }
  });

  useEffect(() => {
    if (useAbismosStore.getState().phase === 'loading') {
      fallDetected.current = false;
      jumpLocked.current = false;
      jumpRequested.current = false;
      leftGroundSinceJump.current = false;
    }
  }, [useAbismosStore((s) => s.phase)]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[0, CFG.bridgeY + 2, 2]}
      enabledRotations={[false, false, false]}
      colliders={false}
      gravityScale={1}
      friction={1}
      restitution={0}
      name="abismos-character"
    >
      <CapsuleCollider args={[0.9, 0.2]} position={[0, 1.1, 0]} />
      <group position={[0, 1.35, 0]}>
        <RobloxAvatar ref={avatarRef} envTint="#4a90d9" envTintIntensity={0.2} />
      </group>
    </RigidBody>
  );
}

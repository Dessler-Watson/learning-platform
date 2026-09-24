'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboard } from '@/shared/hooks/useKeyboard';
import { useTierrasStore } from '@/stores/tierras.store';
import { CHARACTER } from '@/shared/config/game.config';
import { characterRigidBody } from '@/shared/refs/characterRef';
import RobloxAvatar from '@/shared/characters/RobloxAvatar';
import { gameAudio } from '@/shared/lib/gameAudio';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';

const _cf = new THREE.Vector3();
const _cr = new THREE.Vector3();
const _dir = new THREE.Vector3();

export function TierrasCharacterController() {
  const rb = useRef<RapierRigidBody>(null);
  const avatarRef = useRef<THREE.Group>(null);
  const keysRef = useKeyboard();
  const grounded = useRef(false);
  const wasGrounded = useRef(false);
  const jumpRequested = useRef(false);
  const jumpLocked = useRef(false);
  const leftGroundSinceJump = useRef(false);
  const lastJumpAt = useRef(0);
  const JUMP_COOLDOWN = 250;
  const completedAt = useRef(0);
  const fallDetected = useRef(false);
  const spawnReadyAt = useRef(0);
  const answerSubmittedForQuestion = useRef(-1);
  const { world, rapier } = useRapier();

  useEffect(() => {
    spawnReadyAt.current = performance.now() + 1500;
  }, []);

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
    const state = useTierrasStore.getState();
    const phase = state.phase;

    if (phase === 'completed' && completedAt.current === 0) completedAt.current = performance.now();
    if (phase !== 'completed' && phase !== 'results') completedAt.current = 0;
    const blocked = (phase === 'completed' || phase === 'results') && completedAt.current > 0 && performance.now() - completedAt.current > 500;

    if (blocked) {
      rb.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
      return;
    }

    if (phase === 'correctFeedback' || phase === 'incorrectFeedback') {
      rb.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
      wasGrounded.current = grounded.current;
      grounded.current = isOnSurface(rb.current);
      if (grounded.current) jumpLocked.current = false;
      return;
    }

    if (phase === 'sinking') {
      rb.current.setLinvel({ x: 0, y: -3, z: 0 }, true);
      wasGrounded.current = false;
      grounded.current = false;
      jumpLocked.current = true;
      jumpRequested.current = false;
      return;
    }

    if (phase === 'falling') {
      rb.current.setLinvel({ x: 0, y: Math.min(vel.y, -4), z: 0 }, true);
      wasGrounded.current = false;
      grounded.current = false;
      jumpLocked.current = true;
      jumpRequested.current = false;
      return;
    }

    const canDetectFall =
      phase !== 'completed' &&
      phase !== 'results' &&
      phase !== 'loading' &&
      phase !== 'intro' &&
      performance.now() >= spawnReadyAt.current;

    if (canDetectFall && pos.y < CFG.fallThreshold && !fallDetected.current) {
      fallDetected.current = true;
      gameAudio.lavaDefeat();
      state.triggerFall();
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

    if (grounded.current && !wasGrounded.current && phase === 'playing') {
      const qIndex = state.currentQuestionIndex;

      if (qIndex >= state.questions.length) {
        const finishZ = -(state.questions.length + 1) * CFG.platformSpacing - CFG.platformSpacing;
        const hw = CFG.finishPlatformWidth / 2;
        const hd = CFG.finishPlatformDepth / 2;
        const onFinish = pos.x >= -hw && pos.x <= hw &&
                         pos.z >= finishZ - hd && pos.z <= finishZ + hd;
        if (onFinish) {
          gameAudio.decisionSelect();
          state.completeLevel();
        }
      } else if (answerSubmittedForQuestion.current !== qIndex) {
        const halfGap = CFG.gapBetweenPlatforms / 2;
        const platformZ = -(qIndex + 1) * CFG.platformSpacing;
        const hw = CFG.platformWidth / 2;
        const hd = CFG.platformDepth / 2;

        const onA = pos.x >= -halfGap - hw && pos.x <= -halfGap + hw &&
                     pos.z >= platformZ - hd && pos.z <= platformZ + hd;

        const onB = pos.x >= halfGap - hw && pos.x <= halfGap + hw &&
                     pos.z >= platformZ - hd && pos.z <= platformZ + hd;

        if (onA || onB) {
          answerSubmittedForQuestion.current = qIndex;
          const choice: 'A' | 'B' = onA ? 'A' : 'B';
          gameAudio.decisionSelect();
          useTierrasStore.setState({ selectedPlatform: choice });
        }
      }
    }
    wasGrounded.current = grounded.current;

    _cf.set(0, 0, -1).applyQuaternion(camera.quaternion);
    _cf.y = 0;
    _cf.normalize();
    _cr.set(1, 0, 0).applyQuaternion(camera.quaternion);
    _cr.y = 0;
    _cr.normalize();
    _dir.set(0, 0, 0);
    if (keys.forward) _dir.add(_cf);
    if (keys.backward) _dir.sub(_cf);
    if (keys.right) _dir.add(_cr);
    if (keys.left) _dir.sub(_cr);
    const hasInput = _dir.lengthSq() > 0;
    if (hasInput) _dir.normalize();

    const tgtX = _dir.x * CHARACTER.maxSpeed;
    const tgtZ = _dir.z * CHARACTER.maxSpeed;
    const acc = hasInput ? CHARACTER.acceleration : CHARACTER.deceleration;
    const t = Math.min(acc * delta, 1);
    const nx = THREE.MathUtils.lerp(vel.x, tgtX, t);
    const nz = THREE.MathUtils.lerp(vel.z, tgtZ, t);
    let yv = vel.y;
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
      const ta = Math.atan2(_dir.x, _dir.z);
      const ca = avatarRef.current.rotation.y;
      const d = ta - ca;
      const s = Math.atan2(Math.sin(d), Math.cos(d));
      avatarRef.current.rotation.y += s * Math.min(CHARACTER.rotationSpeed * delta, 1);
      if (grounded.current) gameAudio.decisionFootstep();
    }
  });

  useEffect(() => {
    answerSubmittedForQuestion.current = -1;
    fallDetected.current = false;
    if (useTierrasStore.getState().phase === 'playing') {
      jumpLocked.current = false;
      jumpRequested.current = false;
      leftGroundSinceJump.current = false;
    }
  }, [useTierrasStore((s) => s.currentQuestionIndex), useTierrasStore((s) => s.phase)]);

  return (
    <RigidBody
      ref={rb}
      type="dynamic"
      position={[0, 1.5, 2]}
      enabledRotations={[false, false, false]}
      colliders={false}
      gravityScale={1}
      friction={1}
      restitution={0}
      ccd
      name="tierras-character"
    >
      <CapsuleCollider args={[0.9, 0.2]} position={[0, 1.1, 0]} restitution={0} />
      <group position={[0, 1.35, 0]}>
        <RobloxAvatar ref={avatarRef} envTint="#8FBC8F" envTintIntensity={0.2} />
      </group>
    </RigidBody>
  );
}

'use client';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useTierrasStore } from '@/stores/tierras.store';
import { TIERRAS_CONFIG as CFG } from '@/games/tierras-hundidas/config';

const _desiredPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export function TierrasCamera() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, CFG.cameraHeight, CFG.cameraDistance));
  const targetLook = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((_, delta) => {
    const state = useTierrasStore.getState();
    if (state.fallenInWater || state.phase === 'sinking' || state.phase === 'falling') return;

    if (!characterRigidBody.current) return;
    const pos = characterRigidBody.current.translation();

    _desiredPos.set(pos.x, pos.y + CFG.cameraHeight, pos.z + CFG.cameraDistance);
    targetPos.current.lerp(_desiredPos, 3 * delta);
    camera.position.copy(targetPos.current);

    _lookTarget.set(pos.x, pos.y + 1, pos.z);
    targetLook.current.lerp(_lookTarget, 4 * delta);
    camera.lookAt(targetLook.current);
  });
  return null;
}

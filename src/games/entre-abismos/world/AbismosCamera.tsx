'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { useAbismosStore } from '@/stores/abismos.store';

export function AbismosCamera() {
  const cameraPosition = useRef(new THREE.Vector3(0, CFG.cameraHeight + CFG.bridgeY, CFG.cameraDistance));
  const lookAt = useRef(new THREE.Vector3(0, CFG.bridgeY + 1, 0));

  useFrame((state) => {
    const phase = useAbismosStore.getState().phase;
    if (phase === 'defeat' || phase === 'completed' || phase === 'results') return;

    if (!characterRigidBody.current) return;
    const pos = characterRigidBody.current.translation();

    const targetPos = new THREE.Vector3(
      pos.x * 0.3,
      pos.y + CFG.cameraHeight,
      pos.z + CFG.cameraDistance
    );

    cameraPosition.current.lerp(targetPos, 0.05);
    state.camera.position.copy(cameraPosition.current);

    const targetLookAt = new THREE.Vector3(pos.x * 0.5, pos.y + 1, pos.z);
    lookAt.current.lerp(targetLookAt, 0.05);
    state.camera.lookAt(lookAt.current);
  });

  return null;
}

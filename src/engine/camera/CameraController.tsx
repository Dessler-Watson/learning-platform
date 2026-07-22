'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '@/shared/config/game.config';
import { clamp } from '@/shared/utils/helpers';
import { characterRigidBody } from '@/shared/refs/characterRef';

export function CameraController() {
  const { camera, gl } = useThree();
  const state = useRef({ theta: CAMERA.theta, phi: CAMERA.phi, distance: CAMERA.distance, target: new THREE.Vector3(), currentPos: new THREE.Vector3(), currentLookAt: new THREE.Vector3() });

  useEffect(() => {
    const canvas = gl.domElement;
    const onMouseMove = (e: MouseEvent) => { if (document.pointerLockElement !== canvas) return; state.current.theta -= e.movementX * CAMERA.lookSpeed; state.current.phi = clamp(state.current.phi - e.movementY * CAMERA.lookSpeed, CAMERA.minPhi, CAMERA.maxPhi); };
    const onWheel = (e: WheelEvent) => { if (document.pointerLockElement !== canvas) return; e.preventDefault(); state.current.distance = clamp(state.current.distance + e.deltaY * 0.01 * CAMERA.zoomSpeed, CAMERA.minDistance, CAMERA.maxDistance); };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', () => canvas.requestPointerLock());
    return () => { canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('wheel', onWheel); };
  }, [gl]);

  useFrame((_, delta) => {
    const rb = characterRigidBody.current; if (!rb) return;
    const pos = rb.translation(); const s = state.current; const dt = Math.min(delta, 0.05);
    s.target.set(pos.x, pos.y + 2.5, pos.z);
    const idealPos = new THREE.Vector3(s.target.x + s.distance * Math.sin(s.phi) * Math.sin(s.theta), s.target.y + s.distance * Math.cos(s.phi), s.target.z + s.distance * Math.sin(s.phi) * Math.cos(s.theta));
    const lerpFactor = 1 - Math.exp(-CAMERA.smoothSpeed * dt);
    s.currentPos.lerp(idealPos, lerpFactor); s.currentLookAt.lerp(s.target, lerpFactor);
    camera.position.copy(s.currentPos); camera.lookAt(s.currentLookAt);
  });
  return null;
}

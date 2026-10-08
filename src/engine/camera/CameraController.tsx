'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '@/shared/config/game.config';
import { clamp } from '@/shared/utils/helpers';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useGameStore } from '@/stores/game.store';
import { hasChaosModifier } from '@/lib/chaos/effects';

export function CameraController() {
  const { camera, gl } = useThree();
  const state = useRef({ theta: CAMERA.theta, phi: CAMERA.phi, distance: CAMERA.distance, target: new THREE.Vector3(), currentPos: new THREE.Vector3(), currentLookAt: new THREE.Vector3() });
  const isTouchDevice = useRef(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  useEffect(() => {
    if (isTouchDevice.current) return;
    const canvas = gl.domElement;
    const onMouseMove = (e: MouseEvent) => { if (document.pointerLockElement !== canvas) return; const inv = hasChaosModifier(useGameStore.getState().modifiers, 'mouse_invertido'); const mx = inv ? -e.movementX : e.movementX; const my = inv ? -e.movementY : e.movementY; state.current.theta -= mx * CAMERA.lookSpeed; state.current.phi = clamp(state.current.phi - my * CAMERA.lookSpeed, CAMERA.minPhi, CAMERA.maxPhi); };
    const onWheel = (e: WheelEvent) => { if (document.pointerLockElement !== canvas) return; e.preventDefault(); state.current.distance = clamp(state.current.distance + e.deltaY * 0.01 * CAMERA.zoomSpeed, CAMERA.minDistance, CAMERA.maxDistance); };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', () => canvas.requestPointerLock());
    return () => { canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('wheel', onWheel); };
  }, [gl]);

  // Moviles/tablets: arrastre de un dedo sobre el canvas para orbitar la camara.
  useEffect(() => {
    if (!isTouchDevice.current) return;
    const canvas = gl.domElement;
    const prevTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    let activeId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || activeId !== null || e.target !== canvas) return;
      activeId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (activeId !== e.pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const s = state.current;
      const speed = CAMERA.lookSpeed * 1.5;
      const inv = hasChaosModifier(useGameStore.getState().modifiers, 'mouse_invertido');
      const kx = inv ? dx : -dx;
      const ky = inv ? dy : -dy;
      s.theta += kx * speed;
      s.phi = clamp(s.phi + ky * speed, CAMERA.minPhi, CAMERA.maxPhi);
    };
    const onPointerEnd = (e: PointerEvent) => {
      if (activeId === e.pointerId) activeId = null;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      canvas.style.touchAction = prevTouchAction;
    };
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

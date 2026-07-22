'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp } from '@/shared/utils/helpers';
import { characterRigidBody } from '@/shared/refs/characterRef';
export function LavaCamera() {
  const { camera, gl } = useThree(); const yaw = useRef(0); const pitch = useRef(0.75); const dist = useRef(6); const target = useRef(new THREE.Vector3()); const ready = useRef(false);
  useEffect(() => { const canvas = gl.domElement; const onMove = (e: MouseEvent) => { if (document.pointerLockElement !== canvas) return; yaw.current -= e.movementX * 0.003; pitch.current = clamp(pitch.current - e.movementY * 0.003, 0.2, Math.PI / 2 - 0.05); }; const onWheel = (e: WheelEvent) => { if (document.pointerLockElement !== canvas) return; e.preventDefault(); dist.current = clamp(dist.current + e.deltaY * 0.008, 3, 7); }; canvas.addEventListener('mousemove', onMove); canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('click', () => canvas.requestPointerLock()); return () => { canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('wheel', onWheel); }; }, [gl]);
  useFrame((_, delta) => { const rb = characterRigidBody.current; if (!rb) return; const pos = rb.translation(); const dt = Math.min(delta, 0.05); if (!ready.current) { target.current.set(pos.x, pos.y, pos.z); ready.current = true; } else { const t = 1 - Math.exp(-6 * dt); target.current.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), t); } const d = dist.current; const p = pitch.current; const y = yaw.current; const tx = target.current; camera.position.set(tx.x + d * Math.sin(p) * Math.sin(y), tx.y + d * Math.cos(p), tx.z + d * Math.sin(p) * Math.cos(y)); camera.lookAt(tx); });
  return null;
}

'use client';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';

const ORBIT_SPEED = 0.12;
const ORBIT_RADIUS = 11;
const ORBIT_HEIGHT = 5.5;
const LOOK_AT_HEIGHT = 1.2;

export function LavaCamera() {
  const { camera } = useThree();
  const angle = useRef(0);
  const target = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const rb = characterRigidBody.current;
    if (!rb) return;

    const pos = rb.translation();

    // Smooth follow player position
    const t = 1 - Math.exp(-5 * delta);
    target.current.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), t);

    // Auto rotate around player
    angle.current += ORBIT_SPEED * delta;

    const tx = target.current.x;
    const ty = target.current.y;
    const tz = target.current.z;

    // Orbit position
    const camX = tx + ORBIT_RADIUS * Math.sin(angle.current);
    const camY = ty + ORBIT_HEIGHT;
    const camZ = tz + ORBIT_RADIUS * Math.cos(angle.current);

    // Look at player (slightly above feet)
    const lookX = tx;
    const lookY = ty + LOOK_AT_HEIGHT;
    const lookZ = tz;

    // Smooth camera movement
    const ct = 1 - Math.exp(-4 * delta);
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), ct);
    camera.lookAt(lookX, lookY, lookZ);
  });

  return null;
}

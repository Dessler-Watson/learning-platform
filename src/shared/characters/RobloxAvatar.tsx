'use client';
import { forwardRef, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';

const S = '#FFDBB5'; const SHIRT = '#4FC3F7'; const PANTS = '#1F1F1F'; const SHOE = '#1A1A1A'; const HAIR = '#6D4C2E'; const EYE = '#1A1A1A';
const TW = 1.05, TH = 1.7, TD = 0.6;
const HEAD = 1.2;
const AW = 0.35, AH = 0.85;
const FW = 0.3, FH = 0.75;
const HW = 0.25;
const LW = 0.42, LH = 1.15;
const SW = 0.38, SH = 1.05;
const FTW = 0.42, FTD = 0.55, FTH = 0.22;

interface RobloxAvatarProps {
  envTint?: string;
  envTintIntensity?: number;
}

const RobloxAvatar = forwardRef<THREE.Group, RobloxAvatarProps>(({ envTint = '#ffffff', envTintIntensity = 0 }, ref) => {
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const bodyG = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const curLegAmp = useRef(0);
  const curArmAmp = useRef(0);
  const curBounce = useRef(0);

  const tint = new THREE.Color(envTint);
  const tintEmissive = tint.clone().multiplyScalar(envTintIntensity);

  const top = TH / 2;
  const bot = -TH / 2;
  const sx = TW / 2 + 0.05;
  const sy = top - 0.1;
  const hx = 0.22;
  const hy = bot;

  useFrame((_, delta) => {
    const rb = characterRigidBody.current;
    const vel = rb ? rb.linvel() : { x: 0, y: 0, z: 0 };
    const spd = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const moving = spd > 0.2;
    const running = spd > 4;
    const dt = Math.min(delta, 0.05);
    const tgtLeg = moving ? (running ? 0.58 : 0.38) : 0;
    const tgtArm = moving ? (running ? 0.40 : 0.26) : 0;
    const tgtBnc = moving ? (running ? 0.06 : 0.035) : 0;
    const s = 1 - Math.exp(-10 * dt);
    curLegAmp.current += (tgtLeg - curLegAmp.current) * s;
    curArmAmp.current += (tgtArm - curArmAmp.current) * s;
    curBounce.current += (tgtBnc - curBounce.current) * s;
    const legLen = 2.42;
    const freq = tgtLeg > 0.005 ? (spd * Math.PI) / (2 * Math.sin(tgtLeg) * legLen) : 0;
    phase.current += Math.max(freq, 0.3) * dt;
    const p = phase.current;
    const aL = curLegAmp.current;
    const aA = curArmAmp.current;
    const b = curBounce.current;
    if (lLeg.current) lLeg.current.rotation.x = Math.sin(p) * aL;
    if (rLeg.current) rLeg.current.rotation.x = Math.sin(p + Math.PI) * aL;
    if (lArm.current) lArm.current.rotation.x = Math.sin(p + Math.PI) * aA;
    if (rArm.current) rArm.current.rotation.x = Math.sin(p) * aA;
    if (bodyG.current) bodyG.current.position.y = Math.sin(p * 2) * b;
  });

  return (
    <group ref={ref}>
      <group scale={0.42}>
        <group ref={bodyG}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[TW, TH, TD]} />
            <meshStandardMaterial color={SHIRT} roughness={0.7} emissive={tintEmissive} emissiveIntensity={0.5} />
          </mesh>
          <group position={[0, top, 0]}>
            <mesh castShadow receiveShadow position={[0, HEAD / 2, 0]}>
              <boxGeometry args={[HEAD, HEAD, HEAD - 0.1]} />
              <meshStandardMaterial color={S} roughness={0.6} emissive={tintEmissive} emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.28, HEAD / 2 + 0.1, HEAD / 2 - 0.05]}>
              <boxGeometry args={[0.1, 0.1, 0.02]} />
              <meshStandardMaterial color={EYE} roughness={0.3} />
            </mesh>
            <mesh position={[0.28, HEAD / 2 + 0.1, HEAD / 2 - 0.05]}>
              <boxGeometry args={[0.1, 0.1, 0.02]} />
              <meshStandardMaterial color={EYE} roughness={0.3} />
            </mesh>
            <mesh position={[0, HEAD / 2 - 0.2, HEAD / 2 - 0.05]}>
              <boxGeometry args={[0.4, 0.06, 0.02]} />
              <meshStandardMaterial color={EYE} roughness={0.3} />
            </mesh>
            <mesh position={[0, HEAD - 0.05, 0]}>
              <boxGeometry args={[HEAD + 0.02, 0.18, HEAD + 0.02]} />
              <meshStandardMaterial color={HAIR} roughness={0.8} emissive={tintEmissive} emissiveIntensity={0.3} />
            </mesh>
          </group>
          <group ref={lArm} position={[sx, sy, 0]}>
            <mesh position={[0, -AH / 2, 0]}>
              <boxGeometry args={[AW, AH, AW]} />
              <meshStandardMaterial color={SHIRT} roughness={0.7} emissive={tintEmissive} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -AH - FH / 2, 0]}>
              <boxGeometry args={[FW, FH, FW]} />
              <meshStandardMaterial color={S} roughness={0.6} emissive={tintEmissive} emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, -AH - FH - HW / 2, 0]}>
              <boxGeometry args={[HW, HW, HW]} />
              <meshStandardMaterial color={S} roughness={0.6} emissive={tintEmissive} emissiveIntensity={0.4} />
            </mesh>
          </group>
          <group ref={rArm} position={[-sx, sy, 0]}>
            <mesh position={[0, -AH / 2, 0]}>
              <boxGeometry args={[AW, AH, AW]} />
              <meshStandardMaterial color={SHIRT} roughness={0.7} emissive={tintEmissive} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -AH - FH / 2, 0]}>
              <boxGeometry args={[FW, FH, FW]} />
              <meshStandardMaterial color={S} roughness={0.6} emissive={tintEmissive} emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, -AH - FH - HW / 2, 0]}>
              <boxGeometry args={[HW, HW, HW]} />
              <meshStandardMaterial color={S} roughness={0.6} emissive={tintEmissive} emissiveIntensity={0.4} />
            </mesh>
          </group>
          <group ref={lLeg} position={[hx, hy, 0]}>
            <mesh position={[0, -LH / 2, 0]}>
              <boxGeometry args={[LW, LH, LW]} />
              <meshStandardMaterial color={PANTS} roughness={0.8} emissive={tintEmissive} emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, -LH - SH / 2, 0]}>
              <boxGeometry args={[SW, SH, SW]} />
              <meshStandardMaterial color={PANTS} roughness={0.8} emissive={tintEmissive} emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, -LH - SH - FTH / 2, FTD / 2 - SW / 2]}>
              <boxGeometry args={[FTW, FTH, FTD]} />
              <meshStandardMaterial color={SHOE} roughness={0.5} />
            </mesh>
          </group>
          <group ref={rLeg} position={[-hx, hy, 0]}>
            <mesh position={[0, -LH / 2, 0]}>
              <boxGeometry args={[LW, LH, LW]} />
              <meshStandardMaterial color={PANTS} roughness={0.8} emissive={tintEmissive} emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, -LH - SH / 2, 0]}>
              <boxGeometry args={[SW, SH, SW]} />
              <meshStandardMaterial color={PANTS} roughness={0.8} emissive={tintEmissive} emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, -LH - SH - FTH / 2, FTD / 2 - SW / 2]}>
              <boxGeometry args={[FTW, FTH, FTD]} />
              <meshStandardMaterial color={SHOE} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});

RobloxAvatar.displayName = 'RobloxAvatar';
export default RobloxAvatar;

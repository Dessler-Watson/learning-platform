'use client';
import { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { getStoneRuinMaterial } from './StoneRuinTextures';
import { FINISH_Z, sr } from './layout';

interface StoneBlock {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rotZ: number;
  rotY: number;
}

/**
 * Ancient fieldstone arch ruin on the finish mesa.
 * Pillars + curved voussoir arch with full collision; sits under the golden goal crystal.
 */
function buildArchBlocks(): StoneBlock[] {
  const blocks: StoneBlock[] = [];
  const z = FINISH_Z;
  const pillarW = 1.15;
  const pillarD = 1.35;
  const halfSpan = 2.15;
  const baseY = CFG.bridgeY + CFG.platformHeight / 2;
  const courses = 9;
  const courseH = 0.48;

  for (const side of [-1, 1]) {
    for (let i = 0; i < courses; i++) {
      const y = baseY + courseH * 0.5 + i * courseH;
      const taper = 1 - (i / courses) * 0.12;
      const jitterX = (sr(i * 13 + (side > 0 ? 7 : 3)) - 0.5) * 0.08;
      const jitterZ = (sr(i * 17 + (side > 0 ? 11 : 5)) - 0.5) * 0.06;
      blocks.push({
        x: side * halfSpan + jitterX,
        y,
        z: z + jitterZ,
        w: pillarW * taper * (0.92 + sr(i * 5 + side) * 0.14),
        h: courseH * (0.88 + sr(i * 9 + side) * 0.1),
        d: pillarD * taper * (0.94 + sr(i * 3 + side * 2) * 0.1),
        rotZ: (sr(i * 7 + side * 3) - 0.5) * 0.06,
        rotY: (sr(i * 11 + side) - 0.5) * 0.08,
      });
    }
    // wider footing
    blocks.push({
      x: side * halfSpan,
      y: baseY - 0.12,
      z,
      w: pillarW * 1.35,
      h: 0.45,
      d: pillarD * 1.3,
      rotZ: 0,
      rotY: (side * 0.05) as number,
    });
  }

  // semicircular arch (voussoirs)
  const springY = baseY + courses * courseH;
  const archRadius = halfSpan + pillarW * 0.15;
  const segments = 13;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = Math.PI - t * Math.PI; // 0..PI from left to right
    const x = Math.cos(angle) * archRadius;
    const y = springY + Math.sin(angle) * archRadius * 0.78;
    const wedgeW = (Math.PI * archRadius) / (segments + 1) * 0.92;
    blocks.push({
      x,
      y,
      z: z + (sr(i * 23) - 0.5) * 0.05,
      w: wedgeW,
      h: 0.52 + sr(i * 19) * 0.1,
      d: pillarD * 0.92,
      rotZ: -(angle - Math.PI / 2) + (sr(i * 29) - 0.5) * 0.05,
      rotY: (sr(i * 31) - 0.5) * 0.06,
    });
  }

  // keystone accent
  blocks.push({
    x: 0,
    y: springY + archRadius * 0.78 + 0.08,
    z,
    w: 0.7,
    h: 0.62,
    d: pillarD * 0.98,
    rotZ: (sr(99) - 0.5) * 0.04,
    rotY: 0,
  });

  // scattered rubble at base
  for (let i = 0; i < 8; i++) {
    const side = sr(i * 7 + 40) > 0.5 ? 1 : -1;
    blocks.push({
      x: side * (halfSpan + 0.9 + sr(i * 3 + 41) * 1.4),
      y: baseY + 0.12 + sr(i * 5 + 42) * 0.15,
      z: z + (sr(i * 11 + 43) - 0.5) * 3.2,
      w: 0.45 + sr(i * 13 + 44) * 0.55,
      h: 0.3 + sr(i * 17 + 45) * 0.35,
      d: 0.4 + sr(i * 19 + 46) * 0.5,
      rotZ: (sr(i * 23 + 47) - 0.5) * 0.5,
      rotY: sr(i * 29 + 48) * Math.PI,
    });
  }

  return blocks;
}

export function FinishRuinArch() {
  const blocks = useMemo(() => buildArchBlocks(), []);
  const mat = useMemo(() => getStoneRuinMaterial(1.6, 1.6), []);

  return (
    <RigidBody type="fixed" colliders={false} name="finish-ruin-arch">
      {blocks.map((b, i) => (
        <group key={`stone-${i}`}>
          <CuboidCollider args={[b.w / 2, b.h / 2, b.d / 2]} position={[b.x, b.y, b.z]} rotation={[0, b.rotY, b.rotZ]} />
          <mesh
            position={[b.x, b.y, b.z]}
            rotation={[0, b.rotY, b.rotZ]}
            castShadow
            receiveShadow
            material={mat}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}

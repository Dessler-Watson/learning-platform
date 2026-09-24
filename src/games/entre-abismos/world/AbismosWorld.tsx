'use client';
import { useMemo } from 'react';
import { RigidBody, CuboidCollider, CylinderCollider, ConeCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Mountain, PeakCluster } from './Mountain';
import { BridgePlatforms } from './BridgePlatforms';
import { CloudLayer } from './CloudLayer';
import { AbyssFog } from './AbyssFog';
import { PurpleCrystals } from './PurpleCrystals';
import { FloatingRocks } from './FloatingRocks';
import { WindParticles } from './WindParticles';
import { FinishRuinArch } from './FinishRuinArch';
import { ABISMOS_CONFIG as CFG } from '@/games/entre-abismos/config';
import { getRockSetScaled, getRockVariantForColor, getGlassTexture } from './RockTextures';
import { generateValleyWalls, START_Z, FINISH_Z, sr } from './layout';

const FIRST_FLOAT_Z = START_Z - CFG.startPlatformDepth / 2 - CFG.platformGap - CFG.platformDepth / 2;
const LAST_FLOAT_Z = FIRST_FLOAT_Z - (CFG.maxPlatforms - 1) * (CFG.platformDepth + CFG.platformGap);
const FINISH_Z_PLATFORM = LAST_FLOAT_Z - CFG.platformDepth / 2 - CFG.platformGap - CFG.finishPlatformDepth / 2;
// Keep finish zone aligned with the platform stack (layout FINISH_Z is a nearby approximation for props).
const FINISH_PLATFORM_Z = FINISH_Z;

const worldMatCache = new Map<string, THREE.MeshStandardMaterial>();

function getWorldRockMat(color: string, roughness = 0.88): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}`;
  let m = worldMatCache.get(key);
  if (!m) {
    const variant = getRockVariantForColor(color);
    const rock = typeof document !== 'undefined' ? getRockSetScaled(variant, 4) : null;
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      flatShading: true,
      map: rock?.map,
      normalMap: rock?.normalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
    });
    worldMatCache.set(key, m);
  }
  return m;
}

function getWorldGlassMat(color: string, emissive: string, emissiveIntensity: number, opacity: number): THREE.MeshStandardMaterial {
  const key = `g_${color}_${emissive}_${emissiveIntensity}_${opacity}`;
  let m = worldMatCache.get(key);
  if (!m) {
    const map = typeof document !== 'undefined' ? getGlassTexture() : null;
    m = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      roughness: 0.1,
      metalness: 0.35,
      transparent: true,
      opacity,
      map: map || undefined,
    });
    worldMatCache.set(key, m);
  }
  return m;
}

function MesaPeak({ position, isFinish }: { position: [number, number, number]; isFinish?: boolean }) {
  const seed = isFinish ? 700 : 500;

  const sideRocks = useMemo(() => {
    const rocks: {
      x: number; y: number; z: number; r: number; h: number;
      rotX: number; rotZ: number; rotY: number; seg: number; color: string;
    }[] = [];

    const layers = [
      { y: -24, rMin: 11, rMax: 16, hMin: 6, hMax: 12, count: 7 },
      { y: -15, rMin: 8, rMax: 13, hMin: 5, hMax: 10, count: 6 },
      { y: -8, rMin: 5.5, rMax: 9, hMin: 4, hMax: 8, count: 5 },
      { y: -3, rMin: 4, rMax: 6.5, hMin: 3, hMax: 6, count: 4 },
    ];

    const colors = ['#e0d4bc', '#e8dcc4', '#d6cab2', '#dccfb6', '#cec2a8', '#e4d6c0', '#d2c6ae', '#dad0b8'];
    let idx = 0;

    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        const angle = sr(seed + idx * 7 + 10) * Math.PI * 2;
        const dist = layer.rMin * 1.15 + sr(seed + idx * 7 + 11) * (layer.rMax - layer.rMin) * 0.8;
        const rh = layer.hMin + sr(seed + idx * 7 + 12) * (layer.hMax - layer.hMin);
        const rr = 1.2 + sr(seed + idx * 7 + 13) * 2.5;
        rocks.push({
          x: Math.cos(angle) * dist,
          y: layer.y + sr(seed + idx * 7 + 14) * 3,
          z: Math.sin(angle) * dist,
          r: rr,
          h: rh,
          rotX: (sr(seed + idx * 7 + 15) - 0.5) * 0.45,
          rotZ: (sr(seed + idx * 7 + 16) - 0.5) * 0.45,
          rotY: sr(seed + idx * 7 + 17) * Math.PI * 2,
          seg: 4 + Math.floor(sr(seed + idx * 7 + 18) * 3),
          color: colors[Math.floor(sr(seed + idx * 7 + 19) * colors.length)],
        });
        idx++;
      }
    }

    for (let i = 0; i < 6; i++) {
      const angle = sr(seed + 200 + i * 5) * Math.PI * 2;
      const dist = 12 + sr(seed + 201 + i * 5) * 5;
      const rh = 4 + sr(seed + 202 + i * 5) * 6;
      rocks.push({
        x: Math.cos(angle) * dist,
        y: -26 + sr(seed + 203 + i * 5) * 3,
        z: Math.sin(angle) * dist,
        r: 2 + sr(seed + 204 + i * 5) * 2,
        h: rh,
        rotX: (sr(seed + 205 + i * 5) - 0.5) * 0.5,
        rotZ: (sr(seed + 206 + i * 5) - 0.5) * 0.5,
        rotY: sr(seed + 207 + i * 5) * Math.PI * 2,
        seg: 5 + Math.floor(sr(seed + 208 + i * 5) * 3),
        color: colors[Math.floor(sr(seed + 209 + i * 5) * colors.length)],
      });
    }

    return rocks;
  }, [seed]);

  const crystals = useMemo(() => {
    const spots: { x: number; y: number; z: number; s: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = sr(seed + i * 13 + 300) * Math.PI * 2;
      const dist = 9 + sr(seed + i * 13 + 301) * 5;
      spots.push({
        x: Math.cos(angle) * dist,
        y: -20 + i * 4,
        z: Math.sin(angle) * dist,
        s: 0.7 + sr(seed + i * 13 + 302) * 0.6,
      });
    }
    return spots;
  }, [seed]);

  const topSafeR = CFG.startPlatformWidth / 2 - 0.35;

  const mesaLayers = useMemo(() => {
    const layers: {
      y: number; h: number; rTop: number; rBot: number; maxR?: number;
    }[] = [
      { y: -26, h: 12, rTop: 14.5, rBot: 19.5 },
      { y: -17, h: 8, rTop: 11, rBot: 14.5 },
      { y: -10, h: 7, rTop: 8, rBot: 11 },
      { y: -4.5, h: 5, rTop: 5.5, rBot: 8 },
      { y: -0.8, h: 3.5, rTop: 3.8, rBot: 5.5, maxR: topSafeR },
      { y: 0.85, h: 1.7, rTop: 3.15, rBot: 3.5, maxR: topSafeR },
    ];
    const slices: { y: number; halfH: number; r: number }[] = [];
    const steps = 4;
    for (const layer of layers) {
      for (let i = 0; i < steps; i++) {
        const t = (i + 0.5) / steps;
        let r = layer.rBot + (layer.rTop - layer.rBot) * t;
        if (layer.maxR !== undefined) r = Math.min(r, layer.maxR);
        r *= 0.96;
        slices.push({
          y: layer.y - layer.h / 2 + t * layer.h,
          halfH: layer.h / (2 * steps) + 0.02,
          r,
        });
      }
    }
    return slices;
  }, [topSafeR]);

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false} name={isFinish ? 'mesa-finish-body' : 'mesa-start-body'}>
        {mesaLayers.map((s, i) => (
          <CylinderCollider key={`mc-${i}`} args={[s.halfH, s.r]} position={[0, s.y, 0]} />
        ))}
      </RigidBody>

      <mesh position={[0, -26, 0]} castShadow receiveShadow material={getWorldRockMat('#dcd0b8', 0.9)}>
        <cylinderGeometry args={[14.5, 19.5, 12, 9]} />
      </mesh>
      <mesh position={[0, -17, 0]} castShadow receiveShadow material={getWorldRockMat('#e4d8c0', 0.88)}>
        <cylinderGeometry args={[11, 14.5, 8, 8]} />
      </mesh>
      <mesh position={[0, -10, 0]} castShadow receiveShadow material={getWorldRockMat('#eadcc4', 0.85)}>
        <cylinderGeometry args={[8, 11, 7, 7]} />
      </mesh>
      <mesh position={[0, -4.5, 0]} castShadow receiveShadow material={getWorldRockMat('#efe2cc', 0.82)}>
        <cylinderGeometry args={[5.5, 8, 5, 7]} />
      </mesh>
      <mesh position={[0, -0.8, 0]} castShadow receiveShadow material={getWorldRockMat('#f3e8d4', 0.8)}>
        <cylinderGeometry args={[3.8, 5.5, 3.5, 8]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow material={getWorldRockMat('#f7eedc', 0.78)}>
        <cylinderGeometry args={[3.15, 3.5, 1.7, 8]} />
      </mesh>

      {sideRocks.map((r, i) => {
        const topY = r.y + r.h / 2;
        const collide = topY < CFG.bridgeY - 1.2;
        return (
          <group key={`sr-${i}`}>
            {collide && (
              <ConeCollider
                args={[r.h * 0.48, r.r * 0.92]}
                position={[r.x, r.y, r.z]}
                rotation={[r.rotX, r.rotY, r.rotZ]}
              />
            )}
            <mesh
              position={[r.x, r.y, r.z]}
              rotation={[r.rotX, r.rotY, r.rotZ]}
              castShadow
              receiveShadow
              material={getWorldRockMat(r.color, 0.87)}
            >
              <coneGeometry args={[r.r, r.h, r.seg]} />
            </mesh>
          </group>
        );
      })}

      {crystals.map((c, i) => (
        <mesh
          key={`cr-${i}`}
          position={[c.x, c.y, c.z]}
          scale={[c.s * 0.18, c.s * 0.32, c.s * 0.18]}
          material={getWorldGlassMat('#9b59b6', '#7b2fbe', 2.5, 0.82)}
        >
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
      ))}

      {isFinish && (
        <pointLight position={[0, 3, 0]} color="#ffd700" intensity={3.5} distance={25} decay={2} />
      )}
    </group>
  );
}

function FinishZone({ onReach }: { onReach: () => void }) {
  return (
    <RigidBody type="fixed" position={[0, CFG.bridgeY, FINISH_PLATFORM_Z]} colliders={false} name="finish-zone" onCollisionEnter={onReach}>
      <CuboidCollider args={[CFG.finishPlatformWidth / 2, CFG.platformHeight / 2, CFG.finishPlatformDepth / 2]} />
      <mesh castShadow receiveShadow material={getWorldRockMat('#f2e8d4', 0.82)}>
        <boxGeometry args={[CFG.finishPlatformWidth, CFG.platformHeight, CFG.finishPlatformDepth]} />
      </mesh>
      <mesh position={[0, -CFG.bridgeY / 2, 0]} castShadow material={getWorldRockMat('#ddd0b8', 0.88)}>
        <boxGeometry args={[CFG.finishPlatformWidth - 0.5, CFG.bridgeY, CFG.finishPlatformDepth - 0.5]} />
      </mesh>
    </RigidBody>
  );
}

function StartPlatform() {
  return (
    <RigidBody type="fixed" position={[0, CFG.bridgeY, START_Z]} colliders={false} name="start-platform">
      <CuboidCollider args={[CFG.startPlatformWidth / 2, CFG.platformHeight / 2, CFG.startPlatformDepth / 2]} />
      <mesh castShadow receiveShadow material={getWorldRockMat('#f2e8d4', 0.82)}>
        <boxGeometry args={[CFG.startPlatformWidth, CFG.platformHeight, CFG.startPlatformDepth]} />
      </mesh>
      <mesh position={[0, -CFG.bridgeY / 2, 0]} castShadow material={getWorldRockMat('#ddd0b8', 0.88)}>
        <boxGeometry args={[CFG.startPlatformWidth - 0.5, CFG.bridgeY, CFG.startPlatformDepth - 0.5]} />
      </mesh>
    </RigidBody>
  );
}

function ValleyWalls() {
  const walls = useMemo(() => generateValleyWalls(), []);

  return (
    <group>
      {walls.map((w, i) => (
        <Mountain key={`cw-${i}`} position={[w.x, -25, w.z]} scale={w.s} height={w.h} seed={w.seed} />
      ))}
    </group>
  );
}

function SkyDome() {
  return (
    <mesh position={[0, 10, -25]} frustumCulled={false}>
      <sphereGeometry args={[200, 16, 12]} />
      <meshBasicMaterial color="#7BB3E0" side={THREE.BackSide} />
    </mesh>
  );
}

function AmbientParticles() {
  const particles = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const side = sr(i * 3 + 3000) > 0.5 ? 1 : -1;
      positions[i * 3] = side * (sr(i * 3 + 3001) * 15 + 12);
      positions[i * 3 + 1] = CFG.bridgeY + sr(i * 3 + 3002) * 10 - 1;
      positions[i * 3 + 2] = sr(i * 3 + 3003) * (START_Z - FINISH_Z + 20) + FINISH_Z - 10;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#d0c8b8" size={0.12} transparent opacity={0.5} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function MovingLights() {
  return (
    <group>
      <pointLight position={[0, CFG.bridgeY + 6, 2]} intensity={0.55} color="#ffeedd" distance={35} decay={2} />
      <pointLight position={[8, CFG.bridgeY + 3, -20]} intensity={0.35} color="#d0b0ff" distance={30} decay={2} />
      <pointLight position={[-8, CFG.bridgeY + 3, -35]} intensity={0.35} color="#d0b0ff" distance={30} decay={2} />
      <pointLight position={[0, CFG.bridgeY + 10, FINISH_Z]} intensity={1.0} color="#ffd700" distance={35} decay={2} />
    </group>
  );
}

function GoalCrystal() {
  return (
    <group position={[0, CFG.bridgeY + 3, FINISH_Z]}>
      <mesh scale={[0.5, 0.8, 0.5]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={3} roughness={0.1} metalness={0.8} transparent opacity={0.9} />
      </mesh>
      <mesh scale={[0.25, 0.5, 0.25]} position={[0.6, -0.3, 0]} rotation={[0, 0, 0.4]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffed4a" emissive="#ffcc00" emissiveIntensity={2.5} roughness={0.1} metalness={0.7} transparent opacity={0.8} />
      </mesh>
      <pointLight color="#ffd700" intensity={4.5} distance={20} decay={2} />
    </group>
  );
}

export function AbismosWorld({ onReachFinish }: { onReachFinish: () => void }) {
  return (
    <group>
      <ambientLight intensity={0.32} color="#d0d8f0" />
      <hemisphereLight args={['#9ab8d8', '#5a4030', 0.38]} />
      <directionalLight
        position={[18, 42, 12]}
        intensity={2.4}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={140}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <SkyDome />
      <MovingLights />

      <MesaPeak position={[0, 0, START_Z]} />
      <MesaPeak position={[0, 0, FINISH_Z]} isFinish />
      <GoalCrystal />
      <FinishRuinArch />

      <StartPlatform />
      <BridgePlatforms />
      <FinishZone onReach={onReachFinish} />

      <ValleyWalls />
      <PurpleCrystals />
      <FloatingRocks />
      <AmbientParticles />
      <WindParticles />
      <CloudLayer />
      <AbyssFog />
    </group>
  );
}

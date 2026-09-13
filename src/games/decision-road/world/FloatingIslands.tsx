'use client';
import { useMemo } from 'react';
import { useGameStore } from '@/stores/game.store';
import * as THREE from 'three';

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const CHUNK_SIZE = 80;
const EXTEND_CHUNKS = 3;
const ISLANDS_PER_CHUNK = 6;
const MOUNTAINS_PER_CHUNK = 5;

interface IslandData {
  x: number; y: number; z: number;
  scale: number; rotation: number;
  type: number;
}

interface MountainData {
  x: number; z: number; h: number; r: number; color: string;
}

function generateChunkIslands(chunkZ: number, chunkIndex: number): IslandData[] {
  const items: IslandData[] = [];
  for (let i = 0; i < ISLANDS_PER_CHUNK; i++) {
    const seed = chunkIndex * 1000 + i;
    const side = seededRandom(seed * 3) > 0.5 ? 1 : -1;
    items.push({
      x: side * (20 + seededRandom(seed * 7) * 55),
      y: -1 - seededRandom(seed * 11) * 6,
      z: chunkZ - seededRandom(seed * 13) * CHUNK_SIZE,
      scale: 0.7 + seededRandom(seed * 17) * 0.9,
      rotation: seededRandom(seed * 19) * Math.PI * 2,
      type: Math.floor(seededRandom(seed * 23) * 5),
    });
  }
  return items;
}

function generateChunkMountains(chunkZ: number, chunkIndex: number): MountainData[] {
  const items: MountainData[] = [];
  const colors1 = ['#4DD0E1', '#26C6DA', '#80DEEA', '#00BCD4', '#0097A7'];
  const colors2 = ['#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#E0F7FA'];
  const colors3 = ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'];

  for (let i = 0; i < MOUNTAINS_PER_CHUNK; i++) {
    const seed = chunkIndex * 2000 + i;
    const layer = i % 3;
    const palette = layer === 0 ? colors1 : layer === 1 ? colors2 : colors3;
    const hBase = layer === 0 ? 30 : layer === 1 ? 20 : 15;
    const rBase = layer === 0 ? 22 : layer === 1 ? 16 : 10;
    items.push({
      x: -130 + seededRandom(seed * 3 + 100) * 260,
      z: chunkZ - seededRandom(seed * 7 + 100) * CHUNK_SIZE,
      h: hBase + seededRandom(seed * 11 + 100) * 25,
      r: rBase + seededRandom(seed * 13 + 100) * 20,
      color: palette[Math.floor(seededRandom(seed * 17 + 100) * 5)],
    });
  }
  return items;
}

function Bush({ position, scale = 1, color = '#2E7D32' }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.2, 0.2]}>
        <sphereGeometry args={[0.35, 5, 4]} />
        <meshStandardMaterial color="#388E3C" roughness={0.9} />
      </mesh>
    </group>
  );
}

function IslandClassic({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[5.5, 2, 4.5, 8]} />
        <meshStandardMaterial color="#5c7ea0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[5.8, 5.5, 0.7, 8]} />
        <meshStandardMaterial color="#4caf50" roughness={0.9} emissive="#2E7D32" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.5, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 2, 6]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 3.2, 0]}>
        <coneGeometry args={[1.1, 1.8, 6]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.85} />
      </mesh>
      <mesh position={[0.5, 4.2, 0]}>
        <coneGeometry args={[0.7, 1.3, 6]} />
        <meshStandardMaterial color="#388E3C" roughness={0.85} />
      </mesh>
      <Bush position={[-2.5, 0.7, 1]} scale={1.1} />
      <Bush position={[2, 0.7, -0.8]} scale={0.8} color="#388E3C" />
    </group>
  );
}

function IslandElongated({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[7, 3, 4, 6]} />
        <meshStandardMaterial color="#6a8cb5" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[7.3, 7, 0.6, 6]} />
        <meshStandardMaterial color="#66bb6a" roughness={0.9} emissive="#2E7D32" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[-1.5, 1.3, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1.6, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh position={[-1.5, 2.7, 0]}>
        <coneGeometry args={[0.9, 1.4, 6]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.85} />
      </mesh>
      <mesh position={[1.8, 1.1, 0.5]}>
        <cylinderGeometry args={[0.12, 0.2, 1.2, 6]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[1.8, 2.1, 0.5]}>
        <coneGeometry args={[0.7, 1.1, 6]} />
        <meshStandardMaterial color="#388E3C" roughness={0.85} />
      </mesh>
      <Bush position={[-3.5, 0.7, 0.5]} scale={1.2} />
      <Bush position={[0, 0.7, -2]} scale={0.9} color="#43A047" />
      <Bush position={[3.5, 0.7, -0.3]} scale={1} />
    </group>
  );
}

function IslandTall({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[4, 1.5, 6, 7]} />
        <meshStandardMaterial color="#5e82a8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[4.2, 4, 0.5, 7]} />
        <meshStandardMaterial color="#81C784" roughness={0.9} emissive="#2E7D32" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.32, 1.4, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[2.5, 3, 5]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.85} emissive="#1B5E20" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <coneGeometry args={[1.5, 2, 5]} />
        <meshStandardMaterial color="#388E3C" roughness={0.85} />
      </mesh>
      <Bush position={[-2, 0.7, 1.5]} scale={1.3} />
      <Bush position={[1.5, 0.7, -1.5]} scale={1} color="#1B5E20" />
    </group>
  );
}

function IslandWide({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[8, 4, 3.5, 8]} />
        <meshStandardMaterial color="#7090b5" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[8.3, 8, 0.5, 8]} />
        <meshStandardMaterial color="#43a047" roughness={0.9} emissive="#2E7D32" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[-2, 1.2, 0]}>
        <sphereGeometry args={[0.8, 6, 5]} />
        <meshStandardMaterial color="#388E3C" roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 1.0, 1]}>
        <sphereGeometry args={[0.6, 6, 5]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, -1.5]}>
        <sphereGeometry args={[0.7, 6, 5]} />
        <meshStandardMaterial color="#43A047" roughness={0.9} />
      </mesh>
      <Bush position={[-4.5, 0.7, 0.5]} scale={1.4} />
      <Bush position={[4, 0.7, -0.5]} scale={1.1} color="#2E7D32" />
      <Bush position={[0.5, 0.7, 2.5]} scale={1} />
      <Bush position={[-1, 0.7, -3]} scale={0.9} color="#388E3C" />
    </group>
  );
}

function IslandSmall({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[3, 0.8, 3, 7]} />
        <meshStandardMaterial color="#5e82a8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[3.3, 3, 0.5, 7]} />
        <meshStandardMaterial color="#4caf50" roughness={0.9} emissive="#2E7D32" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.2, 1.0, 0.1]}>
        <cylinderGeometry args={[0.12, 0.22, 1.2, 6]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 2.2, 0.1]}>
        <coneGeometry args={[0.7, 1.2, 6]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.85} />
      </mesh>
      <Bush position={[-1.2, 0.6, 0.8]} scale={0.7} />
      <Bush position={[1, 0.6, -0.8]} scale={0.6} color="#43A047" />
    </group>
  );
}

const ISLAND_COMPONENTS = [IslandClassic, IslandElongated, IslandTall, IslandWide, IslandSmall];

function MountainChunk({ mountains }: { mountains: MountainData[] }) {
  return (
    <group>
      {mountains.map((m, i) => (
        <group key={i} position={[m.x, -42, m.z]}>
          <mesh>
            <coneGeometry args={[m.r, m.h, 5]} />
            <meshStandardMaterial color={m.color} roughness={0.85} transparent opacity={0.5} />
          </mesh>
          <mesh position={[m.r * 0.3, m.h * 0.12, m.r * 0.2]}>
            <coneGeometry args={[m.r * 0.5, m.h * 0.55, 5]} />
            <meshStandardMaterial color="#B2EBF2" roughness={0.85} transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function FloatingIslands() {
  const questions = useGameStore((s) => s.questions);
  const START_Z = 12;
  const SPACING = 25;

  const { allIslands, allMountains, fogCenterZ, frontZ, backZ } = useMemo(() => {
    const totalZ = questions.length > 0
      ? START_Z - (questions.length - 1) * SPACING
      : START_Z;
    const frontZ = START_Z + EXTEND_CHUNKS * CHUNK_SIZE;
    const backZ = totalZ - EXTEND_CHUNKS * CHUNK_SIZE;
    const fogCenter = (frontZ + backZ) / 2;

    const islands: IslandData[] = [];
    const mountains: MountainData[] = [];

    for (let z = frontZ; z >= backZ; z -= CHUNK_SIZE) {
      const chunkIdx = Math.floor((frontZ - z) / CHUNK_SIZE);
      islands.push(...generateChunkIslands(z, chunkIdx));
      mountains.push(...generateChunkMountains(z, chunkIdx + 500));
    }

    return { allIslands: islands, allMountains: mountains, fogCenterZ: fogCenter, frontZ, backZ };
  }, [questions.length]);

  return (
    <group>
      {allIslands.map((island, i) => {
        const Component = ISLAND_COMPONENTS[island.type];
        return (
          <group key={i} position={[island.x, island.y, island.z]} rotation={[0, island.rotation, 0]}>
            <Component scale={island.scale} />
          </group>
        );
      })}
      <MountainChunk mountains={allMountains} />

      {/* Fog planes centered on the level — sized to cover full path */}
      {(() => {
        const fogW = 800;
        const fogD = (frontZ - backZ) + 200;
        return (
          <>
            <mesh position={[0, -48, fogCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fogW, fogD]} />
              <meshBasicMaterial color="#B3E5FC" transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -44, fogCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fogW - 100, fogD - 100]} />
              <meshBasicMaterial color="#C8E6F5" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -40, fogCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fogW - 200, fogD - 200]} />
              <meshBasicMaterial color="#D4EEFB" transparent opacity={0.45} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      })()}

      {/* Side barriers */}
      <mesh position={[-250, -20, fogCenterZ]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[250, -20, fogCenterZ]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -20, frontZ + 40]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -20, backZ - 40]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

'use client';
import { useMemo } from 'react';
import * as THREE from 'three';

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeIslands(): {
  x: number; y: number; z: number;
  scale: number; rotation: number;
  type: number;
}[] {
  const items: ReturnType<typeof makeIslands> = [];
  const count = 32;
  for (let i = 0; i < count; i++) {
    const side = seededRandom(i * 3) > 0.5 ? 1 : -1;
    items.push({
      x: side * (20 + seededRandom(i * 7) * 60),
      y: -1 - seededRandom(i * 11) * 6,
      z: -10 - seededRandom(i * 13) * 440,
      scale: 0.8 + seededRandom(i * 17) * 0.8,
      rotation: seededRandom(i * 19) * Math.PI * 2,
      type: Math.floor(seededRandom(i * 23) * 5),
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
      <mesh position={[0, -1, 0]}>
        <dodecahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial color="#6889b0" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[2.8, 2.5, 0.4, 6]} />
        <meshStandardMaterial color="#5cb85c" roughness={0.9} emissive="#2E7D32" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.3, 1.8, 0]}>
        <sphereGeometry args={[0.5, 5, 4]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.9} />
      </mesh>
      <Bush position={[-1, 1.1, 1]} scale={0.8} />
      <Bush position={[1.5, 1.1, -0.5]} scale={0.7} color="#43A047" />
    </group>
  );
}

const ISLAND_COMPONENTS = [IslandClassic, IslandElongated, IslandTall, IslandWide, IslandSmall];

function MountainRange() {
  const data = useMemo(() => {
    const items: { x: number; z: number; h: number; r: number; color: string }[] = [];
    for (let i = 0; i < 30; i++) {
      items.push({
        x: -130 + seededRandom(i * 3 + 100) * 260,
        z: 20 - seededRandom(i * 7 + 100) * 520,
        h: 30 + seededRandom(i * 11 + 100) * 25,
        r: 22 + seededRandom(i * 13 + 100) * 20,
        color: ['#4DD0E1', '#26C6DA', '#80DEEA', '#00BCD4', '#0097A7'][Math.floor(seededRandom(i * 17 + 100) * 5)],
      });
    }
    for (let i = 0; i < 25; i++) {
      items.push({
        x: -120 + seededRandom(i * 3 + 200) * 240,
        z: 10 - seededRandom(i * 7 + 200) * 500,
        h: 20 + seededRandom(i * 11 + 200) * 22,
        r: 16 + seededRandom(i * 13 + 200) * 16,
        color: ['#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#E0F7FA'][Math.floor(seededRandom(i * 17 + 200) * 5)],
      });
    }
    for (let i = 0; i < 20; i++) {
      items.push({
        x: -100 + seededRandom(i * 3 + 300) * 200,
        z: 30 - seededRandom(i * 7 + 300) * 480,
        h: 15 + seededRandom(i * 11 + 300) * 15,
        r: 10 + seededRandom(i * 13 + 300) * 12,
        color: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'][Math.floor(seededRandom(i * 17 + 300) * 5)],
      });
    }
    return items;
  }, []);

  return (
    <group>
      {/* Capas de "niebla" plana para cubrir bases sin bordes cortados */}
      <mesh position={[0, -48, -220]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 700]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -44, -220]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 600]} />
        <meshBasicMaterial color="#C8E6F5" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -40, -220]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[420, 520]} />
        <meshBasicMaterial color="#D4EEFB" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      {/* Barreras laterales para que no se vea el corte */}
      <mesh position={[-250, -20, -220]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[250, -20, -220]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -20, 250]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -20, -700]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 80]} />
        <meshBasicMaterial color="#B3E5FC" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {data.map((m, i) => (
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
  const islands = useMemo(() => makeIslands(), []);

  return (
    <group>
      {islands.map((island, i) => {
        const Component = ISLAND_COMPONENTS[island.type];
        return (
          <group key={i} position={[island.x, island.y, island.z]} rotation={[0, island.rotation, 0]}>
            <Component scale={island.scale} />
          </group>
        );
      })}
      <MountainRange />
    </group>
  );
}

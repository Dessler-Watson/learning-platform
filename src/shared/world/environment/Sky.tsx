'use client';
export function Sky() {
  return (
    <group>
      <mesh position={[60, 65, -80]}><sphereGeometry args={[3.5, 20, 20]} /><meshBasicMaterial color="#FFF9C4" /></mesh>
      <mesh position={[60, 65, -80]}><sphereGeometry args={[5.5, 20, 20]} /><meshBasicMaterial color="#FFF9C4" transparent opacity={0.12} /></mesh>
      <mesh position={[60, 65, -80]}><sphereGeometry args={[8, 20, 20]} /><meshBasicMaterial color="#FFECB3" transparent opacity={0.05} /></mesh>
    </group>
  );
}

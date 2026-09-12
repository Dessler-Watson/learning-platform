'use client';
export function Sky() {
  return (
    <group>
      <mesh position={[50, 60, -90]}>
        <sphereGeometry args={[4, 24, 24]} />
        <meshBasicMaterial color="#FFF8E1" />
      </mesh>
      <mesh position={[50, 60, -90]}>
        <sphereGeometry args={[7, 24, 24]} />
        <meshBasicMaterial color="#FFF9C4" transparent opacity={0.2} />
      </mesh>
      <mesh position={[50, 60, -90]}>
        <sphereGeometry args={[12, 24, 24]} />
        <meshBasicMaterial color="#FFECB3" transparent opacity={0.08} />
      </mesh>
      <mesh position={[50, 60, -90]}>
        <sphereGeometry args={[20, 16, 16]} />
        <meshBasicMaterial color="#FFF3C4" transparent opacity={0.03} />
      </mesh>
    </group>
  );
}

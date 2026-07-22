'use client';
import { ContactShadows } from '@react-three/drei';
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#b3d9ff" />
      <hemisphereLight args={['#87CEEB', '#90a955', 0.5]} />
      <directionalLight position={[30, 50, 40]} intensity={2.5} color="#ffffff" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={100} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-bias={-0.0003} shadow-normalBias={0.02} />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={30} blur={0.8} far={25} />
    </>
  );
}

'use client';
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.8} color="#e8f4fd" />
      <hemisphereLight args={['#87CEEB', '#a8d98a', 0.7]} />
      <directionalLight position={[20, 40, 30]} intensity={3.2} color="#fff8e8" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={120} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-bias={-0.0003} shadow-normalBias={0.02} />
      <directionalLight position={[-10, 15, -5]} intensity={0.5} color="#b3d9ff" />
      <pointLight position={[0, 12, 5]} intensity={0.4} color="#ffe4b5" distance={50} />
    </>
  );
}

'use client';
import { Arena } from './Arena';
import { PlayerTowers } from './PlayerTowers';
export function LavaWorld() {
  return (<group><ambientLight intensity={0.6} color="#ffffff" /><hemisphereLight args={['#87CEEB', '#90a955', 0.5]} /><directionalLight position={[20, 30, 10]} intensity={2} color="#ffffff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} /><Arena><PlayerTowers /></Arena></group>);
}

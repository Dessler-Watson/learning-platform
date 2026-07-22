'use client';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { LavaSurface } from './LavaSurface';
function Wall({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (<RigidBody type="fixed" position={[x, 3.2, z]}><CuboidCollider args={[w / 2, 3.2, d / 2]} /><mesh><boxGeometry args={[w, 6.4, d]} /><meshLambertMaterial color="#6BA3D6" /></mesh><mesh position={[0, 0, 0]}><boxGeometry args={[w + 0.05, 6.2, d + 0.05]} /><meshLambertMaterial color="#5B8CBF" wireframe /></mesh><mesh position={[0, 3.3, 0]}><boxGeometry args={[w + 0.3, 0.25, d + 0.3]} /><meshLambertMaterial color="#88C0EE" /></mesh></RigidBody>);
}
export function Arena({ children }: { children: React.ReactNode }) { return (<group><LavaSurface /><Wall x={0} z={-12.5} w={25} d={1} /><Wall x={0} z={12.5} w={25} d={1} /><Wall x={-12.5} z={0} w={1} d={25} /><Wall x={12.5} z={0} w={1} d={25} />{children}</group>); }

'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
const vert = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const frag = 'uniform float uTime;uniform vec3 uHot,uBase,uDark;varying vec2 vUv;float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float smoothNoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(noise(i),noise(i+vec2(1.0,0.0)),f.x),mix(noise(i+vec2(0.0,1.0)),noise(i+vec2(1.0,1.0)),f.x),f.y);}void main(){vec2 uv=vUv*4.0;uv.x+=uTime*0.08;uv.y+=uTime*0.05;float n1=smoothNoise(uv*1.3);float n2=smoothNoise(uv*2.7+5.0);float n=smoothNoise(uv*5.1+10.0)*0.2+n1*0.5+n2*0.3;float hot=smoothstep(0.35,0.6,n);float dark=smoothstep(0.2,0.35,n);vec3 col=mix(uBase,uHot,hot);col=mix(uDark,col,dark);gl_FragColor=vec4(col,1.0);}';
export function LavaSurface() {
  const ref = useRef<THREE.Mesh>(null);
  const ptsRef = useRef<THREE.Points>(null);
  const mat = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uHot: { value: new THREE.Color('#FFCC00') }, uBase: { value: new THREE.Color('#FF4400') }, uDark: { value: new THREE.Color('#991100') } }, vertexShader: vert, fragmentShader: frag }), []);
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt; if (ptsRef.current) { const p = ptsRef.current.geometry.attributes.position.array as Float32Array; for (let i = 0; i < 40; i++) { p[i * 3 + 1] += dt * (1.2 + Math.random() * 1.5); if (p[i * 3 + 1] > 4) { p[i * 3 + 1] = 0; p[i * 3] = (Math.random() - 0.5) * 20; p[i * 3 + 2] = (Math.random() - 0.5) * 20; } } ptsRef.current.geometry.attributes.position.needsUpdate = true; } });
  const pts = useMemo(() => { const a = new Float32Array(40 * 3); for (let i = 0; i < 40; i++) { a[i * 3] = (Math.random() - 0.5) * 20; a[i * 3 + 1] = Math.random() * 4; a[i * 3 + 2] = (Math.random() - 0.5) * 20; } return a; }, []);
  return (<group position={[0, -1, 0]}><RigidBody type="fixed"><CuboidCollider args={[11, 0.3, 11]} /></RigidBody><mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}><planeGeometry args={[22, 22, 1, 1]} /><primitive object={mat} attach="material" /></mesh><points ref={ptsRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[pts, 3]} /></bufferGeometry><pointsMaterial color="#FFAA00" size={0.18} transparent opacity={0.5} depthWrite={false} /></points></group>);
}

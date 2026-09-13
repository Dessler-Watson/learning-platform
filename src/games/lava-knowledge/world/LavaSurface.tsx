'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

const vert = `varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const frag = `uniform float uTime;
uniform vec3 uHot,uBase,uDark,uGlow;
varying vec2 vUv;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p);vec2 f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0;float a=0.5;
  for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;}
  return v;
}

void main(){
  vec2 uv=vUv*3.0;
  float t=uTime*0.12;
  float n1=fbm(uv*1.2+vec2(t*0.3,t*0.2));
  float n2=fbm(uv*2.5+vec2(-t*0.2,t*0.15)+5.0);
  float n3=fbm(uv*4.0+vec2(t*0.15,-t*0.1)+10.0);
  float n=n1*0.45+n2*0.35+n3*0.2;
  float hot=smoothstep(0.42,0.68,n);
  float mid=smoothstep(0.28,0.5,n);
  float dark=smoothstep(0.15,0.3,n);
  vec3 col=mix(uDark,uBase,mid);
  col=mix(col,uHot,hot);
  float glowPulse=0.5+0.5*sin(uTime*0.8+vUv.x*3.14+vUv.y*2.0);
  col=mix(col,uGlow,hot*glowPulse*0.25);
  float edge=smoothstep(0.0,0.12,vUv.x)*smoothstep(0.0,0.12,1.0-vUv.x)
            *smoothstep(0.0,0.12,vUv.y)*smoothstep(0.0,0.12,1.0-vUv.y);
  col=mix(uGlow*0.8,col,edge);
  gl_FragColor=vec4(col,1.0);
}`;

export function LavaSurface() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHot: { value: new THREE.Color('#FFDD00') },
      uBase: { value: new THREE.Color('#FF5500') },
      uDark: { value: new THREE.Color('#AA1100') },
      uGlow: { value: new THREE.Color('#FF8800') },
    },
    vertexShader: vert,
    fragmentShader: frag,
  }), []);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  return (
    <group position={[0, -1, 0]}>
      <RigidBody type="fixed">
        <CuboidCollider args={[20, 0.3, 20]} />
      </RigidBody>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[44, 44, 1, 1]} />
        <primitive object={mat} attach="material" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={[48, 48]} />
        <meshBasicMaterial color="#FF6600" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

import * as THREE from 'three';

const vert = `varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  vUv=uv;
  vec4 wp=modelMatrix*vec4(position,1.0);
  vWorldPos=wp.xyz;
  vNormal=normalize(normalMatrix*normal);
  vViewDir=normalize(cameraPosition-wp.xyz);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const frag = `uniform float uTime;
uniform vec3 uWater,uAlgae,uMud,uHighlight,uGoldReflect,uPurpleReflect;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p);vec2 f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0;float a=0.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p*=2.1;a*=0.48;}
  return v;
}

float fbm3(vec2 p){
  float v=0.0;float a=0.5;
  for(int i=0;i<3;i++){v+=a*noise(p);p*=2.3;a*=0.45;}
  return v;
}

void main(){
  vec2 uv=vWorldPos.xz*0.06;
  float t=uTime*0.08;

  float n1=fbm(uv*1.0+vec2(t*0.15,t*0.1));
  float n2=fbm(uv*2.2+vec2(-t*0.12,t*0.08)+5.0);
  float n3=fbm(uv*4.5+vec2(t*0.08,-t*0.06)+10.0);
  float n4=fbm3(uv*8.0+vec2(t*0.2,-t*0.15)+15.0);

  float n=n1*0.35+n2*0.3+n3*0.2+n4*0.15;

  float algaePatch=smoothstep(0.35,0.65,n2);
  float mudPatch=smoothstep(0.25,0.48,n1);
  float highlight=smoothstep(0.52,0.75,n3);
  float caustic=smoothstep(0.6,0.8,n4);

  vec3 col=mix(uWater,uMud,mudPatch*0.4);
  col=mix(col,uAlgae,algaePatch*0.45);

  float shimmer=0.5+0.5*sin(uTime*0.3+vWorldPos.x*0.4+vWorldPos.z*0.25);
  float shimmer2=0.5+0.5*sin(uTime*0.5+vWorldPos.x*0.2-vWorldPos.z*0.3);
  col=mix(col,uHighlight,highlight*shimmer*0.25);
  col+=uHighlight*caustic*shimmer2*0.08;

  float ripple1=sin(vWorldPos.x*2.0+t*3.0)*sin(vWorldPos.z*1.5+t*2.5);
  float ripple2=sin(vWorldPos.x*1.2-t*2.0)*sin(vWorldPos.z*2.0+t*1.5);
  float ripple3=sin(vWorldPos.x*3.5+t*1.8)*sin(vWorldPos.z*2.8-t*2.2);
  float rippleCombined=ripple1*0.025+ripple2*0.015+ripple3*0.008;
  col+=uHighlight*rippleCombined;

  float foam=smoothstep(0.72,0.88,n3)*0.12;
  col+=vec3(foam);

  float goldZone=smoothstep(3.0,8.0,abs(vWorldPos.x));
  vec3 goldCol=uGoldReflect*0.2*smoothstep(0.25,0.65,n1);
  goldCol+=uGoldReflect*0.08*smoothstep(0.5,0.8,n3)*shimmer;
  col=mix(col+goldCol,col,goldZone);

  float purpleZone=smoothstep(5.0,15.0,abs(vWorldPos.x));
  vec3 purpleCol=uPurpleReflect*0.1*smoothstep(0.35,0.75,n2);
  purpleCol+=uPurpleReflect*0.05*smoothstep(0.45,0.7,n4)*shimmer2;
  col=mix(col+purpleCol,col,purpleZone);

  float edge=smoothstep(0.0,0.12,vUv.x)*smoothstep(0.0,0.12,1.0-vUv.x)
            *smoothstep(0.0,0.12,vUv.y)*smoothstep(0.0,0.12,1.0-vUv.y);
  col=mix(uWater*0.3,col,edge);

  float fresnel=pow(1.0-max(dot(vNormal,vViewDir),0.0),3.0);
  col+=vec3(0.04,0.06,0.04)*fresnel;

  float depthFade=smoothstep(0.0,0.5,vUv.y);
  col=mix(uWater*0.4,col,depthFade);

  float specular=pow(max(dot(reflect(-vViewDir,vNormal),normalize(vec3(0.3,1.0,0.2))),0.0),32.0);
  col+=vec3(specular*0.08);

  gl_FragColor=vec4(col,0.95);
}`;

export function createSwampWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWater: { value: new THREE.Color('#030805') },
      uAlgae: { value: new THREE.Color('#0a1808') },
      uMud: { value: new THREE.Color('#0d0803') },
      uHighlight: { value: new THREE.Color('#142814') },
      uGoldReflect: { value: new THREE.Color('#8a6a10') },
      uPurpleReflect: { value: new THREE.Color('#3a0a50') },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

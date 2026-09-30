import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { clampDpr } from './quality';

type Listener = (scale: number) => void;

const STEPS = [1, 0.8, 0.65, 0.5];

let stepIndex = 0;
let scale = 1;
const listeners = new Set<Listener>();

let rafId = 0;
let windowStart = 0;
let frames = 0;
let windows = 0;
let bad = 0;
let good = 0;
let lastChange = 0;

function emit() {
  listeners.forEach((l) => l(scale));
}

function tick(now: number) {
  rafId = requestAnimationFrame(tick);
  if (document.hidden) return;
  if (!windowStart) {
    windowStart = now;
    frames = 0;
    return;
  }
  frames++;
  const elapsed = now - windowStart;
  if (elapsed < 1000) return;

  const avg = elapsed / frames;
  windowStart = now;
  frames = 0;
  windows++;

  // Cargas/compilaciones puntuales tempranas: no las contamos como jank.
  // A partir de 8s, un rendimiento sostenido horrible sí debe degradar.
  if (avg > 120 && windows < 8) {
    bad = Math.max(0, bad - 1);
    good = 0;
    return;
  }
  // Ventanas de calentamiento (shaders, texturas).
  if (windows < 3) return;

  // <34ms (~30fps+) cuenta como bien para poder recuperar resolucion;
  // >34ms (<30fps) sostenido la reduce. La banda intermedia decae.
  if (avg > 34) {
    bad++;
    good = 0;
  } else if (avg < 29) {
    good++;
    bad = 0;
  } else {
    bad = Math.max(0, bad - 1);
    good = Math.max(0, good - 1);
  }

  if (bad >= 2 && stepIndex < STEPS.length - 1 && now - lastChange > 2500) {
    stepIndex++;
    scale = STEPS[stepIndex];
    lastChange = now;
    bad = 0;
    emit();
  } else if (good >= 5 && stepIndex > 0 && now - lastChange > 6000) {
    stepIndex--;
    scale = STEPS[stepIndex];
    lastChange = now;
    good = 0;
    emit();
  }
}

function start() {
  if (rafId) return;
  windowStart = 0;
  frames = 0;
  lastChange = performance.now();
  rafId = requestAnimationFrame(tick);
}

function stop() {
  if (!rafId) return;
  cancelAnimationFrame(rafId);
  rafId = 0;
}

export function getDprScale(): number {
  return scale;
}

export function subscribeDprScale(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
}

/**
 * Reduce (y recupera) el DPR de render según los fps reales. Se monta dentro
 * del <Canvas> y aplica el cambio con setDpr del store de R3F.
 */
export function AdaptiveDpr({ baseMax }: { baseMax: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const apply = (s: number) => {
      setDpr([0.75, clampDpr(baseMax) * s]);
      // setDpr redimensiona el buffer dejandolo transparente; repintar ya
      // mismo evita que por un fotograma asome el fondo de la pagina
      // (destello blanco). Si aun no hay render valido, lo ignora.
      try {
        gl.render(scene, camera);
      } catch {}
    };
    apply(getDprScale());
    const unsub = subscribeDprScale(apply);
    start();
    return unsub;
  }, [baseMax, setDpr, gl, scene, camera]);

  return null;
}

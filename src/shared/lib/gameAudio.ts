'use client';

/* ============================================================
   GameAudioEngine — procedural Web Audio API engine
   Handles: SFX, Heartbeat, Volume for both game modes
   ============================================================ */

let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* Force AudioContext ready — call on first user gesture.
   Además reintenta el `play()` de las pistas de música: si el navegador
   bloqueó el autoplay al montar el canvas, sin este reintento la música
   queda en silencio aunque el usuario ya haya interactuado. */
export function initAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  resumeMusicPlayback();
}

/* ---- volume state ---- */
let sfxVol = 0.85;
let masterEnabled = true;

/* ---- active nodes for cleanup ---- */
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatActive = false;

/* ============================================================
   Low-level synth helpers
   ============================================================ */

function playTone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', endFreq?: number, delay = 0) {
  if (!masterEnabled) return;
  const c = getCtx();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * sfxVol, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playNoise(dur: number, vol: number, filterFreq = 2000, delay = 0) {
  if (!masterEnabled) return;
  const c = getCtx();
  const t = c.currentTime + delay;
  const bufSize = c.sampleRate * dur;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * sfxVol, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function playToneWithEnvelope(
  freq: number, dur: number, vol: number,
  type: OscillatorType = 'sine',
  attackTime = 0.01, decayTime = 0.05, sustainLevel = 0.7, releaseTime = 0.1,
  endFreq?: number, delay = 0,
) {
  if (!masterEnabled) return;
  const c = getCtx();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  const peakVol = vol * sfxVol;
  const sustainVol = peakVol * sustainLevel;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peakVol, t + attackTime);
  gain.gain.linearRampToValueAtTime(sustainVol, t + attackTime + decayTime);
  gain.gain.setValueAtTime(sustainVol, t + dur - releaseTime);
  gain.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/* ============================================================
   CAMINO DE DECISIONES — SFX (warm, magical, adventurous)
   ============================================================ */

function sfxSelect() {
  // Warm chime — gentle woodblock-like tap with pitch rise
  const c = getCtx();
  const t = c.currentTime;
  // Impact body
  playTone(440, 0.08, 0.1, 'triangle', 520);
  // Shimmer tail
  playTone(1320, 0.12, 0.04, 'sine', 1580, 0.03);
  playTone(1760, 0.1, 0.02, 'sine', 2090, 0.06);
}

function sfxCorrect() {
  // Triumphant fanfare — warm brass-like swell with sparkle
  playToneWithEnvelope(523, 0.3, 0.14, 'triangle', 0.01, 0.08, 0.8, 0.1);
  playToneWithEnvelope(659, 0.3, 0.12, 'triangle', 0.01, 0.08, 0.8, 0.1, undefined, 0.08);
  playToneWithEnvelope(784, 0.4, 0.15, 'sine', 0.01, 0.1, 0.85, 0.15, undefined, 0.16);
  // Sparkle accents
  playTone(1568, 0.08, 0.05, 'sine', 2093, 0.2);
  playTone(2093, 0.1, 0.03, 'sine', 2637, 0.28);
}

function sfxIncorrect() {
  // Descending buzz — audible on any speaker
  playTone(440, 0.15, 0.18, 'sawtooth', 220);
  playTone(330, 0.2, 0.12, 'square', 165, 0.05);
  // Low thud — felt more than heard
  playTone(110, 0.12, 0.15, 'sine');
}

function sfxAdvance() {
  // Whoosh — airy sweep with crystalline chime
  playTone(330, 0.15, 0.08, 'sine', 660);
  playNoise(0.2, 0.04, 3000, 0.02);
  playTone(880, 0.12, 0.06, 'sine', 1320, 0.08);
}

let lastStepTime = 0;
function sfxFootstep() {
  const now = performance.now();
  if (now - lastStepTime < 300) return;
  lastStepTime = now;
  // Mid-range impact — audible on phone/laptop speakers
  const base = 350 + Math.random() * 150; // 350-500Hz sweet spot
  playTone(base, 0.06, 0.09, 'sine', base * 0.7);
  // Click/crisp top — cuts through on any speaker
  playTone(base * 3, 0.03, 0.05, 'triangle', base * 2, 0.01);
  // Noise crunch for texture
  playNoise(0.04, 0.04, 2000);
}

function sfxJump() {
  // Quick ascending whoosh — audible on any speaker
  playTone(300, 0.12, 0.08, 'sine', 600);
  playTone(500, 0.08, 0.05, 'triangle', 900, 0.02);
  playNoise(0.08, 0.03, 2500, 0.01);
}

function sfxVictory() {
  // Grand fanfare — cascading chords with shimmer
  const fanfare = [
    { f: 523, d: 0.35, v: 0.12 },
    { f: 587, d: 0.3, v: 0.11 },
    { f: 659, d: 0.3, v: 0.12 },
    { f: 784, d: 0.35, v: 0.13 },
    { f: 880, d: 0.3, v: 0.12 },
    { f: 1047, d: 0.5, v: 0.15 },
  ];
  fanfare.forEach((n, i) => {
    playToneWithEnvelope(n.f, n.d, n.v, 'triangle', 0.01, 0.06, 0.85, 0.12, undefined, i * 0.13);
    // Sparkle overtone
    playTone(n.f * 2, n.d * 0.5, n.v * 0.3, 'sine', n.f * 2.5, i * 0.13 + 0.05);
  });
  // Sustained chord resolution
  playToneWithEnvelope(1047, 0.8, 0.1, 'sine', 0.02, 0.1, 0.7, 0.3, undefined, 0.78);
  playToneWithEnvelope(1319, 0.8, 0.06, 'triangle', 0.02, 0.1, 0.6, 0.3, undefined, 0.78);
}

/* ============================================================
   LAVA DEL CONOCIMIENTO — SFX (deep, volcanic, mysterious)
   ============================================================ */

function lavaSelect() {
  // Deep resonant tap — stone-like impact with reverb
  playTone(330, 0.08, 0.1, 'triangle', 396);
  playTone(990, 0.1, 0.04, 'sine', 1188, 0.02);
  // Subtle rumble tail
  playTone(80, 0.12, 0.03, 'sine', 60, 0.04);
}

function lavaCorrect() {
  // Ascending crystalline chime — magical lava crystal resonance
  playToneWithEnvelope(440, 0.2, 0.12, 'sine', 0.01, 0.05, 0.75, 0.1);
  playToneWithEnvelope(554, 0.2, 0.1, 'sine', 0.01, 0.05, 0.75, 0.1, undefined, 0.08);
  playToneWithEnvelope(659, 0.25, 0.13, 'sine', 0.01, 0.06, 0.8, 0.12, undefined, 0.16);
  // Crystal sparkle
  playTone(1318, 0.08, 0.04, 'sine', 1760, 0.22);
  playTone(1760, 0.1, 0.025, 'sine', 2217, 0.28);
}

function lavaIncorrect() {
  // Deep volcanic rumble — ominous, heavy impact
  playTone(120, 0.35, 0.15, 'sawtooth', 80);
  playTone(90, 0.4, 0.1, 'triangle', 60, 0.05);
  playNoise(0.25, 0.08, 400, 0.03);
  // Sub-bass thud
  playTone(55, 0.5, 0.08, 'sine', 40, 0.1);
}

function lavaRise() {
  // Rising magma surge — layered ascending tones with turbulence
  playTone(100, 0.5, 0.12, 'sawtooth', 220);
  playTone(150, 0.6, 0.08, 'triangle', 320, 0.08);
  playNoise(0.45, 0.07, 350, 0.05);
  // Sub-bass rumble
  playTone(45, 0.7, 0.06, 'sine', 65, 0.1);
}

function lavaTickChange() {
  // Deep warning pulse — resonant strike with decay
  playTone(500, 0.08, 0.1, 'square', 350);
  playTone(250, 0.12, 0.07, 'triangle', 180, 0.04);
  // Echo tail
  playTone(180, 0.15, 0.03, 'sine', 120, 0.08);
}

function lavaDefeat() {
  // Dramatic collapse — descending cascade with deep resonance
  const cascade = [
    { f: 392, d: 0.4, v: 0.12 },
    { f: 349, d: 0.35, v: 0.11 },
    { f: 330, d: 0.35, v: 0.12 },
    { f: 262, d: 0.4, v: 0.13 },
    { f: 196, d: 0.45, v: 0.12 },
    { f: 147, d: 0.5, v: 0.1 },
  ];
  cascade.forEach((n, i) => {
    playToneWithEnvelope(n.f, n.d, n.v, 'sawtooth', 0.01, 0.08, 0.7, 0.15, n.f * 0.85, i * 0.16);
    playTone(n.f * 0.5, n.d + 0.1, n.v * 0.5, 'triangle', undefined, i * 0.16);
  });
  // Final deep thud
  playTone(70, 1.2, 0.1, 'sawtooth', 40, 0.96);
  playNoise(0.9, 0.08, 250, 0.9);
}

/* ============================================================
   COMPLETION — triumphant celebration fanfare
   ============================================================ */

function sfxCompletion() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  // Rising sparkle sweep
  playTone(400, 0.3, 0.06, 'sine', 1200);
  playTone(600, 0.25, 0.04, 'triangle', 1400, 0.05);
  // Climactic chord hit
  playToneWithEnvelope(523, 0.6, 0.12, 'sine', 0.01, 0.08, 0.8, 0.2, undefined, 0.25);
  playToneWithEnvelope(659, 0.6, 0.1, 'triangle', 0.01, 0.08, 0.8, 0.2, undefined, 0.25);
  playToneWithEnvelope(784, 0.6, 0.11, 'sine', 0.01, 0.08, 0.8, 0.2, undefined, 0.25);
  playToneWithEnvelope(1047, 0.7, 0.09, 'triangle', 0.01, 0.1, 0.75, 0.25, undefined, 0.3);
  // Sparkle rain
  const sparkles = [1568, 1760, 2093, 2217, 2637];
  sparkles.forEach((f, i) => {
    playTone(f, 0.15, 0.03, 'sine', f * 1.2, 0.35 + i * 0.08);
  });
  // Sustained shimmer tail
  playTone(1047, 1.0, 0.04, 'sine', 1175, 0.5);
  playTone(1319, 1.0, 0.03, 'triangle', 1397, 0.55);
}

/* ============================================================
   HEARTBEAT — realistic double-thump cardiac rhythm
   ============================================================ */

function startHeartbeat() {
  if (heartbeatActive || !masterEnabled) return;
  heartbeatActive = true;
  const beat = () => {
    if (!heartbeatActive || !masterEnabled) return;
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime;
    // S1 — "lub" (first heart sound)
    // Low thump (for headphones)
    const osc1 = c.createOscillator();
    const g1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 0.1);
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.3 * sfxVol, t + 0.006);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc1.connect(g1).connect(c.destination);
    osc1.start(t);
    osc1.stop(t + 0.13);
    // Mid click (for speakers — this is what they'll actually hear)
    const osc1b = c.createOscillator();
    const g1b = c.createGain();
    osc1b.type = 'triangle';
    osc1b.frequency.setValueAtTime(400, t);
    osc1b.frequency.exponentialRampToValueAtTime(200, t + 0.06);
    g1b.gain.setValueAtTime(0, t);
    g1b.gain.linearRampToValueAtTime(0.18 * sfxVol, t + 0.003);
    g1b.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1b.connect(g1b).connect(c.destination);
    osc1b.start(t);
    osc1b.stop(t + 0.09);
    // S2 — "dub" (second heart sound)
    // Low thump
    const osc2 = c.createOscillator();
    const g2 = c.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(50, t + 0.22);
    osc2.frequency.exponentialRampToValueAtTime(28, t + 0.32);
    g2.gain.setValueAtTime(0, t + 0.22);
    g2.gain.linearRampToValueAtTime(0.2 * sfxVol, t + 0.226);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    osc2.connect(g2).connect(c.destination);
    osc2.start(t + 0.22);
    osc2.stop(t + 0.35);
    // Mid click
    const osc2b = c.createOscillator();
    const g2b = c.createGain();
    osc2b.type = 'triangle';
    osc2b.frequency.setValueAtTime(320, t + 0.22);
    osc2b.frequency.exponentialRampToValueAtTime(160, t + 0.28);
    g2b.gain.setValueAtTime(0, t + 0.22);
    g2b.gain.linearRampToValueAtTime(0.12 * sfxVol, t + 0.223);
    g2b.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc2b.connect(g2b).connect(c.destination);
    osc2b.start(t + 0.22);
    osc2b.stop(t + 0.29);
  };
  beat();
  heartbeatInterval = setInterval(beat, 800);
}

function stopHeartbeat() {
  heartbeatActive = false;
  if (heartbeatInterval !== null) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/* ============================================================
   MUSIC — file-based background loops with seamless crossfade
   ============================================================ */

const MUSIC_FILES: Record<string, string[]> = {
  decisiones: [
    '/songs/shut_up_ghost-smooth-cold-wind-looped-135538.mp3',
    '/songs/sergequadrado-ethereal-uplifting-loop-275529.mp3',
  ],
  lava: [
    '/songs/freesound_community-lava-loop-1-67307.mp3',
    '/songs/sergequadrado-fairy-tale-loop-275534.mp3',
  ],
  league: [
    '/songs/Leage_song/idoberg-space-chords-loop-310493.mp3',
  ],
  tierras: [
    '/songs/new_modes/capaholiczsfx-countryside-swamp-insects-environment-402579.mp3',
    '/songs/new_modes/freesound_community-mysterious-ambient-pad-loop-84-bpm-dm-100772.mp3',
  ],
  abismos: [
    '/songs/new_modes/freesound_community-vocal-harmony-19821.mp3',
    '/songs/new_modes/nickpanek-whiteout-valley-blizzard-ambient-loop-with-howling-hillside-winds-563822.mp3',
  ],
};

interface LoopTrack {
  elA: HTMLAudioElement;
  elB: HTMLAudioElement;
  active: 'A' | 'B';
  duration: number;
  targetVol: number;
  intervalId: ReturnType<typeof setInterval> | null;
  fadeIds: Array<ReturnType<typeof setInterval>>;
  pauseId: ReturnType<typeof setTimeout> | null;
  lastCrossfade: number;
}

/**
 * Volumen por capa: índice 0 = pista ambiente (grabaciones muy silenciosas,
 * se sube para que se ESCUCHE), índice 1 = música principal.
 * league tiene una sola pista (ya es música).
 */
const MUSIC_VOLS: Record<string, number[]> = {
  decisiones: [0.7, 0.4],
  lava: [0.7, 0.4],
  league: [0.5],
  tierras: [0.7, 0.4],
  abismos: [0.7, 0.4],
};
const CROSSFADE_MS = 1500;
const CROSSFADE_COOLDOWN_MS = 5000;
let activeTracks: LoopTrack[] = [];

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function tryPlay(el: HTMLAudioElement) {
  try {
    const p = el.play();
    if (p && typeof p.then === 'function') p.catch(() => {});
  } catch {}
}

function cancelFades(track: LoopTrack) {
  track.fadeIds.forEach((id) => clearInterval(id));
  track.fadeIds = [];
  if (track.pauseId) {
    clearTimeout(track.pauseId);
    track.pauseId = null;
  }
}

function fadeTo(track: LoopTrack, el: HTMLAudioElement, from: number, to: number, ms: number) {
  el.volume = clamp01(from);
  const steps = 20;
  const stepMs = ms / steps;
  const delta = (to - from) / steps;
  let i = 0;
  const id = setInterval(() => {
    i++;
    el.volume = clamp01(from + delta * i);
    if (i >= steps) {
      clearInterval(id);
      track.fadeIds = track.fadeIds.filter((x) => x !== id);
    }
  }, stepMs);
  track.fadeIds.push(id);
}

/**
 * Loop "seamless": dos elementos alternan con crossfade cerca del final.
 * Ambos llevan `loop = true` como red de seguridad: si el crossfade no
 * puede arrancar la otra pista (autoplay/búfer), la pista activa sigue
 * sonando por sí sola en vez de dejarse en silencio.
 */
function createSeamlessLoop(file: string, targetVol: number): LoopTrack {
  const elA = new Audio(file);
  elA.preload = 'auto';
  const elB = new Audio(file);
  elB.preload = 'auto';
  elA.loop = true;
  elB.loop = true;
  elA.volume = targetVol;
  elB.volume = 0;

  const track: LoopTrack = {
    elA, elB,
    active: 'A',
    duration: 0,
    targetVol,
    intervalId: null,
    fadeIds: [],
    pauseId: null,
    lastCrossfade: 0,
  };

  elA.addEventListener('loadedmetadata', () => {
    if (track.duration === 0 && Number.isFinite(elA.duration)) track.duration = elA.duration;
  });

  tryPlay(elA);

  const crossfade = () => {
    const now = Date.now();
    if (now - track.lastCrossfade < CROSSFADE_COOLDOWN_MS) return;
    track.lastCrossfade = now;
    cancelFades(track);

    const from = track.active === 'A' ? track.elA : track.elB;
    const to = track.active === 'A' ? track.elB : track.elA;
    const nextActive = track.active === 'A' ? 'B' : 'A';
    let started = false;
    const doFade = () => {
      if (started) return;
      started = true;
      fadeTo(track, to, 0, track.targetVol, CROSSFADE_MS);
      fadeTo(track, from, from.volume, 0, CROSSFADE_MS);
      track.pauseId = setTimeout(() => {
        try { from.pause(); } catch {}
        track.pauseId = null;
      }, CROSSFADE_MS + 100);
      track.active = nextActive;
    };

    try {
      to.currentTime = 0;
      const p = to.play();
      if (p && typeof p.then === 'function') {
        // Solo se hace el fade si la nueva pista arrancó: si no, la
        // actual sigue sonando (loop propio) y se reintentará al final.
        p.then(doFade).catch(() => {});
      } else {
        doFade();
      }
    } catch {
      /* conserva la pista actual */
    }
  };

  track.intervalId = setInterval(() => {
    if (track.duration <= 0) return;
    const el = track.active === 'A' ? track.elA : track.elB;
    const remaining = track.duration - el.currentTime;
    if (remaining <= 2.5 && remaining > 0) crossfade();
  }, 300);

  return track;
}

/** Reintenta el play() de la pista activa de cada loop (gesto del usuario). */
function resumeMusicPlayback() {
  for (const t of activeTracks) {
    const el = t.active === 'A' ? t.elA : t.elB;
    if (el.paused) tryPlay(el);
  }
}

function startMusic(mode: 'decisiones' | 'lava' | 'league' | 'tierras' | 'abismos') {
  stopMusic();
  if (!masterEnabled) return;
  const files = MUSIC_FILES[mode] ?? [];
  const vols = MUSIC_VOLS[mode] ?? [];
  files.forEach((file, i) => {
    activeTracks.push(createSeamlessLoop(file, vols[i] ?? 0.35));
  });
}

function stopMusic() {
  activeTracks.forEach((t) => {
    if (t.intervalId) clearInterval(t.intervalId);
    cancelFades(t);
    try { t.elA.pause(); t.elA.src = ''; } catch {}
    try { t.elB.pause(); t.elB.src = ''; } catch {}
  });
  activeTracks = [];
}

/* ============================================================
   PUBLIC API
   ============================================================ */

export const gameAudio = {
  // ---- Volume ----
  setSfxVolume(v: number) { sfxVol = Math.max(0, Math.min(1, v)); },
  getSfxVolume() { return sfxVol; },
  setEnabled(v: boolean) {
    masterEnabled = v;
    if (!v) {
      stopHeartbeat();
      activeTracks.forEach((t) => {
        try { t.elA.pause(); t.elB.pause(); } catch {}
      });
    } else {
      resumeMusicPlayback();
    }
  },
  isEnabled() { return masterEnabled; },

  // ---- Decision Road SFX ----
  decisionSelect: sfxSelect,
  decisionCorrect: sfxCorrect,
  decisionIncorrect: sfxIncorrect,
  decisionAdvance: sfxAdvance,
  decisionFootstep: sfxFootstep,
  decisionJump: sfxJump,
  decisionVictory: sfxVictory,

  // ---- Lava SFX ----
  lavaSelect,
  lavaCorrect,
  lavaIncorrect,
  lavaRise,
  lavaTickChange,
  lavaDefeat,

  // ---- Heartbeat ----
  startHeartbeat,
  stopHeartbeat,

  // ---- Completion ----
  completion: sfxCompletion,

  // ---- Music ----
  startDecisionMusic: () => startMusic('decisiones'),
  startLavaMusic: () => startMusic('lava'),
  startLeagueMusic: () => startMusic('league'),
  startTierrasMusic: () => startMusic('tierras'),
  startAbismosMusic: () => startMusic('abismos'),
  stopMusic,

  // ---- Cleanup ----
  stopAll() {
    stopHeartbeat();
    stopMusic();
  },
};

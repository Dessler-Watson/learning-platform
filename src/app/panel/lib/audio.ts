'use client';

let enabled = true;

export type SoundName = 'click' | 'hover' | 'modalOpen' | 'modalClose' | 'confirm' | 'error' | 'navigate' | 'delete' | 'success' | 'create' | 'toggle' | 'copy' | 'submit' | 'select' | 'back' | 'start';

function synthTone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine', endFreq?: number, delayMs: number = 0) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delayMs / 1000);
    if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delayMs / 1000 + duration);
    gain.gain.setValueAtTime(0, ctx.currentTime + delayMs / 1000);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delayMs / 1000 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayMs / 1000 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delayMs / 1000);
    osc.stop(ctx.currentTime + delayMs / 1000 + duration + 0.01);
  } catch {}
}

const sounds: Record<SoundName, () => void> = {
  click: () => { synthTone(1200, 0.03, 0.1); },
  hover: () => { synthTone(1800, 0.08, 0.03); },
  modalOpen: () => { synthTone(400, 0.15, 0.1, 'sine', 700); },
  modalClose: () => { synthTone(800, 0.12, 0.08, 'sine', 500); },
  confirm: () => { synthTone(523, 0.2, 0.1); synthTone(659, 0.2, 0.08, 'sine', undefined, 50); },
  error: () => { synthTone(180, 0.25, 0.12, 'triangle'); },
  navigate: () => { synthTone(900, 0.06, 0.07, 'sine', 1100); },
  delete: () => { synthTone(500, 0.2, 0.12, 'triangle', 150); },
  success: () => { synthTone(523, 0.15, 0.08); synthTone(659, 0.15, 0.08, 'sine', undefined, 80); },
  create: () => { synthTone(440, 0.12, 0.08, 'sine', 660); },
  toggle: () => { synthTone(1400, 0.03, 0.09, 'sine', 1000); },
  copy: () => { synthTone(880, 0.06, 0.09, 'sine'); },
  submit: () => { synthTone(440, 0.15, 0.08); synthTone(880, 0.2, 0.1, 'sine', undefined, 120); },
  select: () => { synthTone(700, 0.06, 0.09, 'sine', 900); },
  back: () => { synthTone(1000, 0.08, 0.07, 'sine', 600); },
  start: () => { synthTone(392, 0.2, 0.08); synthTone(523, 0.25, 0.1, 'sine', undefined, 120); },
};

export const audioManager = {
  play(name: SoundName) {
    try { sounds[name](); } catch {}
  },
  playWelcome() {
    try { synthTone(523, 0.15, 0.08); synthTone(659, 0.15, 0.08, 'sine', undefined, 100); synthTone(784, 0.2, 0.1, 'sine', undefined, 200); } catch {}
  },
  startAmbient() {},
  onLogout() {
    try { synthTone(800, 0.12, 0.08, 'sine', 500); synthTone(500, 0.2, 0.06, 'triangle', 200); } catch {}
  },
  setEnabled(v: boolean) { enabled = v; },
  isEnabled() { return enabled; },
  toggle() { enabled = !enabled; return enabled; },
};

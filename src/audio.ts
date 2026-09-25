/**
 * Procedural sound engine — SFX + ambient music synthesized with the
 * Web Audio API. Zero audio assets, works offline.
 *
 * Must be unlocked from a user gesture (play button / tap) because of
 * browser autoplay policies: call `unlockAudio()` there.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let music: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Call from a user gesture to satisfy autoplay policies. */
export function unlockAudio() {
  ac();
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) stopMusic();
}

export function isMuted() {
  return muted;
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export type SfxName =
  | 'sword'
  | 'thunder'
  | 'coin'
  | 'horn'
  | 'chime'
  | 'click'
  | 'boom';

export function playSfx(name: SfxName) {
  const c = ac();
  if (!c || !master) return;
  try {
    const t = c.currentTime;
    switch (name) {
      case 'click': {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'square';
        o.frequency.value = 660;
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o.connect(g).connect(master!);
        o.start(t);
        o.stop(t + 0.07);
        break;
      }
      case 'sword': {
        // metallic clash: filtered noise + descending ping
        const n = c.createBufferSource();
        n.buffer = noiseBuffer(c, 0.25);
        const f = c.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 2800;
        const g = c.createGain();
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        n.connect(f).connect(g).connect(master!);
        n.start(t);
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(1900, t);
        o.frequency.exponentialRampToValueAtTime(850, t + 0.18);
        const g2 = c.createGain();
        g2.gain.setValueAtTime(0.12, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.connect(g2).connect(master!);
        o.start(t);
        o.stop(t + 0.22);
        break;
      }
      case 'thunder': {
        const n = c.createBufferSource();
        n.buffer = noiseBuffer(c, 1.4);
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(320, t);
        f.frequency.exponentialRampToValueAtTime(60, t + 1.2);
        const g = c.createGain();
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
        n.connect(f).connect(g).connect(master!);
        n.start(t);
        break;
      }
      case 'coin': {
        const seq: [number, number][] = [
          [1568, 0],
          [2093, 0.09],
        ];
        for (const [freq, dt] of seq) {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.14, t + dt);
          g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.3);
          o.connect(g).connect(master!);
          o.start(t + dt);
          o.stop(t + dt + 0.32);
        }
        break;
      }
      case 'horn': {
        // war horn: low saw swell
        for (const freq of [98, 147]) {
          const o = c.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = freq;
          const f = c.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = 420;
          const g = c.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.exponentialRampToValueAtTime(0.16, t + 0.25);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
          o.connect(f).connect(g).connect(master!);
          o.start(t);
          o.stop(t + 1.15);
        }
        break;
      }
      case 'chime': {
        // peace: soft major arpeggio
        const seq = [523.25, 659.25, 783.99];
        seq.forEach((freq, i) => {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = 'triangle';
          o.frequency.value = freq;
          const dt = i * 0.14;
          g.gain.setValueAtTime(0.001, t + dt);
          g.gain.exponentialRampToValueAtTime(0.12, t + dt + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.9);
          o.connect(g).connect(master!);
          o.start(t + dt);
          o.stop(t + dt + 0.95);
        });
        break;
      }
      case 'boom': {
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(28, t + 0.7);
        const g = c.createGain();
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        o.connect(g).connect(master!);
        o.start(t);
        o.stop(t + 0.85);
        break;
      }
    }
  } catch {
    /* audio is decorative — never crash the sim */
  }
}

/** Dark ambient drone loop. Idempotent. */
export function startMusic() {
  const c = ac();
  if (!c || !master || music) return;
  try {
    const g = c.createGain();
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.055, c.currentTime + 3);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 320;
    // slow breathing of the filter
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(f.frequency);
    const oscs: OscillatorNode[] = [];
    // A1 + E2 + A2 — dark minor drone
    for (const freq of [55, 82.41, 110]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.002);
      o.connect(f);
      o.start();
      oscs.push(o);
    }
    f.connect(g).connect(master!);
    lfo.start();
    music = {
      stop: () => {
        try {
          g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.8);
          setTimeout(() => {
            oscs.forEach((o) => o.stop());
            lfo.stop();
          }, 900);
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    /* ignore */
  }
}

export function stopMusic() {
  music?.stop();
  music = null;
}

export function isMusicPlaying() {
  return music !== null;
}

/**
 * Sound effects, synthesized in plain JavaScript: no audio files, no Web Audio
 * graph. A template lists cues (what sound, at which second); the theme picks
 * a style; `renderSoundtrack` turns them into PCM samples. The same samples
 * play in the preview and go into the exported file, and the same inputs
 * always give the same samples.
 */
import type { ThemeId } from './theme.ts';

export type SoundKind =
  /** Something arrives: a filtered noise sweep upwards. */
  | 'whoosh'
  /** Something leaves: a shorter sweep downwards. */
  | 'swoosh'
  /** A small element pops in. */
  | 'pop'
  /** A mouse click. */
  | 'click'
  /** A finger tap on a screen. */
  | 'tap'
  /** One keystroke of typed text. */
  | 'type'
  /** A notification bell. */
  | 'bell'
  /** A rising two-note confirmation. */
  | 'chime'
  /** A short beep: counters, ticks, small reveals. */
  | 'blip';

export const SOUND_KINDS: readonly SoundKind[] = [
  'whoosh',
  'swoosh',
  'pop',
  'click',
  'tap',
  'type',
  'bell',
  'chime',
  'blip',
];

export interface SoundCue {
  /** Start time in seconds. */
  readonly t: number;
  readonly kind: SoundKind;
  /** Loudness relative to the kind's default (1). */
  readonly gain?: number;
  /** Pitch shift in semitones. */
  readonly pitch?: number;
}

/**
 * How a theme sounds: crisp sine beeps (digital), bouncy and bright
 * (cartoon), muted and gentle (soft), or 8-bit square waves (chip).
 */
export type SoundStyle = 'digital' | 'cartoon' | 'soft' | 'chip';

export const SOUND_STYLES: Record<ThemeId, SoundStyle> = {
  tech: 'digital',
  pop: 'cartoon',
  sade: 'soft',
  pixel: 'chip',
};

export interface Soundtrack {
  readonly sampleRate: number;
  /** Left and right channels, -1 to 1. */
  readonly channels: readonly [Float32Array, Float32Array];
}

export interface SoundtrackOptions {
  readonly duration: number;
  readonly style: SoundStyle;
  /** Master volume, 0 to 1. */
  readonly volume?: number;
  readonly sampleRate?: number;
}

export const SOUND_SAMPLE_RATE = 48_000;

/** Deterministic white noise in -1..1 (xorshift). */
function noise(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 0xffffffff) * 2 - 1;
  };
}

/** A state-variable filter: one sample in, low-, band- and high-pass out. */
function svf() {
  let low = 0;
  let band = 0;
  return (input: number, cutoff: number, sampleRate: number, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff, sampleRate / 6)) / sampleRate);
    low += f * band;
    const high = input - low - q * band;
    band += f * high;
    return { low, band, high };
  };
}

/** Attack, then exponential decay; 0 before the start. */
const envelope = (t: number, attack: number, decay: number) =>
  t < 0 ? 0 : t < attack ? t / attack : Math.exp(-(t - attack) / decay);

const square = (phase: number, duty = 0.5) => (phase % 1 < duty ? 1 : -1);

/** Rounds to `levels` steps, the 8-bit crunch of the chip style. */
const crush = (x: number, levels = 16) => Math.round(x * levels) / levels;

const ratio = (semitones: number) => 2 ** (semitones / 12);

/** One sound, `length` seconds long, as mono samples. */
function voice(kind: SoundKind, style: SoundStyle, cue: SoundCue, sr: number, seed: number) {
  const p = ratio(cue.pitch ?? 0);
  const rand = noise(seed);
  const filter = svf();
  const chip = style === 'chip';
  const soft = style === 'soft';
  const cartoon = style === 'cartoon';

  type Sample = (t: number) => number;
  const shapes: Record<SoundKind, { length: number; sample: Sample }> = {
    whoosh: {
      length: soft ? 0.5 : 0.42,
      sample: (t) => {
        const k = t / 0.42;
        const env = Math.sin(Math.PI * Math.min(1, k)) ** 2;
        const cutoff = (chip ? 400 : 600) + 5200 * k ** 1.5;
        const { band } = filter(rand(), cutoff * p, sr, 0.5);
        const tone = style === 'digital' ? 0.25 * Math.sin(2 * Math.PI * (300 + 900 * k) * t) : 0;
        return (chip ? crush(band, 8) : band) * env * 0.9 + tone * env;
      },
    },
    swoosh: {
      length: 0.3,
      sample: (t) => {
        const k = t / 0.3;
        const env = Math.sin(Math.PI * Math.min(1, k)) ** 2;
        const { band } = filter(rand(), (4200 - 3400 * k) * p, sr, 0.6);
        return (chip ? crush(band, 8) : band) * env * 0.7;
      },
    },
    pop: {
      length: cartoon ? 0.16 : 0.1,
      sample: (t) => {
        const drop = cartoon ? 900 * Math.exp(-t / 0.03) : 420 * Math.exp(-t / 0.02);
        const freq = (cartoon ? 260 : 320) * p + drop;
        const phase = freq * t;
        const wave = chip ? square(phase) * 0.5 : Math.sin(2 * Math.PI * phase);
        return wave * envelope(t, 0.002, cartoon ? 0.05 : 0.03) * 0.8;
      },
    },
    click: {
      length: 0.05,
      sample: (t) => {
        if (chip) return square(1800 * p * t, 0.25) * envelope(t, 0.001, 0.012) * 0.4;
        const { high } = filter(rand(), 3000, sr);
        const body = Math.sin(2 * Math.PI * (style === 'digital' ? 2400 : 1400) * p * t);
        const level = soft ? 0.35 : 0.6;
        return (
          (high * 0.7 * envelope(t, 0.0005, 0.004) + body * 0.4 * envelope(t, 0.001, 0.01)) * level
        );
      },
    },
    tap: {
      length: 0.06,
      sample: (t) => {
        if (chip) return square(900 * p * t) * envelope(t, 0.001, 0.015) * 0.35;
        const { low } = filter(rand(), 1600, sr);
        const thud = Math.sin(2 * Math.PI * 180 * p * t);
        return (
          (low * 0.9 * envelope(t, 0.001, 0.008) + thud * 0.5 * envelope(t, 0.002, 0.02)) * 0.7
        );
      },
    },
    type: {
      length: 0.04,
      sample: (t) => {
        if (chip)
          return square((1200 + 400 * (seed % 3)) * p * t, 0.5) * envelope(t, 0.001, 0.008) * 0.25;
        const { band } = filter(rand(), (2600 + 900 * ((seed % 5) / 5)) * p, sr, 0.4);
        const thock = Math.sin(2 * Math.PI * 140 * t) * envelope(t, 0.001, 0.01);
        return (band * envelope(t, 0.0005, 0.006) * 1.2 + thock * 0.3) * (soft ? 0.4 : 0.55);
      },
    },
    bell: {
      length: 1.2,
      sample: (t) => {
        const f = (chip ? 1046 : 1318) * p;
        if (chip)
          return (
            crush(square(f * t) * 0.3 + square(f * 1.5 * t) * 0.15, 8) * envelope(t, 0.002, 0.35)
          );
        // Bell partials: the fundamental and two inharmonic overtones.
        const sum =
          Math.sin(2 * Math.PI * f * t) +
          0.5 * Math.sin(2 * Math.PI * f * 2.76 * t) +
          0.25 * Math.sin(2 * Math.PI * f * 5.4 * t);
        return sum * envelope(t, 0.002, soft ? 0.5 : 0.4) * 0.35;
      },
    },
    chime: {
      length: 0.7,
      sample: (t) => {
        // Two notes a major third apart, the second 90 ms later.
        const note = (f: number, start: number) => {
          const u = t - start;
          if (u < 0) return 0;
          const wave = chip
            ? square(f * u) * 0.5
            : Math.sin(2 * Math.PI * f * u) + 0.3 * Math.sin(4 * Math.PI * f * u);
          return wave * envelope(u, 0.004, cartoon ? 0.22 : 0.3);
        };
        const base = (style === 'digital' ? 880 : 784) * p;
        return (note(base, 0) + note(base * 1.26, 0.09)) * 0.3;
      },
    },
    blip: {
      length: 0.08,
      sample: (t) => {
        const f = (style === 'digital' ? 1760 : 1320) * p;
        const wave = chip ? square(f * t, 0.25) * 0.6 : Math.sin(2 * Math.PI * f * t);
        return wave * envelope(t, 0.002, 0.02) * 0.4;
      },
    },
  };

  const shape = shapes[kind];
  const out = new Float32Array(Math.ceil(shape.length * sr));
  let tail = 0;
  for (let i = 0; i < out.length; i++) {
    let x = shape.sample(i / sr);
    // The soft style takes the edge off everything.
    if (soft) {
      tail += (x - tail) * 0.35;
      x = tail;
    }
    out[i] = x;
  }
  return out;
}

/**
 * Mixes `cues` into a stereo soundtrack `duration` seconds long. Sounds that
 * would run past the end are cut there.
 */
export function renderSoundtrack(cues: readonly SoundCue[], o: SoundtrackOptions): Soundtrack {
  const sr = o.sampleRate ?? SOUND_SAMPLE_RATE;
  const length = Math.max(1, Math.round(o.duration * sr));
  const mix = new Float32Array(length);
  cues.forEach((cue, index) => {
    if (!(cue.t >= 0) || cue.t >= o.duration) return;
    const samples = voice(cue.kind, o.style, cue, sr, index + 1);
    const start = Math.round(cue.t * sr);
    const gain = cue.gain ?? 1;
    for (let i = 0; i < samples.length && start + i < length; i++)
      mix[start + i] = (mix[start + i] ?? 0) + (samples[i] ?? 0) * gain;
  });
  // Master volume, then a gentle limiter so stacked cues never clip.
  const volume = o.volume ?? 1;
  for (let i = 0; i < length; i++) mix[i] = Math.tanh((mix[i] ?? 0) * volume);
  return { sampleRate: sr, channels: [mix, mix.slice()] };
}

/** 16-bit little-endian interleaved PCM, as WAV and QuickTime `sowt` store it. */
export function toPcm16(track: Soundtrack): Uint8Array {
  const [left, right] = track.channels;
  const out = new DataView(new ArrayBuffer(left.length * 4));
  for (let i = 0; i < left.length; i++) {
    out.setInt16(i * 4, Math.round(Math.max(-1, Math.min(1, left[i] ?? 0)) * 32767), true);
    out.setInt16(i * 4 + 2, Math.round(Math.max(-1, Math.min(1, right[i] ?? 0)) * 32767), true);
  }
  return new Uint8Array(out.buffer);
}

/** A WAV file of the soundtrack (16-bit stereo PCM). */
export function toWav(track: Soundtrack): Blob {
  const pcm = toPcm16(track);
  const header = new DataView(new ArrayBuffer(44));
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) header.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, 'RIFF');
  header.setUint32(4, 36 + pcm.length, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true); // PCM
  header.setUint16(22, 2, true); // stereo
  header.setUint32(24, track.sampleRate, true);
  header.setUint32(28, track.sampleRate * 4, true);
  header.setUint16(32, 4, true);
  header.setUint16(34, 16, true);
  text(36, 'data');
  header.setUint32(40, pcm.length, true);
  return new Blob([header.buffer, pcm as Uint8Array<ArrayBuffer>], { type: 'audio/wav' });
}

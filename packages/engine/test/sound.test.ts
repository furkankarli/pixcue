import { describe, expect, it } from 'vitest';
import { renderSoundtrack, SOUND_KINDS, type SoundStyle, toPcm16, toWav } from '../src/sound.ts';

const STYLES: readonly SoundStyle[] = ['digital', 'cartoon', 'soft', 'chip'];
const peak = (a: Float32Array) => a.reduce((m, x) => Math.max(m, Math.abs(x)), 0);

describe('soundtrack', () => {
  it('is silent without cues and as long as the clip', () => {
    const track = renderSoundtrack([], { duration: 2, style: 'digital', sampleRate: 8000 });
    expect(track.channels[0].length).toBe(16000);
    expect(peak(track.channels[0])).toBe(0);
  });

  it('is the same every time', () => {
    const cues = [
      { t: 0.1, kind: 'whoosh' as const },
      { t: 0.5, kind: 'type' as const },
    ];
    const a = renderSoundtrack(cues, { duration: 1, style: 'cartoon' });
    const b = renderSoundtrack(cues, { duration: 1, style: 'cartoon' });
    expect(a.channels[0]).toEqual(b.channels[0]);
  });

  it('starts each sound at its cue', () => {
    const sr = 48000;
    const track = renderSoundtrack([{ t: 0.5, kind: 'click' }], { duration: 1, style: 'digital' });
    const first = track.channels[0].findIndex((x) => Math.abs(x) > 1e-4);
    expect(first).toBeGreaterThanOrEqual(0.5 * sr);
    expect(first).toBeLessThan(0.5 * sr + 100);
  });

  it.each(STYLES)('gives every kind an audible, unclipped sound in the %s style', (style) => {
    for (const kind of SOUND_KINDS) {
      const track = renderSoundtrack([{ t: 0, kind }], { duration: 1.5, style });
      const p = peak(track.channels[0]);
      expect(p, kind).toBeGreaterThan(0.05);
      expect(p, kind).toBeLessThan(1);
    }
  });

  it('cuts sounds at the end and ignores cues outside the clip', () => {
    const track = renderSoundtrack(
      [
        { t: -1, kind: 'pop' },
        { t: 0.95, kind: 'bell' },
        { t: 3, kind: 'pop' },
      ],
      { duration: 1, style: 'soft', sampleRate: 8000 },
    );
    expect(track.channels[0].length).toBe(8000);
    expect(peak(track.channels[0].subarray(0, 7000))).toBe(0);
  });

  it('applies the master volume', () => {
    const cues = [{ t: 0, kind: 'blip' as const }];
    const loud = peak(renderSoundtrack(cues, { duration: 0.2, style: 'chip' }).channels[0]);
    const quiet = peak(
      renderSoundtrack(cues, { duration: 0.2, style: 'chip', volume: 0.25 }).channels[0],
    );
    expect(quiet).toBeLessThan(loud * 0.4);
  });
});

describe('PCM and WAV', () => {
  it('writes 16-bit stereo samples and a valid WAV header', async () => {
    const track = renderSoundtrack([{ t: 0, kind: 'pop' }], {
      duration: 0.25,
      style: 'cartoon',
      sampleRate: 8000,
    });
    expect(toPcm16(track).length).toBe(2000 * 4);
    const wav = new DataView(await toWav(track).arrayBuffer());
    const text = (at: number) => String.fromCharCode(...new Uint8Array(wav.buffer, at, 4));
    expect(text(0)).toBe('RIFF');
    expect(text(8)).toBe('WAVE');
    expect(wav.getUint16(22, true)).toBe(2);
    expect(wav.getUint32(24, true)).toBe(8000);
    expect(wav.getUint32(40, true)).toBe(8000);
  });
});

import { describe, expect, it } from 'vitest';
import { buildAvcC, ensureAvcC, isValidAvcC, nalUnits } from '../src/mux/avc.ts';

const hex = (s: string) =>
  Uint8Array.from(s.replace(/\s+/g, '').match(/../g) ?? [], (h) => Number.parseInt(h, 16));

// Captured from Firefox's WebCodecs H.264 encoder (1920×1080 High 4.0).
const FIREFOX_AVCC =
  hex(`0164 0028 0301 001a 6767 6400 28ac d940 7802 27e5 8400 0003 0004 007a 1200 3c60
  c658 0100 0668 68eb ecb2 2c`);
const SPS = hex('6764 0028 acd9 4078 0227 e584 0000 0300 0400 7a12 003c 60c6 58');
const PPS = hex('68eb ecb2 2c');
const KEYFRAME = hex(`0000 0019 ${'6764 0028 acd9 4078 0227 e584 0000 0300 0400 7a12 003c 60c6 58'}
  0000 0005 68eb ecb2 2c 0000 0004 6588 8400`);

describe('avcC', () => {
  it('detects the malformed avcC some browsers produce', () => {
    expect(isValidAvcC(FIREFOX_AVCC)).toBe(false);
  });

  it('splits length-prefixed samples into NAL units', () => {
    expect(nalUnits(KEYFRAME).map((u) => (u[0] ?? 0) & 0x1f)).toEqual([7, 8, 5]);
  });

  it('builds a standard avcC with the High profile extension', () => {
    const avcC = buildAvcC(SPS, PPS);
    expect(isValidAvcC(avcC)).toBe(true);
    expect([...avcC.subarray(0, 6)]).toEqual([1, 0x64, 0, 0x28, 0xff, 0xe1]);
    // chroma 4:2:0, 8-bit luma and chroma, no SPS extensions
    expect([...avcC.subarray(-4)]).toEqual([0xfd, 0xf8, 0xf8, 0]);
  });

  it('repairs a malformed avcC from the first keyframe and keeps valid ones', () => {
    const repaired = ensureAvcC(FIREFOX_AVCC, KEYFRAME);
    expect(repaired).toEqual(buildAvcC(SPS, PPS));
    expect(ensureAvcC(repaired, KEYFRAME)).toBe(repaired);
    expect(ensureAvcC(FIREFOX_AVCC, undefined)).toBe(FIREFOX_AVCC);
  });
});

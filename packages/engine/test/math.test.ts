import { describe, expect, it } from 'vitest';
import {
  clamp,
  easeIn,
  easeInBack,
  easeInExpo,
  easeInOut,
  easeOut,
  easeOutBack,
  easeOutExpo,
  envelope,
  linear,
  seededRandom,
} from '../src/math.ts';

describe('clamp', () => {
  it('limits to [0, 1] by default', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(0.4)).toBe(0.4);
    expect(clamp(3)).toBe(1);
  });

  it('accepts a custom range', () => {
    expect(clamp(20, 0, 10)).toBe(10);
  });
});

describe('easings', () => {
  it.each([linear, easeOut, easeIn, easeInOut, easeOutBack, easeInBack, easeOutExpo, easeInExpo])(
    '%o starts at 0 and ends at 1',
    (e) => {
      expect(e(0)).toBeCloseTo(0, 10);
      expect(e(1)).toBeCloseTo(1, 10);
      expect(e(-5)).toBeCloseTo(0, 10);
      expect(e(5)).toBeCloseTo(1, 10);
    },
  );

  it('shapes the middle of the curve', () => {
    expect(easeOut(0.5)).toBeCloseTo(0.875);
    expect(easeIn(0.5)).toBeCloseTo(0.125);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });

  it('starts exactly at 0, so hidden elements stay hidden', () => {
    for (const e of [easeOut, easeIn, easeInOut, easeOutBack, easeInBack, easeOutExpo, easeInExpo])
      expect(e(0)).toBe(0);
  });

  it('pulls back below 0 with easeInBack', () => {
    expect(Math.min(...[0.1, 0.2, 0.3, 0.4].map(easeInBack))).toBeLessThan(0);
  });

  it('overshoots with easeOutBack', () => {
    expect(Math.max(...[0.6, 0.7, 0.8, 0.9].map(easeOutBack))).toBeGreaterThan(1);
  });
});

describe('envelope', () => {
  const at = (t: number) => envelope(t, 5, 0, 0.5, 1, 0.5, linear, linear);

  it('is 0 before the in animation', () => {
    expect(at(-1)).toBe(0);
  });

  it('ramps in, holds, then ramps out', () => {
    expect(at(0.25)).toBeCloseTo(0.5);
    expect(at(2)).toBe(1);
    expect(at(4.25)).toBeCloseTo(0.5);
    expect(at(4.5)).toBeCloseTo(0);
    expect(at(5)).toBe(0);
  });
});

describe('seededRandom', () => {
  it('is deterministic and within [0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const v = seededRandom(i);
      expect(v).toBe(seededRandom(i));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

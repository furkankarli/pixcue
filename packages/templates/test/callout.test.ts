import { describe, expect, it } from 'vitest';
import { callout } from '../src/callout.ts';
import { paintedPixels, renderFrame } from './render-helpers.ts';

describe('callout', () => {
  it.each(['tech', 'pixel'] as const)('mirrors when pointing left (%s)', (theme) => {
    const at = (direction: string) =>
      renderFrame({ template: callout, theme, preset: 'youtube', t: 2, overrides: { direction } });
    const right = at('right');
    const left = at('left');
    expect(left.bounds).toEqual(right.bounds);
    const painted = (r: typeof right) =>
      paintedPixels(r.ctx, r.frame.pixelWidth, r.frame.pixelHeight);
    expect(painted(left)).toBeGreaterThan(painted(right) * 0.9);
    expect(painted(left)).toBeLessThan(painted(right) * 1.1);
  });
});

import { THEME_IDS } from '@pixcue/engine';
import { describe, expect, it } from 'vitest';
import { lowerThird, lowerThirdDefaults } from '../src/lower-third.ts';
import { paintedPixels, renderFrame } from './render-helpers.ts';

const duration = 5;

describe.each(THEME_IDS)('lower third (%s)', (theme) => {
  const at = (t: number, fields = lowerThirdDefaults) =>
    renderFrame({ scene: lowerThird, fields, duration, theme, preset: 'youtube', t });

  it('renders every quarter second of the clip without errors', () => {
    for (let t = 0; t <= duration; t += 0.25) expect(() => at(t)).not.toThrow();
  });

  it('starts and ends empty, and is visible while holding', () => {
    const empty = (t: number) => {
      const { ctx, frame } = at(t);
      return paintedPixels(ctx, frame.pixelWidth, frame.pixelHeight);
    };
    expect(empty(0)).toBe(0);
    expect(empty(duration)).toBe(0);
    expect(empty(2.5)).toBeGreaterThan(10_000);
  });

  it('hides the tag when it is empty', () => {
    const withTag = at(2.5).bounds;
    const withoutTag = at(2.5, { ...lowerThirdDefaults, tag: '' }).bounds;
    expect(withoutTag).toEqual(withTag);
  });
});

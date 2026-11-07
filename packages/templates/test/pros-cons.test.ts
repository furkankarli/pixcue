import { describe, expect, it } from 'vitest';
import { prosCons } from '../src/pros-cons.ts';
import { renderFrame } from './render-helpers.ts';

describe('pros and cons', () => {
  it.each(['tech', 'pixel'] as const)(
    'sits side by side in 16:9 and stacks in vertical video (%s)',
    (theme) => {
      const wide = renderFrame({ template: prosCons, theme, preset: 'youtube', t: 3 }).bounds;
      const tall = renderFrame({ template: prosCons, theme, preset: 'vertical', t: 3 }).bounds;
      expect(wide.width).toBeGreaterThan(wide.height);
      expect(tall.height).toBeGreaterThan(tall.width);
    },
  );
});

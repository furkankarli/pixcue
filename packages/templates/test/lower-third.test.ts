import { describe, expect, it } from 'vitest';
import { lowerThird } from '../src/lower-third.ts';
import { renderFrame } from './render-helpers.ts';

describe('lower third', () => {
  it('hides the tag when it is empty without moving the panel', () => {
    for (const theme of ['tech', 'pixel'] as const) {
      const at = (tag?: string) =>
        renderFrame({
          template: lowerThird,
          theme,
          preset: 'youtube',
          t: 2.5,
          overrides: tag === undefined ? {} : { tag },
        }).bounds;
      expect(at('')).toEqual(at());
    }
  });
});

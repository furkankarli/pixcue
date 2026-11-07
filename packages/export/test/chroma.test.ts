import { describe, expect, it } from 'vitest';
import { composeOnColor, conflictsWithKey, HARD_EDGE_CUTOFF } from '../src/chroma.ts';

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba);

describe('composeOnColor', () => {
  it('blends semi-transparent pixels onto the color', () => {
    const p = px(255, 0, 0, 128, 0, 0, 0, 0);
    composeOnColor(p, '#00FF00', false);
    expect([...p]).toEqual([128, 127, 0, 255, 0, 255, 0, 255]);
  });

  it('makes edges hard in chroma-key mode: no pixel is a mix of graphic and key', () => {
    const p = px(
      255,
      255,
      255,
      255, // opaque text
      255,
      255,
      255,
      HARD_EDGE_CUTOFF, // strong edge: kept
      0,
      0,
      0,
      150, // soft shadow: dropped
      255,
      255,
      255,
      40, // faint anti-aliasing: dropped
    );
    composeOnColor(p, '#FF00FF', true);
    expect([...p]).toEqual([
      255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 255, 255, 255, 0, 255, 255,
    ]);
  });
});

describe('conflictsWithKey', () => {
  it('flags graphic colors a keyer would remove', () => {
    expect(conflictsWithKey('#22C55E', 'green')).toBe(true);
    expect(conflictsWithKey('#22C55E', 'magenta')).toBe(false);
    expect(conflictsWithKey('#3D5AFE', 'blue')).toBe(true);
    expect(conflictsWithKey('#FFFFFF', 'green')).toBe(false);
  });
});

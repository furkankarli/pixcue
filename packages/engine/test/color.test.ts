import { describe, expect, it } from 'vitest';
import { hexToRgb, luminance, mix, onColor, parseColor, toHex } from '../src/color.ts';

describe('color', () => {
  it('parses short and long hex', () => {
    expect(hexToRgb('#0af')).toEqual([0, 170, 255]);
    expect(hexToRgb('00E5FF')).toEqual([0, 229, 255]);
  });

  it('parses rgb() and rgba()', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30, 255]);
    expect(parseColor('rgba(0,0,0,.55)')).toEqual([0, 0, 0, 140]);
  });

  it('falls back to opaque black for unknown formats', () => {
    expect(parseColor('tomato')).toEqual([0, 0, 0, 255]);
  });

  it('formats as #rrggbb', () => {
    expect(toHex('rgba(255, 0, 16, .5)')).toBe('#ff0010');
  });

  it('mixes two colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#E8100E', '#000000', 0)).toBe('#e8100e');
  });

  it('computes luminance and a readable text color', () => {
    expect(luminance('#000')).toBe(0);
    expect(luminance('#fff')).toBeCloseTo(1);
    expect(onColor('#FFD21F')).toBe('#111111');
    expect(onColor('#3D5AFE')).toBe('#FFFFFF');
  });
});

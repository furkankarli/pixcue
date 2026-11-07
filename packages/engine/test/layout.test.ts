import { describe, expect, it } from 'vitest';
import { createFrame } from '../src/frame.ts';
import { fitScale, place } from '../src/layout.ts';

const youtube = createFrame('youtube');
const tiktok = createFrame('tiktok');
const none = { x: 0, y: 0 };

describe('place', () => {
  const size = { w: 400, h: 200 };

  it('anchors to the corners of the safe area', () => {
    expect(place(size, youtube, { position: 'tl', offset: none })).toEqual({ x: 96, y: 72 });
    expect(place(size, youtube, { position: 'br', offset: none })).toEqual({
      x: 1920 - 96 - 400,
      y: 1080 - 72 - 200,
    });
  });

  it('centers inside the safe area', () => {
    expect(place(size, youtube, { position: 'mc', offset: none })).toEqual({ x: 760, y: 440 });
  });

  it('keeps vertical graphics left of the action buttons and above the captions', () => {
    const p = place(size, tiktok, { position: 'br', offset: none });
    expect(p.x + size.w).toBe(1080 - 150);
    expect(p.y + size.h).toBe(1920 - 440);
  });

  it('applies the drag offset', () => {
    expect(place(size, youtube, { position: 'tl', offset: { x: 10, y: -5 } })).toEqual({
      x: 106,
      y: 67,
    });
  });
});

describe('fitScale', () => {
  it('keeps the user scale when the graphic fits', () => {
    expect(fitScale({ w: 500, h: 200 }, youtube, 1.2)).toBe(1.2);
  });

  it('shrinks graphics wider than the safe area', () => {
    const s = fitScale({ w: 1740, h: 200 }, tiktok, 1);
    expect(1740 * s).toBeCloseTo(tiktok.safeArea.width);
  });
});

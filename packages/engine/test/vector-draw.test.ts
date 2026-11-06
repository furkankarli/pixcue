import { describe, expect, it } from 'vitest';
import type { Ctx2D } from '../src/canvas.ts';
import { blockReveal, letterPositions, withAlpha, withClip } from '../src/vector/draw.ts';
import { createTestCanvas } from '../testing/index.ts';

function alphaAt(ctx: Ctx2D, x: number, y: number): number {
  return ctx.getImageData(x, y, 1, 1).data[3] ?? 0;
}

describe('withClip', () => {
  it('only paints inside the rectangle', () => {
    const { ctx } = createTestCanvas(20, 20);
    withClip(ctx, 0, 0, 10, 20, () => {
      ctx.fillStyle = '#f00';
      ctx.fillRect(0, 0, 20, 20);
    });
    expect(alphaAt(ctx, 5, 5)).toBe(255);
    expect(alphaAt(ctx, 15, 5)).toBe(0);
  });
});

describe('withAlpha', () => {
  it('multiplies opacity and restores it afterwards', () => {
    const { ctx } = createTestCanvas(4, 4);
    withAlpha(ctx, 0.5, () => expect(ctx.globalAlpha).toBeCloseTo(0.5));
    expect(ctx.globalAlpha).toBe(1);
  });
});

describe('letterPositions', () => {
  it('keeps Turkish letters whole and starts at 0', () => {
    const { ctx } = createTestCanvas(4, 4);
    const r = letterPositions(ctx, 'İğne', '700 40px Manrope');
    expect(r.chars).toEqual(['İ', 'ğ', 'n', 'e']);
    expect(r.xs[0]).toBe(0);
    expect(r.xs).toEqual([...r.xs].sort((a, b) => a - b));
    expect(r.width).toBeGreaterThan(r.xs[3] ?? 0);
  });
});

describe('blockReveal', () => {
  const run = (p: number) => {
    const { ctx } = createTestCanvas(100, 20);
    let drew = false;
    blockReveal(ctx, p, 0, 0, 100, 20, '#00f', () => {
      drew = true;
    });
    return { ctx, drew };
  };

  it('draws nothing before it starts', () => {
    const { ctx, drew } = run(0);
    expect(drew).toBe(false);
    expect(alphaAt(ctx, 1, 10)).toBe(0);
  });

  it('grows the bar during the first half', () => {
    const { ctx, drew } = run(0.25);
    expect(drew).toBe(false);
    expect(alphaAt(ctx, 1, 10)).toBe(255);
    expect(alphaAt(ctx, 98, 10)).toBe(0);
  });

  it('uncovers the content during the second half', () => {
    expect(run(0.75).drew).toBe(true);
  });
});

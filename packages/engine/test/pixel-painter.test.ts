import { describe, expect, it } from 'vitest';
import { createPainter } from '../src/pixel/painter.ts';
import { bitmapSprite } from '../src/pixel/raster.ts';
import { createTestCanvas } from '../testing/index.ts';

const opaque = (data: Uint8ClampedArray, w: number, x: number, y: number) =>
  (data[(y * w + x) * 4 + 3] ?? 0) > 0;

describe('createPainter', () => {
  it('draws relative to the graphic offset', () => {
    const { ctx } = createTestCanvas(20, 20);
    const P = createPainter(ctx, 5, 6, 3);
    P.rect(1, 1, 2, 2, '#fff');
    const d = ctx.getImageData(0, 0, 20, 20).data;
    expect(opaque(d, 20, 6, 7)).toBe(true);
    expect(opaque(d, 20, 5, 6)).toBe(false);
  });

  it('draws pops on flush at full resolution, scaled around their center', () => {
    const grid = createTestCanvas(10, 10);
    const full = createTestCanvas(60, 60);
    const P = createPainter(grid.ctx, 0, 0, 6);
    const dot = bitmapSprite(['X'], { X: '#f00' });
    P.pop(dot, 4, 4, 6);
    P.pop(dot, 0, 0, 0); // hidden
    P.flush(full.ctx);
    const d = full.ctx.getImageData(0, 0, 60, 60).data;
    // center of grid pixel (4,4) is at (27,27) in output; a 6× pop covers 24–29
    expect(opaque(d, 60, 24, 24)).toBe(true);
    expect(opaque(d, 60, 29, 29)).toBe(true);
    expect(opaque(d, 60, 30, 30)).toBe(false);
    expect(opaque(d, 60, 0, 0)).toBe(false);
  });
});

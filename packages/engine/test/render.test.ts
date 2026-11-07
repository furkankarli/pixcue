import { describe, expect, it } from 'vitest';
import type { Ctx2D } from '../src/canvas.ts';
import { createFrame, type FramePresetId } from '../src/frame.ts';
import type { Layout } from '../src/layout.ts';
import { render, type Scene } from '../src/render.ts';
import { resolveTheme, type ThemeId } from '../src/theme.ts';
import { createTestCanvas } from '../testing/index.ts';

/** A solid block: 400×100 design units, or 40×10 grid cells in pixel mode. */
const block: Scene<{ color: string }> = {
  vector: {
    measure: () => ({ w: 400, h: 100 }),
    draw(c, _t, { fields }) {
      c.fillStyle = fields.color;
      c.fillRect(0, 0, 400, 100);
    },
  },
  pixel: {
    measure: () => ({ w: 40, h: 10 }),
    draw(P, _t, { fields }) {
      P.rect(0, 0, 40, 10, fields.color);
    },
  },
};

const layout: Layout = { position: 'bl', offset: { x: 0, y: 0 }, scale: 1 };

function run(
  preset: FramePresetId,
  theme: ThemeId,
  overrides: Partial<Layout> = {},
  background?: string,
) {
  const frame = createFrame(preset);
  const { ctx } = createTestCanvas(frame.pixelWidth, frame.pixelHeight);
  const bounds = render(ctx, 1, {
    frame,
    theme: resolveTheme(theme),
    scene: block,
    fields: { color: '#ff0000' },
    duration: 5,
    layout: { ...layout, ...overrides },
    background: background ? { kind: 'color', color: background } : undefined,
  });
  return { ctx, frame, bounds };
}

const pixelAt = (ctx: Ctx2D, x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);

describe('render', () => {
  it('places vector graphics at the safe-area anchor', () => {
    const { bounds, ctx } = run('youtube', 'tech');
    expect(bounds).toEqual({ x: 96, y: 1080 - 72 - 100, width: 400, height: 100 });
    expect(pixelAt(ctx, 100, 1000)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(ctx, 90, 1000)).toEqual([0, 0, 0, 0]);
  });

  it('renders 4K at twice the pixel size of 1080p', () => {
    const { bounds } = run('youtube-4k', 'sade');
    expect(bounds).toEqual({ x: 192, y: 2 * (1080 - 72 - 100), width: 800, height: 200 });
  });

  it('respects vertical safe areas', () => {
    const { bounds, frame } = run('tiktok', 'pop', { position: 'br' });
    expect(bounds.x + bounds.width).toBe(frame.pixelWidth - 150);
    expect(bounds.y + bounds.height).toBe(frame.pixelHeight - 440);
  });

  it('shrinks graphics that do not fit the safe area', () => {
    const { bounds, frame } = run('tiktok', 'tech', { scale: 3 });
    expect(bounds.width).toBeCloseTo(frame.safeArea.width);
  });

  it('draws the pixel theme on a grid of 6-pixel cells at 1080p', () => {
    const { bounds, ctx } = run('youtube', 'pixel');
    expect(bounds.width).toBe(240);
    expect(bounds.height).toBe(60);
    expect(bounds.x % 6).toBe(0);
    expect(pixelAt(ctx, bounds.x + 1, bounds.y + 1)).toEqual([255, 0, 0, 255]);
  });

  it('doubles pixel cells at 4K', () => {
    expect(run('youtube-4k', 'pixel').bounds.width).toBe(480);
  });

  it('paints a solid background for green-screen exports', () => {
    const { ctx } = run('square', 'tech', {}, '#00FF00');
    expect(pixelAt(ctx, 0, 0)).toEqual([0, 255, 0, 255]);
  });

  it('is deterministic', () => {
    const a = run('reels', 'pixel').ctx.getImageData(0, 0, 1080, 1920).data;
    const b = run('reels', 'pixel').ctx.getImageData(0, 0, 1080, 1920).data;
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });
});

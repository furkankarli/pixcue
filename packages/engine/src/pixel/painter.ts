import type { Ctx2D } from '../canvas.ts';
import type { PixelText, Sprite } from './raster.ts';

/**
 * Draws on the low-resolution pixel grid, offset to the graphic's position.
 * Sprites that "pop" (scale up in whole steps) are collected and drawn at full
 * resolution by `flush`, after the grid has been scaled up.
 */
export interface Painter {
  /** Size of one grid pixel in output pixels. */
  readonly px: number;
  /** Where the graphic's origin sits on the grid, in cells. */
  readonly origin: { readonly x: number; readonly y: number };
  /** Size of the whole frame's grid, in cells (for animating in from off-screen). */
  readonly grid: { readonly width: number; readonly height: number };
  rect(x: number, y: number, w: number, h: number, color: string): void;
  /** Draws a sprite, or the part of it inside the source rectangle. */
  img(s: Sprite, x: number, y: number, sx?: number, sy?: number, sw?: number, sh?: number): void;
  /** Draws the first `n` characters of rasterized text. */
  text(s: PixelText, x: number, y: number, n: number): void;
  /** Draws a typing caret after character `n`, blinking once typing has finished. */
  caret(
    s: PixelText,
    x: number,
    y: number,
    n: number,
    color: string,
    t: number,
    start: number,
    blinkUntil: number,
  ): void;
  /** Queues a sprite scaled `k` times (centered) for `flush`; 0 hides it. */
  pop(s: Sprite, x: number, y: number, k: number): void;
  clip(x: number, y: number, w: number, h: number): void;
  unclip(): void;
  /** A one-pixel (or plus-shaped, `big`) spark with a black outline. */
  spark(x: number, y: number, big: boolean, color: string): void;
  /** Draws the first `n` points of a 2×2-pixel line with a black outline. */
  line(points: readonly (readonly [number, number])[], n: number, color: string): void;
  /** Draws queued pops onto the full-resolution context. */
  flush(ctx: Ctx2D): void;
}

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function createPainter(
  c: Ctx2D,
  ox: number,
  oy: number,
  px: number,
  gridWidth = 0,
  gridHeight = 0,
): Painter {
  const pops: [Sprite, number, number, number][] = [];
  const P: Painter = {
    px,
    origin: { x: ox, y: oy },
    grid: { width: gridWidth, height: gridHeight },
    rect(x, y, w, h, color) {
      const rw = Math.round(w);
      const rh = Math.round(h);
      if (rw <= 0 || rh <= 0) return;
      c.fillStyle = color;
      c.fillRect(ox + Math.round(x), oy + Math.round(y), rw, rh);
    },
    img(s, x, y, sx = 0, sy = 0, sw, sh) {
      const w = sw === undefined ? s.w : Math.round(sw);
      const h = sh === undefined ? s.h : Math.round(sh);
      if (w <= 0 || h <= 0) return;
      c.drawImage(s.canvas, sx, sy, w, h, ox + Math.round(x) + sx, oy + Math.round(y) + sy, w, h);
    },
    text(s, x, y, n) {
      if (n <= 0) return;
      const w = n >= s.length ? s.w : (s.xs[n] ?? s.w);
      P.img(s, x, y, 0, 0, w, s.h);
    },
    caret(s, x, y, n, color, t, start, blinkUntil) {
      if (t < start || t > blinkUntil) return;
      if (n < s.length || Math.floor(t * 7) % 2 === 0) {
        const cx = n >= s.length ? s.w - s.pad : (s.xs[n] ?? s.w);
        P.rect(
          x + cx + 1,
          y + s.pad + s.ascentHeight,
          Math.max(1, s.scale * 2),
          s.capHeight,
          color,
        );
      }
    },
    pop(s, x, y, k) {
      if (k > 0) pops.push([s, (ox + x + s.w / 2) * px, (oy + y + s.h / 2) * px, k]);
    },
    clip(x, y, w, h) {
      c.save();
      c.beginPath();
      c.rect(
        ox + Math.round(x),
        oy + Math.round(y),
        Math.max(0, Math.round(w)),
        Math.max(0, Math.round(h)),
      );
      c.clip();
    },
    unclip() {
      c.restore();
    },
    spark(x, y, big, color) {
      const rx = Math.round(x);
      const ry = Math.round(y);
      const pts: (readonly [number, number])[] = big
        ? [
            [0, 0],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]
        : [[0, 0]];
      const outline = new Set<string>();
      for (const [a, b] of pts) for (const [u, v] of NEIGHBOURS) outline.add(`${a + u},${b + v}`);
      for (const [a, b] of pts) outline.delete(`${a},${b}`);
      for (const k of outline) {
        const [a = 0, b = 0] = k.split(',').map(Number);
        P.rect(rx + a, ry + b, 1, 1, '#000000');
      }
      for (const [a, b] of pts) P.rect(rx + a, ry + b, 1, 1, color);
    },
    line(points, n, color) {
      const count = Math.min(n, points.length);
      for (let i = 0; i < count; i++) {
        const [x, y] = points[i] ?? [0, 0];
        P.rect(x - 1, y - 1, 4, 4, '#000000');
      }
      for (let i = 0; i < count; i++) {
        const [x, y] = points[i] ?? [0, 0];
        P.rect(x, y, 2, 2, color);
      }
    },
    flush(ctx) {
      for (const [s, cx, cy, k] of pops) {
        ctx.drawImage(
          s.canvas,
          Math.round(cx - (s.w * k) / 2),
          Math.round(cy - (s.h * k) / 2),
          s.w * k,
          s.h * k,
        );
      }
    },
  };
  return P;
}

import type { Ctx2D } from '../canvas.ts';
import { clamp, easeInOut } from '../math.ts';

/** Adds a rounded-rectangle path. The radius is limited to half the shorter side. */
export function roundRectPath(c: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + radius, y);
  c.arcTo(x + w, y, x + w, y + h, radius);
  c.arcTo(x + w, y + h, x, y + h, radius);
  c.arcTo(x, y + h, x, y, radius);
  c.arcTo(x, y, x + w, y, radius);
  c.closePath();
}

/** Runs `draw` clipped to a rectangle. Draws nothing for an empty rectangle. */
export function withClip(
  c: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  draw: () => void,
): void {
  if (w <= 0 || h <= 0) return;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  draw();
  c.restore();
}

/** Runs `draw` with opacity multiplied by `alpha` (clamped). Skips invisible draws. */
export function withAlpha(c: Ctx2D, alpha: number, draw: () => void): void {
  if (alpha <= 0.001) return;
  const previous = c.globalAlpha;
  c.globalAlpha = previous * clamp(alpha);
  draw();
  c.globalAlpha = previous;
}

export function textWidth(c: Ctx2D, text: string, font: string): number {
  c.font = font;
  return c.measureText(text).width;
}

export function fillTextAt(
  c: Ctx2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'left',
): void {
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(text, x, y);
}

/**
 * Splits text into characters (by code point, so Turkish and emoji stay whole)
 * and returns where each one starts, for per-letter animation.
 */
export function letterPositions(
  c: Ctx2D,
  text: string,
  font: string,
): { chars: string[]; xs: number[]; width: number } {
  c.font = font;
  const chars = Array.from(text);
  const xs: number[] = [];
  let before = '';
  for (const ch of chars) {
    xs.push(c.measureText(before).width);
    before += ch;
  }
  return { chars, xs, width: c.measureText(text).width };
}

/**
 * The "block reveal": a solid bar grows over the area (first half of
 * `progress`), then slides away uncovering what `draw` paints (second half).
 */
export function blockReveal(
  c: Ctx2D,
  progress: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  draw: () => void,
): void {
  if (progress <= 0) return;
  if (progress < 0.5) {
    c.fillStyle = color;
    c.fillRect(x, y, w * easeInOut(progress / 0.5), h);
    return;
  }
  const q = easeInOut((progress - 0.5) / 0.5);
  withClip(c, x - 60, y - 60, w * q + 60, h + 120, draw);
  if (q < 1) {
    c.fillStyle = color;
    c.fillRect(x + w * q, y, w * (1 - q), h);
  }
}

/** Adds an icon path drawn in a 60×60 box. */
export type IconPath = (c: Ctx2D) => void;

/** Thumbs-up (like) icon. */
export const thumbIcon: IconPath = (c) => {
  c.beginPath();
  c.moveTo(2, 27);
  c.lineTo(13, 27);
  c.lineTo(13, 58);
  c.lineTo(2, 58);
  c.closePath();
  c.moveTo(18, 28);
  c.lineTo(29, 6);
  c.bezierCurveTo(31, 1, 40, 2, 39, 9);
  c.lineTo(36, 22);
  c.lineTo(53, 22);
  c.bezierCurveTo(59, 22, 61, 27, 59, 32);
  c.lineTo(53, 52);
  c.bezierCurveTo(52, 56, 49, 58, 45, 58);
  c.lineTo(18, 58);
  c.closePath();
};

/** Notification bell icon. */
export const bellIcon: IconPath = (c) => {
  c.beginPath();
  c.moveTo(30, 4);
  c.bezierCurveTo(33, 4, 34, 6, 34, 8);
  c.bezierCurveTo(43, 10, 48, 18, 48, 28);
  c.lineTo(48, 40);
  c.lineTo(55, 47);
  c.lineTo(55, 50);
  c.lineTo(5, 50);
  c.lineTo(5, 47);
  c.lineTo(12, 40);
  c.lineTo(12, 28);
  c.bezierCurveTo(12, 18, 17, 10, 26, 8);
  c.bezierCurveTo(26, 6, 27, 4, 30, 4);
  c.closePath();
  c.moveTo(36, 53);
  c.arc(30, 53, 6, 0, Math.PI);
  c.closePath();
};

/** Fills an icon at `(x, y)` scaled to `size` × `size`. */
export function drawIcon(
  c: Ctx2D,
  icon: IconPath,
  x: number,
  y: number,
  size: number,
  fill: string,
): void {
  c.save();
  c.translate(x, y);
  c.scale(size / 60, size / 60);
  icon(c);
  c.fillStyle = fill;
  c.fill();
  c.restore();
}

/** A mouse pointer with a soft shadow, tip at `(x, y)`. */
export function drawCursor(c: Ctx2D, x: number, y: number, scale: number): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 34);
  c.lineTo(9, 26);
  c.lineTo(15, 40);
  c.lineTo(21, 37);
  c.lineTo(15, 24);
  c.lineTo(27, 24);
  c.closePath();
  c.lineJoin = 'round';
  c.lineWidth = 3.5;
  c.strokeStyle = '#111';
  c.fillStyle = '#fff';
  c.shadowColor = 'rgba(0,0,0,.35)';
  c.shadowBlur = 10;
  c.shadowOffsetY = 3;
  c.fill();
  c.shadowColor = 'transparent';
  c.stroke();
  c.restore();
}

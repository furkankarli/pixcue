/** Drawing helpers shared by the theme implementations. */
import {
  type Ctx2D,
  context2d,
  createSurface,
  type DrawableSurface,
  onCanvasConfigured,
} from '../canvas.ts';
import { clamp } from '../math.ts';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Width of text drawn with extra letter spacing (`tracking` in px). */
export function trackedWidth(c: Ctx2D, text: string, font: string, tracking: number): number {
  c.font = font;
  const chars = Array.from(text);
  return c.measureText(text).width + tracking * Math.max(0, chars.length - 1);
}

/** Draws text with extra letter spacing, aligned like `fillText`. Returns its width. */
export function fillTracked(
  c: Ctx2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  tracking: number,
  align: CanvasTextAlign = 'left',
): number {
  const width = trackedWidth(c, text, font, tracking);
  c.font = font;
  c.fillStyle = color;
  c.textAlign = 'left';
  let cursor =
    align === 'center' ? x - width / 2 : align === 'right' || align === 'end' ? x - width : x;
  if (tracking === 0) {
    c.fillText(text, cursor, y);
    return width;
  }
  for (const ch of Array.from(text)) {
    c.fillText(ch, cursor, y);
    cursor += c.measureText(ch).width + tracking;
  }
  return width;
}

interface GlowSprite {
  readonly surface: DrawableSurface;
  /** Where the text origin sits inside the sprite, in sprite pixels. */
  readonly ox: number;
  readonly oy: number;
}

const glowCache = new Map<string, GlowSprite>();
const GLOW_CACHE_SIZE = 64;
onCanvasConfigured(() => glowCache.clear());

/**
 * Tracked text with a glow, like `fillTracked` under `shadowBlur`, but drawn
 * once into a sprite and reused on later frames. Blurring small glyphs is
 * very slow in some browsers (Firefox spends milliseconds per glyph on some
 * fonts), and a label repeats on every frame of an export.
 */
export function fillTrackedGlow(
  c: Ctx2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  tracking: number,
  blur: number,
): number {
  const m = c.getTransform();
  // Device pixels per unit: the sprite is drawn at the size it lands at.
  const scale = Math.hypot(m.a, m.b) || 1;
  const width = trackedWidth(c, text, font, tracking);
  const key = [text, font, color, tracking, blur, scale.toFixed(4)].join('|');
  let sprite = glowCache.get(key);
  if (!sprite) {
    c.font = font;
    const metrics = c.measureText(text);
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent) + 2;
    const descent = Math.ceil(metrics.actualBoundingBoxDescent) + 2;
    // shadowBlur works in device pixels; leave room for it on every side.
    const pad = blur * 2 + 2;
    const surface = createSurface(
      Math.ceil(width * scale + pad * 2),
      Math.ceil((ascent + descent) * scale + pad * 2),
    );
    const g = context2d(surface);
    g.translate(pad, pad + ascent * scale);
    g.scale(scale, scale);
    g.shadowColor = color;
    g.shadowBlur = blur;
    fillTracked(g, text, 0, 0, font, color, tracking);
    sprite = { surface, ox: pad, oy: pad + ascent * scale };
    if (glowCache.size >= GLOW_CACHE_SIZE) glowCache.clear();
    glowCache.set(key, sprite);
  }
  c.drawImage(
    sprite.surface,
    x - sprite.ox / scale,
    y - sprite.oy / scale,
    sprite.surface.width / scale,
    sprite.surface.height / scale,
  );
  return width;
}

/** A rectangle with its top-left and bottom-right corners cut at 45°. */
export function chamferPath(
  c: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cut: number,
): void {
  const k = Math.max(0, Math.min(cut, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + k, y);
  c.lineTo(x + w, y);
  c.lineTo(x + w, y + h - k);
  c.lineTo(x + w - k, y + h);
  c.lineTo(x, y + h);
  c.lineTo(x, y + k);
  c.closePath();
}

/** 90° corner brackets just inside a rectangle. */
export function cornerBrackets(
  c: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  length: number,
): void {
  const l = Math.min(length, w / 3, h / 3);
  c.beginPath();
  for (const [cx, cy, dx, dy] of [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ] as const) {
    c.moveTo(cx + dx * l, cy);
    c.lineTo(cx, cy);
    c.lineTo(cx, cy + dy * l);
  }
  c.stroke();
}

/** Ben-Day halftone dots that shrink away from a corner, reaching `reach` of the diagonal. */
export function halftone(
  c: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  spacing: number,
  corner: 'top-right' | 'bottom-left' = 'top-right',
  reach = 0.38,
): void {
  c.fillStyle = color;
  const ox = corner === 'top-right' ? x + w : x;
  const oy = corner === 'top-right' ? y : y + h;
  const radius = Math.hypot(w, h) * reach;
  for (let row = 0, py = y + spacing / 2; py < y + h; row++, py += spacing) {
    const shift = row % 2 ? spacing / 2 : 0;
    for (let px = x + spacing / 2 + shift; px < x + w; px += spacing) {
      const k = 1 - Math.hypot(px - ox, py - oy) / radius;
      if (k <= 0) continue;
      c.beginPath();
      c.arc(px, py, (spacing / 2) * 0.85 * k, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** A star with `points` spikes (pop-art bursts and markers). */
export function starPath(
  c: Ctx2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
  rotation = 0,
): void {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = rotation + (i * Math.PI) / points - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

/** Adds the first `progress` (0–1) of a polyline's length to the path; returns where it stops. */
export function partialPolyline(
  c: Ctx2D,
  points: readonly Point[],
  progress: number,
): Point | null {
  const first = points[0];
  if (!first || progress <= 0) return null;
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - (points[i]?.x ?? 0), p.y - (points[i]?.y ?? 0)));
  let remaining = lengths.reduce((a, b) => a + b, 0) * clamp(progress);
  c.moveTo(first.x, first.y);
  let end = first;
  for (let i = 0; i < lengths.length; i++) {
    const a = points[i] ?? first;
    const b = points[i + 1] ?? a;
    const l = lengths[i] ?? 0;
    if (remaining >= l) {
      c.lineTo(b.x, b.y);
      remaining -= l;
      end = b;
      continue;
    }
    const k = l === 0 ? 0 : remaining / l;
    end = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    c.lineTo(end.x, end.y);
    break;
  }
  return end;
}

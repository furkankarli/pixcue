/**
 * Pop: comic pop art and neo-brutalism. Thick black outlines, hard offset
 * shadows, flat saturated fills, Ben-Day dots, tilted stickers and bouncy
 * motion. See docs/themes.md.
 */
import { mix, onColor } from '../color.ts';
import { clamp, easeInOut, easeOutBack } from '../math.ts';
import type { VectorTheme } from '../theme.ts';
import { blockReveal, roundRectPath } from '../vector/draw.ts';
import { fillTracked, halftone, partialPolyline, starPath, trackedWidth } from './kit.ts';
import { SEMANTIC_COLORS } from './semantic.ts';

const INK = '#111111';
const SHADOW = 10;
const LABEL_FONT = { family: 'Manrope, sans-serif', weight: 800 };

/** Draws `shape` as a black hard shadow offset down-right, then filled and outlined. */
function inked(
  c: Parameters<VectorTheme['card']>[0],
  shape: () => void,
  fill: string,
  outline = 5,
  shadow = SHADOW,
) {
  if (shadow) {
    c.save();
    c.translate(shadow, shadow);
    shape();
    c.fillStyle = INK;
    c.fill();
    c.restore();
  }
  shape();
  c.fillStyle = fill;
  c.fill();
  if (outline) {
    c.lineWidth = outline;
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    c.stroke();
  }
}

export const pop: VectorTheme = {
  kind: 'vector',
  id: 'pop',
  semantic: SEMANTIC_COLORS,
  accent: '#FFD21F',
  fonts: {
    display: { family: 'Anton, Impact, sans-serif', weight: 400 },
    body: 'Manrope, sans-serif',
    label: LABEL_FONT,
  },
  uppercase: true,
  colors: {
    text: INK,
    sub: '#3A3A3A',
    line: 'rgba(0,0,0,.14)',
    neutral: '#2B2B2B',
    sweep: 'rgba(255,210,31,.35)',
  },
  accentText: INK,
  iconRadius: 12,
  headingDrop: 16,
  label: { uppercase: true, tracking: 0.04, tone: 'text' },
  motion: { enter: easeOutBack, exit: easeInOut, pop: easeOutBack },

  card(c, x, y, w, h, accent) {
    const shape = () => roundRectPath(c, x, y, w, h, 6);
    inked(c, shape, '#FFFFFF', 0, 12);
    // Ben-Day dots in the accent, fading out from the top-right corner.
    c.save();
    shape();
    c.clip();
    halftone(c, x, y, w, h, mix(accent, '#FFFFFF', 0.35), 16);
    c.restore();
    shape();
    c.lineWidth = 5;
    c.strokeStyle = INK;
    c.stroke();
  },

  button(c, x, y, w, h, fill) {
    roundRectPath(c, x + 9, y + 9, w, h, 16);
    c.fillStyle = INK;
    c.fill();
    roundRectPath(c, x, y, w, h, 16);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = INK;
    c.stroke();
  },

  heading(c, text, x, y, font, align, color, accent) {
    c.save();
    c.font = font;
    c.textAlign = align;
    c.lineJoin = 'round';
    c.lineWidth = 14;
    c.strokeStyle = INK;
    c.strokeText(text, x + 9, y + 9);
    c.fillStyle = accent ?? '#FFD21F';
    c.fillText(text, x + 9, y + 9);
    c.strokeText(text, x, y);
    c.fillStyle = color ?? '#fff';
    c.fillText(text, x, y);
    c.restore();
  },

  chip(c, text, x, y, size, accent, draw = true) {
    const font = `${LABEL_FONT.weight} ${size}px ${LABEL_FONT.family}`;
    const tracking = size * 0.04;
    const w = trackedWidth(c, text, font, tracking) + size * 1.3;
    const h = size * 1.75;
    if (!draw) return { w, h };
    // A slightly tilted sticker.
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.rotate(-0.05);
    c.translate(-w / 2, -h / 2);
    inked(c, () => roundRectPath(c, 0, 0, w, h, 4), accent, 4, 5);
    fillTracked(c, text, size * 0.65, h * 0.7, font, onColor(accent), tracking);
    c.restore();
    return { w, h };
  },

  rule(c, x, y, w, h, color) {
    inked(
      c,
      () => {
        c.beginPath();
        c.rect(x, y, w, h);
      },
      color,
      3,
      4,
    );
  },

  divider(c, x, y, w, progress) {
    const length = w * clamp(progress);
    if (length <= 0) return;
    c.fillStyle = INK;
    c.fillRect(x, y - 2.5, length, 5);
  },

  meter(c, x, y, w, h, value, color) {
    const r = h / 2;
    inked(c, () => roundRectPath(c, x, y, w, h, r), '#FFFFFF', 3, 4);
    const fill = w * clamp(value);
    if (fill <= 1) return;
    c.save();
    roundRectPath(c, x, y, w, h, r);
    c.clip();
    c.fillStyle = color;
    c.fillRect(x, y, fill, h);
    // Diagonal stripes on the filled part.
    c.fillStyle = mix(color, INK, 0.18);
    for (let sx = x - h; sx < x + fill; sx += h * 1.2) {
      c.beginPath();
      c.moveTo(sx, y + h);
      c.lineTo(sx + h * 0.5, y + h);
      c.lineTo(sx + h * 1.1, y);
      c.lineTo(sx + h * 0.6, y);
      c.closePath();
      c.fill();
    }
    c.restore();
    roundRectPath(c, x, y, w, h, r);
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.stroke();
  },

  ring(c, cx, cy, r, value, color) {
    c.lineWidth = 28;
    c.strokeStyle = INK;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 18;
    c.strokeStyle = '#FFFFFF';
    c.stroke();
    if (value <= 0) return;
    c.strokeStyle = color;
    c.lineCap = 'butt';
    c.beginPath();
    c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(value));
    c.stroke();
  },

  marker(c, cx, cy, size, kind, color, t) {
    const wobble = kind === 'dot' ? 1 + 0.06 * Math.sin(t * 6) : 1;
    const s = size * wobble;
    inked(c, () => starPath(c, cx, cy, s * 1.25, s * 0.85, 12, 0.1), color, 4, 5);
    c.lineCap = 'round';
    if (kind === 'dot') {
      c.beginPath();
      c.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
      c.fillStyle = INK;
      c.fill();
      return;
    }
    // A white plus or minus with a black outline.
    const glyph = () => {
      c.beginPath();
      c.moveTo(cx - s * 0.5, cy);
      c.lineTo(cx + s * 0.5, cy);
      if (kind === 'plus') {
        c.moveTo(cx, cy - s * 0.5);
        c.lineTo(cx, cy + s * 0.5);
      }
    };
    c.strokeStyle = INK;
    c.lineWidth = s * 0.42;
    glyph();
    c.stroke();
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = s * 0.22;
    glyph();
    c.stroke();
  },

  leader(c, points, progress, color) {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const [width, stroke] of [
      [12, INK],
      [6, color],
    ] as const) {
      c.lineWidth = width;
      c.strokeStyle = stroke;
      c.beginPath();
      partialPolyline(c, points, progress);
      c.stroke();
    }
  },

  reveal(c, progress, x, y, w, h, color, draw) {
    blockReveal(c, progress, x, y, w, h, color, draw);
  },

  burst(c, x, y, age, color, seed) {
    if (age <= 0 || age >= 1) return;
    // A hollow comic burst, so the button under it stays visible.
    const k = easeOutBack(Math.min(1, age * 2.5));
    const fade = age > 0.6 ? 1 - (age - 0.6) / 0.4 : 1;
    c.save();
    c.globalAlpha *= fade;
    c.lineJoin = 'round';
    starPath(c, x, y, 110 * k, 78 * k, 12, seed);
    c.lineWidth = 12;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 6;
    c.strokeStyle = color;
    c.stroke();
    c.restore();
  },
};

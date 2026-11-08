/**
 * Clean (Sade): the Swiss minimal style. White cards with generous padding and
 * soft shadows, hairline dividers, small tracked grey labels, a sparing accent,
 * and calm fades. See docs/themes.md.
 */
import { mix } from '../color.ts';
import { clamp, easeInOut, easeOut } from '../math.ts';
import type { VectorTheme } from '../theme.ts';
import { roundRectPath } from '../vector/draw.ts';
import { fillTracked, partialPolyline, trackedWidth } from './kit.ts';
import { SEMANTIC_COLORS } from './semantic.ts';

const TEXT = '#15171A';
const LABEL_FONT = { family: 'Manrope, sans-serif', weight: 700 };

function softShadow(c: Parameters<VectorTheme['card']>[0], blur: number, y: number) {
  c.shadowColor = 'rgba(15,20,30,.22)';
  c.shadowBlur = blur;
  c.shadowOffsetY = y;
}

export const sade: VectorTheme = {
  kind: 'vector',
  id: 'sade',
  semantic: SEMANTIC_COLORS,
  accent: '#3D5AFE',
  fonts: {
    display: { family: 'Manrope, sans-serif', weight: 800 },
    body: 'Manrope, sans-serif',
    label: LABEL_FONT,
  },
  uppercase: false,
  colors: {
    text: TEXT,
    sub: '#5C6370',
    line: 'rgba(0,0,0,.1)',
    neutral: '#6B7280',
    sweep: 'rgba(61,90,254,.10)',
  },
  accentText: undefined,
  iconRadius: 37,
  headingDrop: 4,
  label: { uppercase: true, tracking: 0.08, tone: 'sub' },
  motion: { enter: easeInOut, exit: easeInOut, pop: easeOut },

  card(c, x, y, w, h) {
    c.save();
    softShadow(c, 48, 14);
    roundRectPath(c, x, y, w, h, 22);
    c.fillStyle = '#FFFFFF';
    c.fill();
    c.restore();
  },

  button(c, x, y, w, h, fill) {
    c.save();
    c.shadowColor = 'rgba(0,0,0,.28)';
    c.shadowBlur = 26;
    c.shadowOffsetY = 8;
    roundRectPath(c, x, y, w, h, h / 2);
    c.fillStyle = fill;
    c.fill();
    c.restore();
  },

  heading(c, text, x, y, font, align, color) {
    c.save();
    c.font = font;
    c.textAlign = align;
    c.shadowColor = 'rgba(0,0,0,.45)';
    c.shadowBlur = 32;
    c.shadowOffsetY = 6;
    c.fillStyle = color ?? '#fff';
    c.fillText(text, x, y);
    c.restore();
  },

  chip(c, text, x, y, size, accent, draw = true) {
    // A white pill with an accent dot: readable over any video.
    const font = `${LABEL_FONT.weight} ${size}px ${LABEL_FONT.family}`;
    const tracking = size * 0.08;
    const dot = size * 0.5;
    const w = trackedWidth(c, text, font, tracking) + size * 2.9 + dot;
    const h = size * 2;
    if (!draw) return { w, h };
    c.save();
    softShadow(c, 18, 4);
    roundRectPath(c, x, y, w, h, h / 2);
    c.fillStyle = '#FFFFFF';
    c.fill();
    c.restore();
    c.beginPath();
    c.arc(x + size * 1.05, y + h / 2, dot / 2, 0, Math.PI * 2);
    c.fillStyle = accent;
    c.fill();
    fillTracked(c, text, x + size * 1.55 + dot, y + h * 0.66, font, TEXT, tracking);
    return { w, h };
  },

  rule(c, x, y, w, h, color) {
    roundRectPath(c, x, y, w, h, Math.min(w, h) / 2);
    c.fillStyle = color;
    c.fill();
  },

  divider(c, x, y, w, progress) {
    const length = w * clamp(progress);
    if (length <= 0) return;
    c.fillStyle = 'rgba(0,0,0,.1)';
    c.fillRect(x, y, length, 1.5);
  },

  meter(c, x, y, w, h, value, color) {
    roundRectPath(c, x, y, w, h, h / 2);
    c.fillStyle = 'rgba(0,0,0,.07)';
    c.fill();
    const fill = w * clamp(value);
    if (fill <= 1) return;
    roundRectPath(c, x, y, Math.max(fill, h), h, h / 2);
    c.fillStyle = color;
    c.fill();
  },

  ring(c, cx, cy, r, value, color) {
    c.lineWidth = 12;
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,.07)';
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    if (value <= 0) return;
    c.strokeStyle = color;
    c.beginPath();
    c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(value));
    c.stroke();
  },

  marker(c, cx, cy, size, kind, color, t) {
    if (kind === 'dot') {
      // A soft halo that breathes slowly around a solid dot.
      const breathe = 0.5 + 0.5 * Math.sin(t * 2.5);
      c.beginPath();
      c.arc(cx, cy, size * (1.3 + breathe * 0.35), 0, Math.PI * 2);
      c.fillStyle = mix(color, '#FFFFFF', 0.7);
      c.globalAlpha *= 0.55;
      c.fill();
      c.globalAlpha /= 0.55;
      c.save();
      softShadow(c, 12, 3);
      c.beginPath();
      c.arc(cx, cy, size * 0.75, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
      c.restore();
      c.beginPath();
      c.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.fill();
      return;
    }
    c.beginPath();
    c.arc(cx, cy, size, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = size * 0.22;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - size * 0.45, cy);
    c.lineTo(cx + size * 0.45, cy);
    if (kind === 'plus') {
      c.moveTo(cx, cy - size * 0.45);
      c.lineTo(cx, cy + size * 0.45);
    }
    c.stroke();
  },

  leader(c, points, progress, color) {
    c.strokeStyle = color;
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    const end = partialPolyline(c, points, progress);
    c.stroke();
    if (end && progress >= 1) {
      c.beginPath();
      c.arc(end.x, end.y, 5, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
    }
  },

  reveal(c, progress, x, y, w, h, _color, draw) {
    if (progress <= 0) return;
    // Fade in while rising a few units.
    const p = easeInOut(progress);
    c.save();
    c.beginPath();
    c.rect(x - 40, y - 40, w + 80, h + 80);
    c.clip();
    c.globalAlpha *= p;
    c.translate(0, (1 - p) * 14);
    draw();
    c.restore();
  },

  burst(c, x, y, age, color, _seed, w = 110, h = 110) {
    if (age <= 0 || age >= 1) return;
    // A soft outline that follows the button's shape outwards.
    const k = easeOut(age);
    const pad = 4 + 26 * k;
    const bw = w + pad * 2;
    const bh = h + pad * 2;
    c.save();
    c.globalAlpha *= (1 - age) * 0.8;
    c.strokeStyle = color;
    c.lineWidth = 4 * (1 - age) + 1;
    roundRectPath(c, x - bw / 2, y - bh / 2, bw, bh, bh / 2);
    c.stroke();
    c.restore();
  },
};

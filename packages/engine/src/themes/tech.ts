/**
 * Tech: a heads-up display. Chamfered glass panels with thin luminous outlines
 * and corner brackets, monospace data labels, segmented meters, scan-line
 * reveals and fast, exact motion. See docs/themes.md.
 */
import { clamp, easeIn, easeOutExpo } from '../math.ts';
import type { VectorTheme } from '../theme.ts';
import { roundRectPath } from '../vector/draw.ts';
import { chamferPath, cornerBrackets, fillTracked, partialPolyline, trackedWidth } from './kit.ts';
import { SEMANTIC_COLORS } from './semantic.ts';

const GLASS = 'rgba(8,12,18,.86)';
const EDGE = 'rgba(255,255,255,.16)';
const LABEL_FONT = { family: '"JetBrains Mono", "Chakra Petch", monospace', weight: 700 };

export const tech: VectorTheme = {
  kind: 'vector',
  id: 'tech',
  semantic: SEMANTIC_COLORS,
  accent: '#00E5FF',
  fonts: {
    display: { family: '"Chakra Petch", Manrope, sans-serif', weight: 700 },
    body: 'Manrope, sans-serif',
    label: LABEL_FONT,
  },
  uppercase: true,
  colors: {
    text: '#FFFFFF',
    sub: '#A7B1BF',
    line: 'rgba(255,255,255,.14)',
    neutral: '#3A414B',
    sweep: 'rgba(255,255,255,.16)',
  },
  accentText: undefined,
  iconRadius: 14,
  headingDrop: 2,
  label: { uppercase: true, tracking: 0.14, tone: 'accent' },
  motion: { enter: easeOutExpo, exit: easeIn, pop: easeOutExpo },

  card(c, x, y, w, h, accent) {
    const cut = Math.min(22, h * 0.18);
    chamferPath(c, x, y, w, h, cut);
    c.fillStyle = GLASS;
    c.fill();
    // Faint scan lines on the glass.
    c.save();
    chamferPath(c, x, y, w, h, cut);
    c.clip();
    c.fillStyle = 'rgba(255,255,255,.035)';
    for (let ly = y + 2; ly < y + h; ly += 5) c.fillRect(x, ly, w, 1.5);
    c.restore();
    chamferPath(c, x, y, w, h, cut);
    c.strokeStyle = EDGE;
    c.lineWidth = 1.5;
    c.stroke();
    // Corner brackets just outside the glass, with a soft glow.
    c.save();
    c.strokeStyle = accent;
    c.lineWidth = 3;
    c.shadowColor = accent;
    c.shadowBlur = 10;
    cornerBrackets(c, x - 6, y - 6, w + 12, h + 12, 22);
    c.restore();
  },

  button(c, x, y, w, h, fill) {
    roundRectPath(c, x, y, w, h, 14);
    c.fillStyle = fill;
    c.fill();
    c.save();
    roundRectPath(c, x, y, w, h, 14);
    c.clip();
    c.fillStyle = 'rgba(255,255,255,.16)';
    c.fillRect(x, y, w, h * 0.42);
    c.restore();
    roundRectPath(c, x, y, w, h, 14);
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = 3;
    c.stroke();
  },

  heading(c, text, x, y, font, align, color) {
    c.save();
    c.font = font;
    c.textAlign = align;
    c.shadowColor = 'rgba(0,0,0,.6)';
    c.shadowBlur = 26;
    c.shadowOffsetY = 4;
    c.fillStyle = color ?? '#fff';
    c.fillText(text, x, y);
    c.restore();
  },

  chip(c, text, x, y, size, accent, draw = true) {
    const font = `${LABEL_FONT.weight} ${size}px ${LABEL_FONT.family}`;
    const tracking = size * 0.14;
    const label = `[ ${text} ]`;
    const w = trackedWidth(c, label, font, tracking) + size * 1.2;
    const h = size * 1.9;
    if (!draw) return { w, h };
    chamferPath(c, x, y, w, h, size * 0.5);
    c.fillStyle = 'rgba(8,12,18,.88)';
    c.fill();
    c.strokeStyle = accent;
    c.lineWidth = 1.5;
    c.stroke();
    c.save();
    c.shadowColor = accent;
    c.shadowBlur = 8;
    fillTracked(c, label, x + size * 0.6, y + h * 0.68, font, accent, tracking);
    c.restore();
    return { w, h };
  },

  rule(c, x, y, w, h, color) {
    c.save();
    c.shadowColor = color;
    c.shadowBlur = 14;
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
    c.restore();
  },

  divider(c, x, y, w, progress) {
    const length = w * clamp(progress);
    if (length <= 0) return;
    c.save();
    c.setLineDash([8, 6]);
    c.strokeStyle = 'rgba(255,255,255,.24)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + length, y);
    c.stroke();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.fillRect(x, y - 4, 2, 8);
    c.fillRect(x + length - 2, y - 4, 2, 8);
  },

  meter(c, x, y, w, h, value, color) {
    const count = Math.max(8, Math.round(w / 26));
    const gap = 4;
    const seg = (w - gap * (count - 1)) / count;
    const filled = clamp(value) * count;
    for (let i = 0; i < count; i++) {
      const sx = x + i * (seg + gap);
      c.fillStyle = 'rgba(255,255,255,.1)';
      c.fillRect(sx, y, seg, h);
      const part = clamp(filled - i);
      if (part <= 0) continue;
      c.save();
      c.shadowColor = color;
      c.shadowBlur = 10;
      c.fillStyle = color;
      c.fillRect(sx, y, seg * part, h);
      c.restore();
    }
  },

  ring(c, cx, cy, r, value, color) {
    const count = 40;
    const filled = clamp(value) * count;
    c.lineWidth = 14;
    for (let i = 0; i < count; i++) {
      const a0 = -Math.PI / 2 + (i / count) * Math.PI * 2 + 0.03;
      const a1 = -Math.PI / 2 + ((i + 1) / count) * Math.PI * 2 - 0.03;
      c.beginPath();
      c.arc(cx, cy, r, a0, a1);
      if (i < filled) {
        c.save();
        c.strokeStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 12;
        c.globalAlpha *= i + 1 <= filled ? 1 : filled - i;
        c.stroke();
        c.restore();
      } else {
        c.strokeStyle = 'rgba(255,255,255,.1)';
        c.stroke();
      }
    }
    // Outer scale with four ticks.
    c.strokeStyle = 'rgba(255,255,255,.22)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, r + 16, 0, Math.PI * 2);
    c.stroke();
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * (r + 10), cy + Math.sin(a) * (r + 10));
      c.lineTo(cx + Math.cos(a) * (r + 22), cy + Math.sin(a) * (r + 22));
      c.stroke();
    }
  },

  marker(c, cx, cy, size, kind, color, t) {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 12;
    if (kind === 'dot') {
      // A targeting reticle: rotating brackets around a diamond.
      c.lineWidth = 3;
      c.translate(cx, cy);
      c.save();
      c.rotate(t * 1.2);
      cornerBrackets(c, -size, -size, size * 2, size * 2, size * 0.6);
      c.restore();
      c.beginPath();
      c.moveTo(0, -size * 0.35);
      c.lineTo(size * 0.35, 0);
      c.lineTo(0, size * 0.35);
      c.lineTo(-size * 0.35, 0);
      c.closePath();
      c.fill();
    } else {
      chamferPath(c, cx - size, cy - size, size * 2, size * 2, size * 0.45);
      c.fillStyle = 'rgba(8,12,18,.8)';
      c.fill();
      c.lineWidth = 2.5;
      c.stroke();
      c.lineWidth = size * 0.28;
      c.beginPath();
      c.moveTo(cx - size * 0.5, cy);
      c.lineTo(cx + size * 0.5, cy);
      if (kind === 'plus') {
        c.moveTo(cx, cy - size * 0.5);
        c.lineTo(cx, cy + size * 0.5);
      }
      c.stroke();
    }
    c.restore();
  },

  leader(c, points, progress, color) {
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 3;
    c.shadowColor = color;
    c.shadowBlur = 10;
    c.beginPath();
    const end = partialPolyline(c, points, progress);
    c.stroke();
    if (end) {
      c.fillStyle = color;
      c.fillRect(end.x - 4, end.y - 4, 8, 8);
    }
    c.restore();
  },

  reveal(c, progress, x, y, w, h, color, draw) {
    if (progress <= 0) return;
    const p = easeOutExpo(progress);
    const edge = x + w * p;
    c.save();
    c.beginPath();
    c.rect(x - 40, y - 40, edge - x + 40, h + 80);
    c.clip();
    draw();
    c.restore();
    if (progress < 1) {
      c.save();
      c.shadowColor = color;
      c.shadowBlur = 16;
      c.fillStyle = color;
      c.fillRect(edge - 2, y - 4, 4, h + 8);
      c.restore();
    }
  },

  burst(c, x, y, age, color, seed) {
    if (age <= 0 || age >= 1) return;
    const k = easeOutExpo(age);
    c.save();
    c.globalAlpha *= 1 - age;
    c.strokeStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 14;
    c.lineWidth = 3;
    const r = 30 + 110 * k;
    cornerBrackets(c, x - r, y - r, r * 2, r * 2, r * 0.35);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + seed;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
      c.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85);
      c.stroke();
    }
    c.restore();
  },
};

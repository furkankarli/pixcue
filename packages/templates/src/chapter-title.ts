/**
 * Chapter title: a big title that drops in letter by letter over an accent
 * line, with a small chapter label under it. Centered.
 */
import {
  easeIn,
  easeInOut,
  easeOutBack,
  envelope,
  labelText,
  letterPositions,
  type PixelScene,
  type PixelText,
  pixelChip,
  pixelTextStyles,
  popScale,
  type Sprite,
  themeCase,
  themeFont,
  upper,
  type VectorScene,
  withAlpha,
  withClip,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';

const fields = {
  kicker: field.text({
    label: 'templates.chapterTitle.fields.kicker',
    help: 'templates.chapterTitle.fields.kickerHelp',
    maxLength: 30,
    default: ({ t }) => t('templates.chapterTitle.sample.kicker'),
  }),
  title: field.text({
    label: 'templates.chapterTitle.fields.title',
    maxLength: 40,
    default: ({ t }) => t('templates.chapterTitle.sample.title'),
  }),
};

export type ChapterTitleFields = FieldValues<typeof fields>;

/** Clear space between the lowest point of the title and the accent line. */
const LINE_GAP = 22;
const TITLE_SIZE = 124;
const KICKER_SIZE = 26;

interface VectorBox {
  readonly w: number;
  readonly h: number;
  /** Title baseline and the accent line, measured so descenders (Ç, Ş) clear the line. */
  readonly baseline: number;
  readonly lineY: number;
}

const vector: VectorScene<ChapterTitleFields, VectorBox> = {
  measure(c, { fields, theme, accent, locale }) {
    const title = themeCase(theme, fields.title, locale);
    c.font = themeFont(theme, 'display', TITLE_SIZE);
    const m = c.measureText(title || 'H');
    const baseline = Math.ceil(m.actualBoundingBoxAscent) + 40;
    const lineY = baseline + Math.ceil(m.actualBoundingBoxDescent) + theme.headingDrop + LINE_GAP;
    const kicker = theme.chip(
      c,
      labelText(theme, fields.kicker || ' ', locale),
      0,
      0,
      KICKER_SIZE,
      accent,
      false,
    );
    return {
      w: Math.max(m.width, kicker.w, 280) + 220,
      h: lineY + 9 + 26 + kicker.h + 20,
      baseline,
      lineY,
    };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const { enter, exit, pop } = theme.motion;
    const cx = box.w / 2;
    const title = themeCase(theme, fields.title, locale);
    const tf = themeFont(theme, 'display', TITLE_SIZE);
    const letters = letterPositions(c, title, tf);
    const x0 = cx - letters.width / 2;
    const n = letters.chars.length;

    // Accent line grows from the center, with small end caps.
    const line = envelope(t, dur, 0, 0.45, 0.45, 0.08, enter, exit);
    const half = (box.w / 2 - 70) * line;
    if (half > 0.5) {
      theme.rule(c, cx - half, box.lineY, half * 2, 9, accent);
      withAlpha(c, line, () => {
        theme.rule(c, cx - half - 26, box.lineY, 12, 9, accent);
        theme.rule(c, cx + half + 14, box.lineY, 12, 9, accent);
      });
    }

    // Letters drop onto their place above the line, then fall through it,
    // last to first, within a fixed spread whatever the title length.
    const outAt = dur - 0.85;
    const stagger = Math.min(0.025, 0.2 / Math.max(1, n - 1));
    withClip(c, -200, -400, box.w + 400, box.lineY - 2 + 400, () => {
      letters.chars.forEach((ch, i) => {
        const p = (t - 0.2 - i * 0.035) / 0.5;
        if (p <= 0) return;
        const out = t > outAt ? exit((t - outAt - (n - 1 - i) * stagger) / 0.4) : 0;
        const y = box.baseline + (1 - pop(p)) * -140 + out * 260;
        theme.heading(c, ch, x0 + (letters.xs[i] ?? 0), y, tf, 'left', undefined, accent);
      });
    });

    // Chapter label pops in under the line, and is the first to leave.
    const kickerIn = envelope(t, dur, 0.55, 0.95, 0.95, 0.65, pop, exit);
    if (fields.kicker && kickerIn > 0) {
      const label = labelText(theme, fields.kicker, locale);
      const size = theme.chip(c, label, 0, 0, KICKER_SIZE, accent, false);
      const x = cx - size.w / 2;
      const y = box.lineY + 9 + 26;
      c.save();
      c.translate(cx, y + size.h / 2);
      c.scale(kickerIn, kickerIn);
      c.translate(-cx, -(y + size.h / 2));
      theme.chip(c, label, x, y, KICKER_SIZE, accent);
      c.restore();
    }
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly full: PixelText;
  readonly chip: Sprite;
}

const pixel: PixelScene<ChapterTitleFields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const full = pixelTextStyles.big(upper(fields.title, locale), 2, accent);
    const chip = pixelChip(upper(fields.kicker, locale) || ' ', accent);
    return { w: Math.max(full.w, chip.w) + 20, h: full.h + 5 + 2 + 4 + chip.h, full, chip };
  },

  draw(P, t, { fields, accent, theme, locale, duration: dur, box: b }) {
    const cx = Math.floor(b.w / 2);
    const fx = Math.round(cx - b.full.w / 2);
    const ly = b.full.h + 3;
    const chars = Array.from(upper(fields.title, locale));
    const n = chars.length;

    const line = envelope(t, dur, 0, 0.38, 0.55, 0.1, easeInOut, easeInOut);
    const half = Math.round((b.w / 2 - 5) * line);
    if (half > 0) {
      P.rect(cx - half - 1, ly - 1, half * 2 + 2, 4, '#000000');
      P.rect(cx - half, ly, half * 2, 2, accent);
      if (half > 4) {
        P.rect(cx - half - 5, ly - 1, 4, 4, '#000000');
        P.rect(cx - half - 4, ly, 2, 2, accent);
        P.rect(cx + half + 1, ly - 1, 4, 4, '#000000');
        P.rect(cx + half + 2, ly, 2, 2, accent);
      }
    }

    // Letters leave last to first, spread over at most 0.3 s whatever the length.
    const outT = dur - 0.95;
    const stagger = Math.min(0.03, 0.3 / Math.max(1, n - 1));
    chars.forEach((ch, i) => {
      if (ch === ' ') return;
      const p = (t - (0.16 + i * 0.05)) / 0.3;
      if (p <= 0) return;
      let yo = Math.round(-(1 - easeOutBack(p)) * 26);
      if (t > outT) {
        const q = (t - outT - (n - 1 - i) * stagger) / 0.4;
        if (q >= 1) return;
        if (q > 0) yo -= Math.round(easeIn(q) * 34);
      }
      const glyph = pixelTextStyles.big(ch, 2, accent);
      P.img(glyph, fx + (b.full.xs[i] ?? 0) - glyph.pad, yo);
    });

    // Sparks burst from the corners as the last letter lands.
    const sa = t - (0.16 + (n - 1) * 0.05 + 0.3);
    if (sa > 0 && sa < 0.4) {
      const k = sa / 0.4;
      const w = b.full.w;
      const h = b.full.h;
      const points: [number, number][] = [
        [-6, 4],
        [w + 6, 6],
        [-2, h - 2],
        [w + 2, h - 4],
        [w * 0.3, -6],
        [w * 0.7, -5],
      ];
      points.forEach(([x, y], i) => {
        const dx = (x < w / 2 ? -1 : 1) * Math.round(k * 6);
        const dy = (y < h / 2 ? -1 : 1) * Math.round(k * 4);
        P.spark(fx + x + dx, y + dy, k < 0.55, i % 2 ? '#FFFFFF' : theme.semantic.spark);
      });
    }

    if (fields.kicker) {
      P.pop(
        b.chip,
        Math.round(cx - b.chip.w / 2),
        ly + 6,
        popScale(t, 0.42 + n * 0.05, dur - 1.1, P.px),
      );
    }
  },
};

export const chapterTitle = defineTemplate({
  id: 'chapter-title',
  name: 'templates.chapterTitle.name',
  duration: 3,
  minDuration: 2,
  position: 'mc',
  fields,
  render: { vector, pixel },
  sounds: ({ fields, duration: dur, pixel }) => {
    // The line sweeps out, the last letter lands, the label pops in.
    const letters = Array.from(fields.title).length;
    const landed = pixel ? 0.16 + (letters - 1) * 0.05 + 0.3 : 0.2 + (letters - 1) * 0.035 + 0.4;
    return [
      { t: 0.02, kind: 'whoosh' },
      { t: landed, kind: 'pop' },
      ...(fields.kicker
        ? [{ t: pixel ? 0.42 + letters * 0.05 : 0.6, kind: 'blip', gain: 0.6 } as const]
        : []),
      { t: dur - 0.85, kind: 'swoosh' },
    ];
  },
});

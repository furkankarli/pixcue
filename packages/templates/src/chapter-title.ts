/**
 * Chapter title: a big title that drops in letter by letter over an accent
 * line, with a small chapter label under it. Centered.
 */
import {
  blockReveal,
  easeIn,
  easeInOut,
  easeOutBack,
  envelope,
  letterPositions,
  linear,
  type PixelScene,
  type PixelText,
  pixelChip,
  pixelTextStyles,
  popScale,
  type Sprite,
  textWidth,
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

/** Baseline of the accent line inside the graphic. */
const LINE_Y = 196;

const vector: VectorScene<ChapterTitleFields> = {
  measure(c, { fields, theme }) {
    return {
      w:
        Math.max(
          textWidth(c, themeCase(theme, fields.title), themeFont(theme, 'display', 124)),
          280,
        ) + 220,
      h: 300,
    };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const cx = box.w / 2;
    const title = themeCase(theme, fields.title, locale);
    const tf = themeFont(theme, 'display', 124);
    const letters = letterPositions(c, title, tf);
    const x0 = cx - letters.width / 2;
    const n = letters.chars.length;

    // Accent line grows from the center, with end caps and a glint.
    const line = envelope(t, dur, 0, 0.45, 0.6, 0.2, easeInOut, easeInOut);
    const half = (box.w / 2 - 70) * line;
    c.fillStyle = accent;
    c.fillRect(cx - half, LINE_Y, half * 2, 9);
    withAlpha(c, line, () => {
      c.fillRect(cx - half - 26, LINE_Y, 12, 9);
      c.fillRect(cx + half + 14, LINE_Y, 12, 9);
    });
    const gp = (t - 0.5) / 0.55;
    if (gp > 0 && gp < 1 && half > 40) {
      const gx = cx - half + half * 2 * easeInOut(gp);
      withClip(c, cx - half, LINE_Y - 2, half * 2, 13, () => {
        const g = c.createLinearGradient(gx - 70, 0, gx + 70, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(gx - 70, LINE_Y - 2, 140, 13);
      });
    }

    // Letters drop onto the line, then fall through it (clipped) at the end.
    withClip(c, -200, -300, box.w + 400, LINE_Y + 300, () => {
      letters.chars.forEach((ch, i) => {
        const p = (t - 0.2 - i * 0.035) / 0.5;
        if (p <= 0) return;
        const out = t > dur - 0.58 ? easeIn((t - (dur - 0.58) - (n - 1 - i) * 0.016) / 0.32) : 0;
        const y = LINE_Y - 36 + (1 - easeOutBack(p)) * 180 + out * 190;
        theme.heading(c, ch, x0 + (letters.xs[i] ?? 0), y, tf, 'left', undefined, accent);
      });
    });

    // Chapter label revealed under the line.
    if (fields.kicker) {
      const kf = themeFont(theme, 'body', 30, 800);
      const k = upper(fields.kicker, locale);
      const kw = textWidth(c, k, kf) + 28;
      blockReveal(
        c,
        envelope(t, dur, 0.55, 1.15, 0.52, 0.06, linear, linear),
        cx - kw / 2,
        LINE_Y + 24,
        kw,
        48,
        accent,
        () => theme.heading(c, k, cx, LINE_Y + 60, kf, 'center', accent, '#111'),
      );
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

    const line = envelope(t, dur, 0, 0.38, 0.5, 0.2, easeInOut, easeInOut);
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

    const outT = dur - 0.6;
    chars.forEach((ch, i) => {
      if (ch === ' ') return;
      const p = (t - (0.16 + i * 0.05)) / 0.3;
      if (p <= 0) return;
      let yo = Math.round(-(1 - easeOutBack(p)) * 26);
      if (t > outT) {
        const q = (t - outT - (n - 1 - i) * 0.02) / 0.28;
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
        popScale(t, 0.42 + n * 0.05, dur - 0.62, P.px),
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
});

/**
 * Score card: a product's overall score counting up in a ring (blocks in the
 * pixel theme), with per-category bars below. Centered.
 */
import {
  clamp,
  decimalsOf,
  drawLabel,
  easeInOut,
  easeOut,
  envelope,
  fillTextAt,
  formatNumber,
  labelColor,
  mix,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelPanel,
  pixelTextStyles,
  popScale,
  textWidth,
  themeCase,
  themeFont,
  typedVisible,
  upper,
  type VectorScene,
  withAlpha,
  withClip,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';

const fields = {
  title: field.text({
    label: 'templates.scoreCard.fields.title',
    maxLength: 40,
    default: ({ t }) => t('templates.scoreCard.sample.title'),
  }),
  score: field.number({
    label: 'templates.scoreCard.fields.score',
    min: 0,
    max: 100,
    step: 0.1,
    default: 8.5,
  }),
  max: field.number({ label: 'templates.scoreCard.fields.max', min: 1, max: 100, default: 10 }),
  label: field.text({
    label: 'templates.scoreCard.fields.label',
    maxLength: 30,
    default: ({ t }) => t('templates.scoreCard.sample.label'),
  }),
  categories: field.list({
    label: 'templates.scoreCard.fields.categories',
    item: {
      name: field.item.text('templates.scoreCard.fields.categoryName', 30),
      score: field.item.number('templates.scoreCard.fields.categoryScore', 0, 100, 0.1),
    },
    max: 6,
    default: ({ t }) => [
      { name: t('templates.scoreCard.sample.category1'), score: 9 },
      { name: t('templates.scoreCard.sample.category2'), score: 8.5 },
      { name: t('templates.scoreCard.sample.category3'), score: 7 },
      { name: t('templates.scoreCard.sample.category4'), score: 9 },
    ],
  }),
};

export type ScoreCardFields = FieldValues<typeof fields>;

/** One frame at 30 fps: pops start here so the first frame stays empty. */
const FIRST_FRAME = 1 / 30;

/** A number shown with as many decimals as it was entered with, in the copy locale. */
const show = (value: number, locale: string, decimalsFrom = value) =>
  formatNumber(value, decimalsOf(decimalsFrom), locale);

const vector: VectorScene<ScoreCardFields> = {
  measure(c, { fields, theme, locale }) {
    return {
      w: Math.max(
        640,
        textWidth(c, themeCase(theme, fields.title, locale), themeFont(theme, 'display', 36)) + 90,
      ),
      h: 448 + fields.categories.length * 72,
    };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const { w, h } = box;
    const { enter, exit } = theme.motion;
    const max = fields.max;
    const score = fields.score;
    // The outro runs in reverse: bars drain, the score and title fade, then
    // the card rolls back up.
    const pan = envelope(t, dur, 0, 0.55, 0.62, 0.1, enter, exit);
    const textIn = envelope(t, dur, 0.3, 0.7, 0.95, 0.6, enter, exit);
    const count = easeOut((t - 0.55) / 1.3) * (1 - easeInOut((t - (dur - 1.25)) / 0.5));
    const cx = w / 2;

    // The card unrolls downward.
    if (pan <= 0) return;
    withClip(c, -40, -40, w + 80, (h + 80) * pan, () => {
      theme.card(c, 0, 0, w, h, accent);

      withAlpha(c, textIn, () => {
        fillTextAt(
          c,
          themeCase(theme, fields.title, locale),
          cx,
          66,
          themeFont(theme, 'display', 36),
          theme.colors.text,
          'center',
        );
        theme.rule(c, cx - 32 * textIn, 84, 64 * textIn, 6, accent);

        // The score ring fills as the number counts up.
        const cy = 236;
        c.save();
        theme.ring(c, cx, cy, 104, clamp(score / max) * count, accent);
        c.restore();
        const bump = t > 1.85 && t < 2.1 ? 1 + 0.08 * Math.sin((Math.PI * (t - 1.85)) / 0.25) : 1;
        c.save();
        c.translate(cx, cy);
        c.scale(bump, bump);
        fillTextAt(
          c,
          show(score * count, locale, score),
          0,
          26,
          themeFont(theme, 'display', 82),
          theme.colors.text,
          'center',
        );
        c.restore();
        fillTextAt(
          c,
          `/ ${show(max, locale)}`,
          cx,
          cy + 62,
          themeFont(theme, 'body', 22, 700),
          theme.colors.sub,
          'center',
        );
        drawLabel(c, theme, fields.label, cx, 392, 21, labelColor(theme, accent), {
          locale,
          align: 'center',
        });
      });

      // Category meters fill one after another and drain in reverse.
      const n = fields.categories.length;
      fields.categories.forEach((cat, i) => {
        const ry = 428 + i * 72;
        const lead = (n - 1 - i) * 0.08;
        const fill =
          easeOut((t - (1.1 + i * 0.15)) / 0.7) * (1 - easeInOut((t - (dur - 1.45 + lead)) / 0.45));
        const a = envelope(
          t,
          dur,
          0.9 + i * 0.12,
          1.3 + i * 0.12,
          1.15 - lead,
          0.8 - lead,
          enter,
          exit,
        );
        withAlpha(c, a, () => {
          fillTextAt(
            c,
            cat.name,
            44,
            ry + 30,
            themeFont(theme, 'body', 24, 700),
            theme.colors.text,
          );
          fillTextAt(
            c,
            show(cat.score, locale),
            w - 44,
            ry + 30,
            themeFont(theme, 'body', 24, 800),
            theme.colors.text,
            'right',
          );
          c.save();
          theme.meter(c, 44, ry + 42, w - 88, 14, clamp(cat.score / max) * fill, accent);
          c.restore();
        });
      });
    });
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly title: PixelText;
  readonly max: PixelText;
  readonly label: PixelText;
  readonly big: PixelText;
  readonly categories: readonly (readonly [name: PixelText, score: PixelText])[];
  readonly ph: number;
  /** Rows: number, label, blocks, categories. */
  readonly yNumber: number;
  readonly yLabel: number;
  readonly yBlocks: number;
  readonly yCategories: number;
}

const pixel: PixelScene<ScoreCardFields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const title = pixelTextStyles.title(upper(fields.title, locale), accent);
    const max = pixelTextStyles.small(`/${show(fields.max, locale)}`, '#BDBDBD');
    const label = pixelTextStyles.accent(upper(fields.label, locale), accent);
    const big = pixelTextStyles.big(show(fields.score, locale), 3, accent);
    const categories = fields.categories.map(
      (cat) =>
        [
          pixelTextStyles.small(upper(cat.name, locale), '#FFFFFF'),
          pixelTextStyles.small(show(cat.score, locale), '#FFFFFF'),
        ] as const,
    );
    let w = Math.max(100, title.w + 16, big.w + max.w + 20);
    for (const [name, score] of categories) w = Math.max(w, name.w + score.w + 22);
    const yNumber = 6 + title.h + 2;
    const yLabel = yNumber + big.h + 1;
    const yBlocks = yLabel + label.h + 2;
    const yCategories = yBlocks + 11;
    const ph = yCategories + categories.length * 19 + 4;
    return {
      w,
      h: ph + 3,
      title,
      max,
      label,
      big,
      categories,
      ph,
      yNumber,
      yLabel,
      yBlocks,
      yCategories,
    };
  },

  draw(P, t, { fields, accent, locale, duration: dur, box: b }) {
    const w = b.w;
    const panel = pixelPanel(w, b.ph, PIXEL_PANEL_FILL);
    const k = popScale(t, FIRST_FRAME, dur - 0.55, P.px);
    if (k === 0) return;
    // The whole panel pops; its content appears once it has settled.
    if (k !== P.px || t < 0.1) {
      P.pop(panel, 0, 0, k);
      return;
    }
    P.img(panel, 0, 0);

    const max = fields.max;
    const score = fields.score;
    P.text(
      b.title,
      Math.round((w - b.title.w) / 2),
      5,
      typedVisible(t, 0.3, b.title.length, dur - 1.15),
    );

    // The number counts up in steps of its own precision.
    const count = easeOut((t - 0.55) / 1.2);
    const scale = 10 ** decimalsOf(score);
    const value = Math.round(score * count * scale) / scale;
    const big = pixelTextStyles.big(show(value, locale, score), 3, accent);
    const gx = Math.round((w - b.big.w - b.max.w - 2) / 2);
    if (t > 0.5) {
      if (count >= 1 && t > 1.75 && t < 1.85) P.pop(big, gx, b.yNumber, P.px + 1);
      else P.img(big, gx, b.yNumber);
      P.img(b.max, gx + b.big.w + 2, b.yNumber + big.h - b.max.h - 2);
    }
    P.text(
      b.label,
      Math.round((w - b.label.w) / 2),
      b.yLabel,
      typedVisible(t, 0.7, b.label.length, dur - 1.2),
    );

    // Ten blocks fill up to the score, flashing as they land.
    const blocks = 10;
    const bw = 7;
    const bx0 = Math.round((w - (blocks * (bw + 1) - 1)) / 2);
    const target = clamp(score / max) * blocks;
    // Bars drain before the panel pops away.
    const drain = 1 - easeInOut((t - (dur - 1.2)) / 0.5);
    const fill = target * clamp((t - 0.9) / 1.0) * drain;
    for (let j = 0; j < blocks; j++) {
      const x = bx0 + j * (bw + 1);
      P.rect(x, b.yBlocks, bw, bw, '#000000');
      P.rect(x + 1, b.yBlocks + 1, bw - 2, bw - 2, '#2E2E35');
      if (fill > j) {
        const part = clamp(fill - j);
        const flash = fill - j < 0.6 && fill < target;
        const width = Math.max(
          1,
          Math.round((bw - 2) * (part >= 0.95 ? 1 : part >= 0.45 ? 0.5 : part)),
        );
        P.rect(x + 1, b.yBlocks + 1, width, bw - 2, flash ? '#FFFFFF' : accent);
        if (part >= 0.95) P.rect(x + 1, b.yBlocks + 1, bw - 2, 1, mix(accent, '#ffffff', 0.45));
      }
    }

    b.categories.forEach(([name, value], i) => {
      const y = b.yCategories + i * 19;
      const st = 1.2 + i * 0.2;
      if (t < st) return;
      P.text(name, 8, y, typedVisible(t, st, name.length, dur - 1.2));
      P.text(value, w - 8 - value.w, y, typedVisible(t, st + 0.1, value.length, dur - 1.2));
      const v = fields.categories[i]?.score ?? 0;
      const filled = clamp(v / max) * 10 * clamp((t - st - 0.15) / 0.6) * drain;
      const segment = Math.floor((w - 16 - 9) / 10);
      for (let j = 0; j < 10; j++) {
        const x = 8 + j * (segment + 1);
        P.rect(x, y + 10, segment, 4, '#000000');
        P.rect(x, y + 11, segment, 2, filled > j + 0.5 ? accent : '#2E2E35');
      }
    });
  },
};

export const scoreCard = defineTemplate({
  id: 'score-card',
  name: 'templates.scoreCard.name',
  duration: 6,
  minDuration: 3.5,
  position: 'mc',
  fields,
  render: { vector, pixel },
});

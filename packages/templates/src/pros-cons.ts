/**
 * Pros and cons: two panels listing good and bad points. Side by side when
 * they fit the safe area, stacked otherwise (vertical, 4:5 and square video).
 */
import {
  blockReveal,
  clamp,
  easeOutBack,
  envelope,
  type Frame,
  fillTextAt,
  linear,
  PIXEL_BASE,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelBox,
  pixelPanel,
  pixelTextStyles,
  popScale,
  textWidth,
  themeCase,
  themeFont,
  typedCount,
  typedEnd,
  typedVisible,
  upper,
  type VectorScene,
  withAlpha,
  withClip,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';

const item = { text: field.item.text('templates.prosCons.fields.item', 50) };

const fields = {
  prosTitle: field.text({
    label: 'templates.prosCons.fields.prosTitle',
    maxLength: 24,
    default: ({ t }) => t('templates.prosCons.sample.prosTitle'),
  }),
  pros: field.list({
    label: 'templates.prosCons.fields.pros',
    item,
    max: 6,
    default: ({ t }) => [
      { text: t('templates.prosCons.sample.pro1') },
      { text: t('templates.prosCons.sample.pro2') },
      { text: t('templates.prosCons.sample.pro3') },
    ],
  }),
  consTitle: field.text({
    label: 'templates.prosCons.fields.consTitle',
    maxLength: 24,
    default: ({ t }) => t('templates.prosCons.sample.consTitle'),
  }),
  cons: field.list({
    label: 'templates.prosCons.fields.cons',
    item,
    max: 6,
    default: ({ t }) => [
      { text: t('templates.prosCons.sample.con1') },
      { text: t('templates.prosCons.sample.con2') },
    ],
  }),
};

export type ProsConsFields = FieldValues<typeof fields>;

/** One frame at 30 fps: pops start here so the first frame stays empty. */
const FIRST_FRAME = 1 / 30;

interface Column {
  readonly title: string;
  readonly items: readonly string[];
  readonly color: string;
  readonly plus: boolean;
}

function columns(fields: ProsConsFields, colors: { positive: string; negative: string }): Column[] {
  return [
    {
      title: fields.prosTitle,
      items: fields.pros.map((i) => i.text),
      color: colors.positive,
      plus: true,
    },
    {
      title: fields.consTitle,
      items: fields.cons.map((i) => i.text),
      color: colors.negative,
      plus: false,
    },
  ];
}

/** Whether two columns of `columnWidth` (plus `gap`) are too wide for the frame. */
const shouldStack = (frame: Frame, columnWidth: number, gap: number) =>
  columnWidth * 2 + gap > frame.safeArea.width;

interface VectorBox {
  readonly w: number;
  readonly h: number;
  /** Width and height of one column panel. */
  readonly cw: number;
  readonly ch: number;
  readonly stacked: boolean;
}

const GAP = 36;

const vector: VectorScene<ProsConsFields, VectorBox> = {
  measure(c, { fields, theme, frame }) {
    let m = 0;
    for (const { text } of [...fields.pros, ...fields.cons]) {
      m = Math.max(m, textWidth(c, text, themeFont(theme, 'body', 28, 700)));
    }
    const cw = Math.max(470, m + 130);
    const ch = 128 + Math.max(fields.pros.length, fields.cons.length, 1) * 70 + 30;
    const stacked = shouldStack(frame, cw, GAP);
    return stacked
      ? { w: cw, h: ch * 2 + GAP, cw, ch, stacked }
      : { w: cw * 2 + GAP, h: ch, cw, ch, stacked };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const { cw: w, ch: h } = box;
    columns(fields, theme.semantic).forEach((col, ci) => {
      const x = box.stacked ? 0 : ci * (w + GAP);
      const y = box.stacked ? ci * (h + GAP) : 0;
      const o = ci * 0.15;
      const pan = envelope(t, dur, o, o + 0.55, 0.9 - o * 0.5, 0.4 - o * 0.5);
      const head = envelope(t, dur, o + 0.3, o + 0.7, 0.7, 0.45);

      withClip(c, x - 30, y - 30, w + 60, (h + 70) * pan, () => {
        theme.panel(c, x, y, w, h);

        // Round +/- badge, title and accent underline.
        withAlpha(c, head, () => {
          const mx = x + 56;
          const my = y + 62;
          const ms = easeOutBack(clamp((t - o - 0.3) / 0.35));
          c.save();
          c.translate(mx, my);
          c.scale(ms, ms);
          c.fillStyle = col.color;
          c.beginPath();
          c.arc(0, 0, 23, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#fff';
          c.fillRect(-11, -3.5, 22, 7);
          if (col.plus) c.fillRect(-3.5, -11, 7, 22);
          c.restore();
          fillTextAt(
            c,
            themeCase(theme, col.title, locale),
            x + 96,
            my + 14,
            themeFont(theme, 'display', 36),
            theme.colors.text,
          );
          c.fillStyle = accent;
          c.fillRect(x + 36, y + 104, 60 * head, 5);
        });

        // Items: a small +/- mark, then the text uncovered by a colored block.
        col.items.forEach((text, i) => {
          const a = o + 0.6 + i * 0.15;
          const oa = 0.68 - o * 0.5;
          const iy = y + 128 + i * 70 + 34;
          const f = themeFont(theme, 'body', 28, 700);
          const v = envelope(t, dur, a, a + 0.35, oa, oa - 0.22);
          withAlpha(c, v, () => {
            c.fillStyle = col.color;
            c.fillRect(x + 40, iy - 12, 16, 5);
            if (col.plus) c.fillRect(x + 45.5, iy - 17.5, 5, 16);
          });
          blockReveal(
            c,
            envelope(t, dur, a, a + 0.6, oa + 0.04, oa - 0.3, linear, linear),
            x + 72,
            iy - 30,
            textWidth(c, text, f) + 12,
            42,
            col.color,
            () => fillTextAt(c, text, x + 76, iy, f, theme.colors.text),
          );
        });
      });
    });
  },
};

interface PixelColumn {
  readonly title: PixelText;
  readonly items: readonly PixelText[];
  readonly color: string;
  readonly kind: 'plus' | 'minus';
}

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly columns: readonly PixelColumn[];
  readonly cw: number;
  readonly ph: number;
  readonly stacked: boolean;
}

const PIXEL_GAP = 8;

const pixel: PixelScene<ProsConsFields, PixelBox> = {
  measure({ fields, accent, locale, theme, frame }) {
    const cols: PixelColumn[] = columns(fields, theme.semantic).map((col) => ({
      title: pixelTextStyles.title(upper(col.title, locale), accent),
      items: col.items.map((text) => pixelTextStyles.small(upper(text, locale), '#FFFFFF')),
      color: col.color,
      kind: col.plus ? 'plus' : 'minus',
    }));
    let cw = 90;
    for (const col of cols) {
      cw = Math.max(cw, col.title.w + 22);
      for (const text of col.items) cw = Math.max(cw, text.w + 22);
    }
    const n = Math.max(1, ...cols.map((col) => col.items.length));
    const ph = 6 + 16 + 4 + n * 12 + 4;
    // Grid cells are PIXEL_BASE design units wide at scale 1.
    const stacked = shouldStack(frame, cw * PIXEL_BASE, PIXEL_GAP * PIXEL_BASE);
    return stacked
      ? { w: cw, h: (ph + 3) * 2 + PIXEL_GAP, columns: cols, cw, ph, stacked }
      : { w: cw * 2 + PIXEL_GAP, h: ph + 3, columns: cols, cw, ph, stacked };
  },

  draw(P, t, { duration: dur, box: b }) {
    b.columns.forEach((col, ci) => {
      const x = b.stacked ? 0 : ci * (b.cw + PIXEL_GAP);
      const y = b.stacked ? ci * (b.ph + 3 + PIXEL_GAP) : 0;
      const o = ci * 0.12;
      const panel = pixelPanel(b.cw, b.ph, PIXEL_PANEL_FILL);
      const k = popScale(t, o + FIRST_FRAME, dur - 0.42 + o * 0.5, P.px);
      if (k === 0) return;
      if (k !== P.px || t < o + 0.1) {
        P.pop(panel, x, y, k);
        return;
      }
      P.img(panel, x, y);

      if (t > o + 0.3) P.img(pixelBox(9, 9, col.color, col.kind), x + 6, y + 6);
      const hs = o + 0.35;
      P.text(col.title, x + 17, y + 4, typedVisible(t, hs, col.title.length, dur - 0.85));

      const n = col.items.length;
      col.items.forEach((text, i) => {
        const iy = y + 6 + 16 + 4 + i * 12;
        const st = typedEnd(hs, col.title.length) + 0.15 + i * 0.28;
        const vanish = dur - 1.0 + (n - 1 - i) * 0.06;
        if (t < st || t > vanish + 0.07) return;
        if (t > vanish) {
          P.rect(x + 4, iy - 1, b.cw - 8, 11, '#FFFFFF');
          return;
        }
        const blink = Math.floor((t - st) * 8) < 3 && Math.floor((t - st) * 16) % 2 === 1;
        P.rect(x + 5, iy + 2, 5, 5, '#000000');
        P.rect(x + 6, iy + 3, 3, 3, blink ? '#FFFFFF' : col.color);
        P.text(text, x + 12, iy, typedCount(t, st + 0.05, text.length));
      });
    });
  },
};

export const prosCons = defineTemplate({
  id: 'pros-cons',
  name: 'templates.prosCons.name',
  duration: 7,
  minDuration: 4,
  position: 'mc',
  fields,
  render: { vector, pixel },
});

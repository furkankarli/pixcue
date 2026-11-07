/**
 * Spec card: a titled panel listing label / value rows, sliding in from the
 * right. Right-aligned in horizontal video, centered otherwise.
 */
import {
  accentTextColor,
  blockReveal,
  clamp,
  easeIn,
  easeInOut,
  easeOut,
  envelope,
  fillTextAt,
  linear,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelPanel,
  pixelTextStyles,
  textWidth,
  themeCase,
  themeFont,
  typedCount,
  typedVisible,
  upper,
  type VectorScene,
  withAlpha,
  withClip,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';

const fields = {
  header: field.text({
    label: 'templates.specCard.fields.header',
    maxLength: 30,
    default: ({ t }) => t('templates.specCard.sample.header'),
  }),
  rows: field.list({
    label: 'templates.specCard.fields.rows',
    item: {
      label: field.item.text('templates.specCard.fields.rowLabel', 30),
      value: field.item.text('templates.specCard.fields.rowValue', 40),
    },
    min: 1,
    max: 6,
    default: ({ t }) => [
      {
        label: t('templates.specCard.sample.row1Label'),
        value: t('templates.specCard.sample.row1Value'),
      },
      {
        label: t('templates.specCard.sample.row2Label'),
        value: t('templates.specCard.sample.row2Value'),
      },
      {
        label: t('templates.specCard.sample.row3Label'),
        value: t('templates.specCard.sample.row3Value'),
      },
    ],
  }),
};

export type SpecCardFields = FieldValues<typeof fields>;

const ROW_H = 104;
const ROWS_Y = 118;

const vector: VectorScene<SpecCardFields> = {
  measure(c, { fields, theme, locale }) {
    let m = textWidth(c, themeCase(theme, fields.header, locale), themeFont(theme, 'display', 34));
    for (const row of fields.rows) {
      m = Math.max(
        m,
        textWidth(c, row.value, themeFont(theme, 'body', 36, 800)) + 20,
        textWidth(c, upper(row.label, locale), themeFont(theme, 'body', 20, 800)),
      );
    }
    return { w: Math.max(560, m + 100), h: ROWS_Y + fields.rows.length * ROW_H + 18 };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const { w, h } = box;
    const rows = fields.rows;
    const pan = envelope(t, dur, 0, 0.6, 0.95, 0.4);
    const head = envelope(t, dur, 0.35, 0.8, 0.75, 0.5);
    const clipX = w - (w + 40) * pan;

    // The panel wipes in from the right edge. The extra 40 units uncover the
    // panel's shadow, so skip drawing entirely while the panel is hidden.
    if (pan <= 0) return;
    withClip(c, clipX, -30, (w + 40) * pan + 40, h + 70, () => {
      theme.panel(c, 0, 0, w, h);
      c.fillStyle = accent;
      c.fillRect(w - 7, 22, 7, (h - 44) * pan);

      const sp = (t - 0.6) / 0.7;
      if (sp > 0 && sp < 1) {
        c.save();
        c.beginPath();
        c.rect(0, 0, w, h);
        c.clip();
        const gy = -80 + (h + 160) * easeInOut(sp);
        const g = c.createLinearGradient(0, gy - 90, 0, gy + 90);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, theme.colors.sweep);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(0, gy - 90, w, 180);
        c.restore();
      }

      withAlpha(c, head, () =>
        fillTextAt(
          c,
          themeCase(theme, fields.header, locale),
          40,
          66 + (1 - head) * 24,
          themeFont(theme, 'display', 34),
          theme.colors.text,
        ),
      );
      c.fillStyle = accent;
      c.fillRect(40, 88, 64 * head, 6);

      // Rows enter one after another and leave in reverse order.
      rows.forEach((row, i) => {
        const a = 0.55 + i * 0.14;
        const oa = 0.66 - (rows.length - 1 - i) * 0.05;
        const v = envelope(t, dur, a, a + 0.4, oa, oa - 0.24);
        const ry = ROWS_Y + i * ROW_H;
        if (i > 0) {
          c.fillStyle = theme.colors.line;
          c.fillRect(40, ry, (w - 80) * v, 2);
        }
        withAlpha(c, v, () =>
          fillTextAt(
            c,
            upper(row.label, locale),
            40 + (1 - v) * 40,
            ry + 38,
            themeFont(theme, 'body', 20, 800),
            accentTextColor(theme, accent),
          ),
        );
        const vf = themeFont(theme, 'body', 36, 800);
        const vw = textWidth(c, row.value, vf) + 12;
        blockReveal(
          c,
          envelope(t, dur, a + 0.08, a + 0.68, oa + 0.05, oa - 0.3, linear, linear),
          38,
          ry + 50,
          vw,
          44,
          accent,
          () => fillTextAt(c, row.value, 40, ry + 84, vf, theme.colors.text),
        );
      });
    });
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly header: PixelText;
  readonly rows: readonly (readonly [label: PixelText, value: PixelText])[];
  readonly pw: number;
  readonly ph: number;
}

const pixel: PixelScene<SpecCardFields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const header = pixelTextStyles.title(upper(fields.header, locale), accent);
    const rows = fields.rows.map(
      (row) =>
        [
          pixelTextStyles.accent(upper(row.label, locale), accent),
          pixelTextStyles.small(upper(row.value, locale), '#FFFFFF'),
        ] as const,
    );
    let m = header.w;
    for (const [label, value] of rows) m = Math.max(m, label.w, value.w);
    const pw = m + 18;
    const ph = 6 + header.h + 6 + rows.length * 22 + 3;
    return { w: pw, h: ph + 3, header, rows, pw, ph };
  },

  draw(P, t, { accent, duration: dur, box: b }) {
    const panel = pixelPanel(b.pw, b.ph, PIXEL_PANEL_FILL);
    // Slide from beyond the right edge of the frame.
    const distance = Math.max(b.pw + 40, P.grid.width - P.origin.x);
    const slideIn = 1 - easeOut(t / 0.45);
    const slideOut = t > dur - 0.45 ? easeIn((t - (dur - 0.45)) / 0.4) : 0;
    const off = Math.round((slideIn + slideOut) * distance);
    P.img(panel, off, 0);

    const hn = typedVisible(t, 0.4, b.header.length, dur - 0.7);
    P.text(b.header, 8 + off, 4, hn);
    P.rect(
      8 + off,
      4 + b.header.h,
      Math.round(14 * clamp((t - 0.55) / 0.2) * (t > dur - 0.7 ? 0 : 1)),
      2,
      accent,
    );

    const n = b.rows.length;
    b.rows.forEach(([label, value], i) => {
      const ry = 6 + b.header.h + 6 + i * 22;
      const st = 0.6 + i * 0.22;
      const vanish = dur - 0.95 + (n - 1 - i) * 0.08;
      if (t > vanish) {
        // A one-frame white flash as each row disappears.
        if (t < vanish + 0.07) P.rect(off + 4, ry - 2, b.pw - 8, 21, '#FFFFFF');
        return;
      }
      if (i > 0) {
        const dl = Math.round((b.pw - 16) * clamp((t - st + 0.1) / 0.25));
        for (let x = 0; x < dl; x += 2) P.rect(off + 8 + x, ry - 3, 1, 1, '#55555F');
      }
      P.text(label, 8 + off, ry, typedCount(t, st, label.length));
      P.text(value, 8 + off, ry + 9, typedCount(t, st + 0.14, value.length));
    });
  },
};

export const specCard = defineTemplate({
  id: 'spec-card',
  name: 'templates.specCard.name',
  duration: 6,
  minDuration: 3,
  position: (frame) => (frame.orientation === 'horizontal' ? 'mr' : 'mc'),
  fields,
  render: { vector, pixel },
});

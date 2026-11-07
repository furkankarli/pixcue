/**
 * Callout: a pulsing dot with a leader line pointing to a title and subtitle,
 * to label something in the video. Points right or left.
 */
import {
  accentTextColor,
  bitmapSprite,
  blockReveal,
  easeInOut,
  easeOutBack,
  envelope,
  linear,
  mix,
  type PixelScene,
  type PixelText,
  pixelTextStyles,
  popScale,
  textWidth,
  themeCase,
  themeFont,
  typedEnd,
  typedVisible,
  upper,
  type VectorScene,
  withAlpha,
  withClip,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';

const fields = {
  title: field.text({
    label: 'templates.callout.fields.title',
    maxLength: 40,
    default: ({ t }) => t('templates.callout.sample.title'),
  }),
  subtitle: field.text({
    label: 'templates.callout.fields.subtitle',
    maxLength: 60,
    default: ({ t }) => t('templates.callout.sample.subtitle'),
  }),
  direction: field.select({
    label: 'templates.callout.fields.direction',
    options: [
      { value: 'right', label: 'templates.callout.fields.right' },
      { value: 'left', label: 'templates.callout.fields.left' },
    ],
    default: 'right',
  }),
};

export type CalloutFields = FieldValues<typeof fields>;

/** One frame at 30 fps: pops start here so the first frame stays empty. */
const FIRST_FRAME = 1 / 30;

interface VectorBox {
  readonly w: number;
  readonly h: number;
  readonly textWidth: number;
}

const vector: VectorScene<CalloutFields, VectorBox> = {
  measure(c, { fields, theme, locale }) {
    const tw =
      Math.max(
        textWidth(c, themeCase(theme, fields.title, locale), themeFont(theme, 'display', 46)),
        textWidth(c, fields.subtitle, themeFont(theme, 'body', 26, 700)),
        120,
      ) + 20;
    return { w: 180 + tw + 40, h: 240, textWidth: tw };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const left = fields.direction === 'left';
    const X = (x: number) => (left ? box.w - x : x);
    const dotX = X(28);
    const dotY = 214;
    const elbowX = X(160);
    const elbowY = 84;
    const endX = X(160 + box.textWidth + 30);

    const dot = envelope(t, dur, 0, 0.32, 0.72, 0.4, easeOutBack);
    const l1 = envelope(t, dur, 0.18, 0.52, 0.58, 0.3, easeInOut, easeInOut);
    const l2 = envelope(t, dur, 0.46, 0.84, 0.42, 0.12, easeInOut, easeInOut);

    // Pulsing rings around a glowing dot.
    if (dot > 0) {
      for (let r = 0; r < 2; r++) {
        const pr = (t + r * 0.5) % 1;
        c.beginPath();
        c.arc(dotX, dotY, 16 + 40 * pr, 0, Math.PI * 2);
        c.strokeStyle = accent;
        c.lineWidth = 4;
        withAlpha(c, (1 - pr) * dot * 0.9, () => c.stroke());
      }
      c.save();
      c.shadowColor = accent;
      c.shadowBlur = 20;
      c.beginPath();
      c.arc(dotX, dotY, 14 * dot, 0, Math.PI * 2);
      c.fillStyle = accent;
      c.fill();
      c.restore();
      c.beginPath();
      c.arc(dotX, dotY, 6 * dot, 0, Math.PI * 2);
      c.fillStyle = '#0A1418';
      c.fill();
    }

    // Leader line: diagonal to the elbow, then horizontal under the title.
    c.strokeStyle = accent;
    c.lineWidth = 5;
    c.lineCap = 'round';
    if (l1 > 0) {
      c.beginPath();
      c.moveTo(dotX, dotY);
      c.lineTo(dotX + (elbowX - dotX) * l1, dotY + (elbowY - dotY) * l1);
      c.stroke();
    }
    if (l2 > 0) {
      c.beginPath();
      c.moveTo(elbowX, elbowY);
      c.lineTo(elbowX + (endX - elbowX) * l2, elbowY);
      c.stroke();
    }

    const tf = themeFont(theme, 'display', 46);
    const title = themeCase(theme, fields.title, locale);
    const tw = textWidth(c, title, tf) + 16;
    const textX = left ? elbowX - 10 : elbowX + 10;
    const align = left ? 'right' : 'left';
    blockReveal(
      c,
      envelope(t, dur, 0.62, 1.22, 0.5, 0.06, linear, linear),
      left ? elbowX - tw - 2 : elbowX + 2,
      elbowY - 62,
      tw,
      56,
      accent,
      () => theme.heading(c, title, textX, elbowY - 18, tf, align, undefined, accent),
    );

    // Subtitle slides up from under the line. While hidden its shadow would
    // still leak into the clip, so it is not drawn at all.
    const sub = envelope(t, dur, 1.0, 1.35, 0.3, 0.04);
    if (sub <= 0) return;
    const subColor = accentTextColor(theme, accent) === '#111111' ? '#fff' : accent;
    withClip(c, Math.min(elbowX, endX) - 20, elbowY + 6, Math.abs(endX - elbowX) + 60, 70, () =>
      theme.heading(
        c,
        fields.subtitle,
        textX,
        elbowY + 44 - (1 - sub) * 50,
        themeFont(theme, 'body', 26, 700),
        align,
        subColor,
        '#111',
      ),
    );
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly title: PixelText;
  readonly subtitle: PixelText;
  readonly textWidth: number;
}

const MARKER = ['.KKKKK.', 'KAAAAAK', 'KAHAAAK', 'KAAWAAK', 'KAAAAAK', 'KAAAAAK', '.KKKKK.'];

const pixel: PixelScene<CalloutFields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const title = pixelTextStyles.title(upper(fields.title, locale), accent);
    const subtitle = pixelTextStyles.accent(upper(fields.subtitle, locale), accent);
    const tw = Math.max(title.w, subtitle.w);
    return { w: 3 + 18 + tw + 10, h: 42, title, subtitle, textWidth: tw };
  },

  draw(P, t, { fields, accent, duration: dur, box: b }) {
    const left = fields.direction === 'left';
    const X = (x: number) => (left ? b.w - 2 - x : x);
    const px = X(5);
    const py = 35;
    const ex = X(23);
    const ey = 17;
    const qx = X(23 + b.textWidth + 4);

    const diagonal: [number, number][] = [];
    for (let i = 1; i <= 18; i++) diagonal.push([px + (left ? -i : i), py - i]);
    const horizontal: [number, number][] = [];
    for (let i = 1; i <= Math.abs(qx - ex); i++) horizontal.push([ex + (left ? -i : i), ey]);

    // A square ring pulses around the marker while the callout is up.
    if (t > 0.25 && t < dur - 0.35) {
      const r = 4 + Math.floor(((t % 0.9) / 0.9) * 4);
      const cx = px + 1;
      const cy = py + 1;
      if (r <= 7) {
        P.rect(cx - r, cy - r, 2 * r + 1, 1, accent);
        P.rect(cx - r, cy + r, 2 * r + 1, 1, accent);
        P.rect(cx - r, cy - r, 1, 2 * r + 1, accent);
        P.rect(cx + r, cy - r, 1, 2 * r + 1, accent);
      }
    }

    const n1 = Math.round(diagonal.length * envelope(t, dur, 0.2, 0.5, 0.6, 0.38, linear, linear));
    const n2 = Math.round(
      horizontal.length * envelope(t, dur, 0.48, 0.8, 0.4, 0.2, linear, linear),
    );
    P.line(diagonal, n1, accent);
    if (n1 >= diagonal.length) P.line(horizontal, n2, accent);

    const marker = bitmapSprite(MARKER, {
      K: '#000000',
      A: accent,
      H: mix(accent, '#FFFFFF', 0.5),
      W: '#FFFFFF',
    });
    P.pop(marker, px - 2, py - 2, popScale(t, FIRST_FRAME, dur - 0.35, P.px));

    const s1 = 0.78;
    const tn = typedVisible(t, s1, b.title.length, dur - 0.75);
    P.text(b.title, left ? ex - b.title.w + 2 : ex + 1, ey - b.title.h, tn);

    const s2 = typedEnd(s1, b.title.length) + 0.08;
    const sn = typedVisible(t, s2, b.subtitle.length, dur - 0.85);
    const sx = left ? ex - b.subtitle.w + 2 : ex + 1;
    P.text(b.subtitle, sx, ey + 3, sn);
    P.caret(b.subtitle, sx, ey + 3, sn, accent, t, s2, typedEnd(s2, b.subtitle.length) + 0.4);
  },
};

export const callout = defineTemplate({
  id: 'callout',
  name: 'templates.callout.name',
  duration: 4,
  minDuration: 2.5,
  position: 'mc',
  fields,
  render: { vector, pixel },
});

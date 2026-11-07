/**
 * Callout: a pulsing dot with a leader line pointing to a title and subtitle,
 * to label something in the video. Points right or left.
 */
import {
  accentTextColor,
  bitmapSprite,
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

/** Clear space between the text and the leader line. */
const TITLE_GAP = 16;
const SUB_GAP = 14;
const TITLE_SIZE = 46;
const SUB_SIZE = 26;

interface VectorBox {
  readonly w: number;
  readonly h: number;
  readonly textWidth: number;
  /** Height of the horizontal part of the leader line. */
  readonly lineY: number;
  readonly titleBaseline: number;
  readonly titleAscent: number;
  readonly titleDescent: number;
  readonly subBaseline: number;
  readonly dotY: number;
}

const vector: VectorScene<CalloutFields, VectorBox> = {
  measure(c, { fields, theme, locale }) {
    c.font = themeFont(theme, 'display', TITLE_SIZE);
    const title = c.measureText(themeCase(theme, fields.title, locale) || 'H');
    c.font = themeFont(theme, 'body', SUB_SIZE, 700);
    const sub = c.measureText(fields.subtitle || 'H');
    const ascent = Math.ceil(title.actualBoundingBoxAscent);
    const descent = Math.ceil(title.actualBoundingBoxDescent);
    const titleBaseline = 24 + ascent;
    const lineY = titleBaseline + descent + theme.headingDrop + TITLE_GAP;
    // The heading treatment also reaches above the glyphs (about half of its drop).
    const subBaseline =
      lineY + SUB_GAP + theme.headingDrop / 2 + Math.ceil(sub.actualBoundingBoxAscent);
    const dotY = subBaseline + 90;
    const tw = Math.max(title.width, sub.width, 120) + 20;
    return {
      w: 180 + tw + 40,
      h: dotY + 40,
      textWidth: tw,
      lineY,
      titleBaseline,
      titleAscent: ascent,
      titleDescent: descent,
      subBaseline,
      dotY,
    };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const { enter, exit, pop } = theme.motion;
    const left = fields.direction === 'left';
    const X = (x: number) => (left ? box.w - x : x);
    const dot = { x: X(28), y: box.dotY };
    const elbow = { x: X(160), y: box.lineY };
    const end = { x: X(160 + box.textWidth + 30), y: box.lineY };

    // The leader line draws out to the label; the anchor pops in on top of it.
    theme.leader(
      c,
      [dot, elbow, end],
      envelope(t, dur, 0.18, 0.84, 0.58, 0.12, enter, exit),
      accent,
    );
    const dotIn = envelope(t, dur, 0, 0.32, 0.72, 0.4, pop, exit);
    if (dotIn > 0) {
      c.save();
      c.translate(dot.x, dot.y);
      c.scale(dotIn, dotIn);
      theme.marker(c, 0, 0, 20, 'dot', accent, t);
      c.restore();
    }

    // Title above the line, subtitle below it, each in the theme's reveal.
    const tf = themeFont(theme, 'display', TITLE_SIZE);
    const title = themeCase(theme, fields.title, locale);
    const tw = textWidth(c, title, tf) + 16;
    const textX = left ? elbow.x - 10 : elbow.x + 10;
    const align = left ? 'right' : 'left';
    const top = box.titleBaseline - box.titleAscent - 8;
    theme.reveal(
      c,
      envelope(t, dur, 0.62, 1.22, 0.5, 0.06, linear, linear),
      left ? elbow.x - tw - 2 : elbow.x + 2,
      top,
      tw,
      box.titleAscent + box.titleDescent + 16,
      accent,
      () => theme.heading(c, title, textX, box.titleBaseline, tf, align, undefined, accent),
    );

    const sf = themeFont(theme, 'body', SUB_SIZE, 700);
    const sw = textWidth(c, fields.subtitle, sf) + 16;
    const subColor = accentTextColor(theme, accent) === '#111111' ? '#fff' : accent;
    theme.reveal(
      c,
      envelope(t, dur, 1.0, 1.4, 0.3, 0.04, linear, linear),
      left ? elbow.x - sw - 2 : elbow.x + 2,
      box.lineY + SUB_GAP - 4,
      sw,
      box.subBaseline - box.lineY + 2,
      accent,
      () => theme.heading(c, fields.subtitle, textX, box.subBaseline, sf, align, subColor, '#111'),
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

/**
 * Lower third: a name or product title with a subtitle and an optional tag,
 * anchored bottom-left.
 */
import {
  clamp,
  easeInOut,
  easeOut,
  envelope,
  fillTextAt,
  labelText,
  letterPositions,
  linear,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelChip,
  pixelPanel,
  pixelTextStyles,
  popScale,
  textWidth,
  themeCase,
  themeFont,
  typedEnd,
  typedVisible,
  upper,
  type VectorScene,
  withClip,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';
import { typedUntil, typing } from './sounds.ts';

const fields = {
  tag: field.text({
    label: 'templates.lowerThird.fields.tag',
    help: 'templates.lowerThird.fields.tagHelp',
    maxLength: 30,
    default: ({ t }) => t('templates.lowerThird.sample.tag'),
  }),
  title: field.text({
    label: 'templates.lowerThird.fields.title',
    maxLength: 60,
    default: ({ t }) => t('templates.lowerThird.sample.title'),
  }),
  subtitle: field.text({
    label: 'templates.lowerThird.fields.subtitle',
    maxLength: 90,
    default: ({ t }) => t('templates.lowerThird.sample.subtitle'),
  }),
};

export type LowerThirdFields = FieldValues<typeof fields>;

/** Size of the tag chip text, and the card height. */
const TAG_SIZE = 20;
const CARD_H = 150;

interface VectorBox {
  readonly w: number;
  readonly h: number;
  /** Top of the card (below the tag). */
  readonly cardY: number;
}

const vector: VectorScene<LowerThirdFields, VectorBox> = {
  measure(c, { fields, theme, accent, locale }) {
    const w =
      Math.max(
        textWidth(c, themeCase(theme, fields.title, locale), themeFont(theme, 'display', 58)),
        textWidth(c, fields.subtitle, themeFont(theme, 'body', 28, 700)),
      ) + 96;
    const tag = theme.chip(
      c,
      labelText(theme, fields.tag || ' ', locale),
      0,
      0,
      TAG_SIZE,
      accent,
      false,
    );
    const cardY = Math.round(tag.h + 14);
    return { w: Math.max(w, 380), h: cardY + CARD_H, cardY };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const { w, cardY: y0 } = box;
    const { enter, exit, pop } = theme.motion;
    // The outro runs in reverse: tag, subtitle and title leave first, then
    // the card wipes away and the bar shrinks last.
    const bar = envelope(t, dur, 0, 0.42, 0.42, 0.04, pop, exit);
    const card = envelope(t, dur, 0.12, 0.7, 0.62, 0.12, enter, exit);
    const tagIn = envelope(t, dur, 0.8, 1.2, 1.2, 0.88, pop, exit);

    // The card wipes in from the left.
    if (card > 0) {
      withClip(c, -30, y0 - 30, (w + 60) * card, CARD_H + 70, () =>
        theme.card(c, 0, y0, w, CARD_H, accent),
      );
    }

    // Accent bar left of the card grows from its middle.
    const bh = CARD_H * Math.min(bar, 1.06);
    if (bh > 0.5) theme.rule(c, -28, y0 + (CARD_H - bh) / 2, 10, bh, accent);

    // Tag chip pops in above the card.
    if (fields.tag && tagIn > 0) {
      const label = labelText(theme, fields.tag, locale);
      const size = theme.chip(c, label, 24, 0, TAG_SIZE, accent, false);
      const cx = 24 + size.w / 2;
      const cy = size.h / 2;
      c.save();
      c.translate(cx, cy);
      c.scale(tagIn, tagIn);
      c.translate(-cx, -cy);
      theme.chip(c, label, 24, 0, TAG_SIZE, accent);
      c.restore();
    }

    // Title letters rise into place one by one, and drop out at the end,
    // always inside the card.
    const title = themeCase(theme, fields.title, locale);
    const tf = themeFont(theme, 'display', 58);
    const letters = letterPositions(c, title, tf);
    const outAt = dur - 1.0;
    const stagger = Math.min(0.015, 0.22 / Math.max(1, letters.chars.length - 1));
    withClip(c, -10, y0 + 8, Math.min(w + 20, (w + 60) * card - 30), 98, () => {
      letters.chars.forEach((ch, i) => {
        const p = (t - 0.36 - i * 0.026) / 0.42;
        if (p <= 0) return;
        const out = t > outAt ? exit((t - outAt - i * stagger) / 0.4) : 0;
        const dy = (1 - pop(p)) * 96 + out * 100;
        fillTextAt(c, ch, 36 + (letters.xs[i] ?? 0), y0 + 82 + dy, tf, theme.colors.text);
      });
    });

    // Subtitle appears in the theme's reveal style.
    const sf = themeFont(theme, 'body', 28, 700);
    const sw = textWidth(c, fields.subtitle, sf) + 10;
    theme.reveal(
      c,
      envelope(t, dur, 0.72, 1.4, 1.15, 0.72, linear, exit),
      34,
      y0 + 101,
      sw,
      36,
      accent,
      () => fillTextAt(c, fields.subtitle, 38, y0 + 128, sf, theme.colors.sub),
    );

    // Progress line along the bottom while the graphic holds.
    if (card > 0.99) {
      const p = clamp((t - 1.4) / Math.max(0.5, dur - 2.5));
      if (p > 0) theme.rule(c, 0, y0 + CARD_H - 5, w * easeInOut(p), 5, accent);
    }
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly title: PixelText;
  readonly subtitle: PixelText;
  readonly pw: number;
  readonly ph: number;
}

const pixel: PixelScene<LowerThirdFields, PixelBox> = {
  measure({ fields, accent }) {
    const title = pixelTextStyles.title(fields.title, accent);
    const subtitle = pixelTextStyles.small(fields.subtitle, '#BDBDBD');
    const pw = Math.max(title.w, subtitle.w) + 17;
    const ph = 4 + title.h + 1 + subtitle.h + 3;
    return { w: pw + 1, h: 7 + ph + 3, title, subtitle, pw, ph };
  },

  draw(P, t, { fields, accent, locale, duration: dur, box }) {
    const b = box;
    const y0 = 7;
    const panel = pixelPanel(b.pw, b.ph, PIXEL_PANEL_FILL);
    // The outro runs in reverse: text erases, the tag pops away, the bar
    // shrinks, then the panel rolls back up.
    const out = dur - 1.3;

    // Panel unrolls column by column, and rolls back up at the end.
    const pin = easeOut((t - 0.1) / 0.4);
    const pout = t > dur - 0.5 ? 1 - easeInOut((t - (dur - 0.5)) / 0.42) : 1;
    const cols = Math.round(b.pw * Math.min(pin, pout));
    P.img(panel, 0, y0, 0, 0, cols, panel.h);

    if (cols >= b.pw - 1) {
      const barIn = clamp((t - 0.42) / 0.18);
      const barOut = t > dur - 0.66 ? 1 - easeInOut((t - (dur - 0.66)) / 0.16) : 1;
      const bh = Math.round((b.ph - 8) * barIn * barOut);
      P.rect(4, y0 + 4 + Math.floor((b.ph - 8 - bh) / 2), 2, bh, accent);

      const s1 = 0.55;
      const n1 = typedVisible(t, s1, b.title.length, out + 0.15);
      P.text(b.title, 9, y0 + 3, n1);
      P.caret(b.title, 9, y0 + 3, n1, accent, t, s1, typedEnd(s1, b.title.length) + 0.1);

      const s2 = typedEnd(s1, b.title.length) + 0.12;
      const n2 = typedVisible(t, s2, b.subtitle.length, out);
      const sy = y0 + 4 + b.title.h;
      P.text(b.subtitle, 10, sy, n2);
      P.caret(b.subtitle, 10, sy, n2, accent, t, s2, typedEnd(s2, b.subtitle.length) + 0.5);

      // A glint runs across the top edge every 2.4 s.
      const gp = ((t - 1.6) % 2.4) / 0.45;
      if (t > 1.6 && gp < 1 && t < out)
        P.rect(Math.round(5 + (b.pw - 12) * gp), y0 + 3, 3, 1, '#FFFFFF');
    }

    if (fields.tag)
      P.pop(pixelChip(upper(fields.tag, locale), accent), 8, 0, popScale(t, 0.9, dur - 1.2, P.px));
  },
};

export const lowerThird = defineTemplate({
  id: 'lower-third',
  name: 'templates.lowerThird.name',
  duration: 5,
  minDuration: 3,
  position: 'bl',
  fields,
  render: { vector, pixel },
  sounds: ({ fields, duration: dur, pixel }) => {
    if (pixel) {
      // The panel unrolls, the title and subtitle type themselves in.
      const s2 = typedUntil(0.55, fields.title) + 0.12;
      return [
        { t: 0.1, kind: 'whoosh', gain: 0.7 },
        ...typing(0.55, fields.title),
        ...typing(s2, fields.subtitle),
        ...(fields.tag ? [{ t: 0.9, kind: 'pop', gain: 0.6 } as const] : []),
        { t: dur - 0.5, kind: 'swoosh' },
      ];
    }
    return [
      { t: 0.1, kind: 'whoosh' },
      { t: 0.72, kind: 'blip', gain: 0.4 },
      ...(fields.tag ? [{ t: 0.8, kind: 'pop', gain: 0.6 } as const] : []),
      { t: dur - 0.62, kind: 'swoosh' },
    ];
  },
});

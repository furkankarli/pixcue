/**
 * Lower third: a name or product title with a subtitle and an optional tag,
 * anchored bottom-left.
 */
import {
  blockReveal,
  clamp,
  easeIn,
  easeInOut,
  easeOut,
  easeOutBack,
  envelope,
  fillTextAt,
  letterPositions,
  linear,
  onColor,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelChip,
  pixelPanel,
  pixelTextStyles,
  popScale,
  roundRectPath,
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

/** Panel top inside the graphic; the tag sits above it. */
const Y0 = 46;
const PANEL_H = 150;

const vector: VectorScene<LowerThirdFields> = {
  measure(c, { fields, theme, locale }) {
    const w =
      Math.max(
        textWidth(c, themeCase(theme, fields.title, locale), themeFont(theme, 'display', 58)),
        textWidth(c, fields.subtitle, themeFont(theme, 'body', 28, 700)),
      ) + 96;
    return { w: Math.max(w, 380), h: 200 };
  },

  draw(c, t, { fields, theme, accent, locale, duration: dur, box }) {
    const w = box.w;
    const bar = envelope(t, dur, 0, 0.42, 0.55, 0.15, easeOutBack, easeIn);
    const pan = envelope(t, dur, 0.12, 0.7, 0.75, 0.3);
    const tagIn = envelope(t, dur, 0.8, 1.2, 0.55, 0.15, easeOutBack, easeIn);

    // Panel wipes in from the left, with a light sweep crossing it once.
    withClip(c, -30, Y0 - 30, (w + 60) * pan, PANEL_H + 70, () => {
      theme.panel(c, 0, Y0, w, PANEL_H);
      const sp = (t - 0.75) / 0.75;
      if (sp > 0 && sp < 1) {
        c.save();
        c.beginPath();
        c.rect(0, Y0, w, PANEL_H);
        c.clip();
        const gx = -160 + (w + 320) * easeInOut(sp);
        const g = c.createLinearGradient(gx - 140, 0, gx + 140, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, theme.colors.sweep);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.transform(1, 0, -0.35, 1, 0, 0);
        c.fillRect(gx - 140 + (Y0 + PANEL_H) * 0.35, Y0, 280, PANEL_H);
        c.restore();
      }
    });

    // Accent bar left of the panel.
    const bh = PANEL_H * Math.min(bar, 1.06);
    c.fillStyle = accent;
    c.fillRect(-26, Y0 + (PANEL_H - bh) / 2, 10, bh);

    // Tag chip pops in above the panel.
    if (fields.tag && tagIn > 0) {
      const f = themeFont(theme, 'body', 20, 800);
      const s = upper(fields.tag, locale);
      const tw = textWidth(c, s, f) + 30;
      const cx = 30 + tw / 2;
      const cy = Y0 - 19;
      c.save();
      c.translate(cx, cy);
      c.scale(tagIn, tagIn);
      c.translate(-cx, -cy);
      roundRectPath(c, 30, Y0 - 36, tw, 34, theme.chip.radius);
      c.fillStyle = accent;
      c.fill();
      if (theme.chip.outline) {
        c.lineWidth = 4;
        c.strokeStyle = theme.chip.outline;
        c.stroke();
      }
      fillTextAt(c, s, 45, Y0 - 12, f, onColor(accent));
      c.restore();
    }

    // Title letters rise into place one by one, and drop out at the end.
    const title = themeCase(theme, fields.title, locale);
    const tf = themeFont(theme, 'display', 58);
    const letters = letterPositions(c, title, tf);
    withClip(c, -10, Y0 + 8, w + 20, 98, () => {
      letters.chars.forEach((ch, i) => {
        const p = (t - 0.36 - i * 0.026) / 0.42;
        if (p <= 0) return;
        const out = t > dur - 0.62 ? easeIn((t - (dur - 0.62) - i * 0.01) / 0.3) : 0;
        const dy = (1 - easeOutBack(p)) * 96 + out * 100;
        fillTextAt(c, ch, 36 + (letters.xs[i] ?? 0), Y0 + 82 + dy, tf, theme.colors.text);
      });
    });

    // Subtitle is uncovered by an accent block.
    const sf = themeFont(theme, 'body', 28, 700);
    const sw = textWidth(c, fields.subtitle, sf) + 10;
    blockReveal(
      c,
      envelope(t, dur, 0.72, 1.4, 0.72, 0.22, linear, linear),
      34,
      Y0 + 101,
      sw,
      36,
      accent,
      () => fillTextAt(c, fields.subtitle, 38, Y0 + 128, sf, theme.colors.sub),
    );

    // Progress line along the bottom while the graphic holds.
    if (pan > 0.99) {
      const p = clamp((t - 1.4) / Math.max(0.5, dur - 2.5));
      c.fillStyle = accent;
      c.fillRect(0, Y0 + PANEL_H - 5, w * easeInOut(p), 5);
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
    const out = dur - 1.05;

    // Panel unrolls column by column, and rolls back up at the end.
    const pin = easeOut((t - 0.1) / 0.4);
    const pout = t > dur - 0.45 ? 1 - easeIn((t - (dur - 0.45)) / 0.35) : 1;
    const cols = Math.round(b.pw * Math.min(pin, pout));
    P.img(panel, 0, y0, 0, 0, cols, panel.h);

    if (cols >= b.pw - 1) {
      const barIn = clamp((t - 0.42) / 0.18);
      const barOut = t > dur - 0.55 ? clamp(1 - (t - (dur - 0.55)) / 0.1) : 1;
      const bh = Math.round((b.ph - 8) * barIn * barOut);
      P.rect(4, y0 + 4 + Math.floor((b.ph - 8 - bh) / 2), 2, bh, accent);

      const s1 = 0.55;
      const n1 = typedVisible(t, s1, b.title.length, out + 0.18);
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
      P.pop(pixelChip(upper(fields.tag, locale), accent), 8, 0, popScale(t, 0.9, dur - 1.15, P.px));
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
});

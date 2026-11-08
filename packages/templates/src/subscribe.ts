/**
 * Subscribe button: "Subscribe" (or "Follow" outside YouTube), then the like
 * and bell buttons are pressed in turn, each with the theme's burst. A mouse
 * pointer clicks them in horizontal video; in vertical and square formats,
 * watched on phones, a finger taps them instead. Bottom-center.
 */
import {
  bellIcon,
  bitmapSprite,
  customSprite,
  drawCursor,
  drawIcon,
  drawTap,
  easeInOut,
  easeOutBack,
  type Frame,
  fillTextAt,
  heartIcon,
  luminance,
  mix,
  onColor,
  type Painter,
  PIXEL_FONT_BOLD,
  type PixelScene,
  type PixelText,
  pixelPanel,
  pixelRoundRect,
  pixelTextStyles,
  popScale,
  rasterizeText,
  roundRectPath,
  type SoundCue,
  SPRITES,
  type Sprite,
  seededRandom,
  tapPhase,
  textWidth,
  themeCase,
  themeFont,
  thumbIcon,
  upper,
  type VectorScene,
  withClip,
} from '@pixcue/engine';
import { type DefaultContext, defineTemplate, type FieldValues, field } from './api.ts';

const isYouTube = ({ platform }: Pick<DefaultContext, 'platform'>) => platform === 'youtube';

const fields = {
  button: field.text({
    label: 'templates.subscribe.fields.button',
    maxLength: 24,
    default: (ctx) =>
      ctx.t(
        isYouTube(ctx)
          ? 'templates.subscribe.sample.subscribe'
          : 'templates.subscribe.sample.follow',
      ),
  }),
  done: field.text({
    label: 'templates.subscribe.fields.done',
    maxLength: 24,
    default: (ctx) =>
      ctx.t(
        isYouTube(ctx)
          ? 'templates.subscribe.sample.subscribed'
          : 'templates.subscribe.sample.following',
      ),
  }),
  like: field.boolean({ label: 'templates.subscribe.fields.like', default: true }),
  bell: field.boolean({ label: 'templates.subscribe.fields.bell', default: isYouTube }),
  pointer: field.select({
    label: 'templates.subscribe.fields.pointer',
    help: 'templates.subscribe.fields.pointerHelp',
    options: [
      { value: 'auto', label: 'templates.subscribe.fields.pointerAuto' },
      { value: 'cursor', label: 'templates.subscribe.fields.pointerCursor' },
      { value: 'tap', label: 'templates.subscribe.fields.pointerTap' },
      { value: 'none', label: 'templates.subscribe.fields.pointerNone' },
    ],
    default: 'auto',
  }),
};

export type SubscribeFields = FieldValues<typeof fields>;

/** Click times: subscribe, like, bell. The animation needs at least 5 s. */
const A1 = 1.45;
const A2 = 2.55;
const A3 = 3.35;

/** One frame at 30 fps: pops start here so the first frame stays empty. */
const FIRST_FRAME = 1 / 30;

/** Thumbs-up on YouTube, heart everywhere else. */
const likeKind = (frame: Frame) => (frame.platform === 'youtube' ? 'thumb' : 'heart');

/** The pointer to show: automatic means a tap wherever viewers watch on phones. */
function pointerKind(pointer: SubscribeFields['pointer'], frame: Frame): 'cursor' | 'tap' | 'none' {
  if (pointer !== 'auto') return pointer;
  return frame.orientation === 'horizontal' ? 'cursor' : 'tap';
}

type Point = readonly [number, number];

/**
 * Where the pointer is at time `t`: it flies in from `start`, clicks each
 * target just before its click time, then leaves. `null` when off screen.
 */
function pointerPath(
  t: number,
  targets: readonly (Point | null)[],
  start: Point,
): [number, number, boolean] | null {
  const clicks = [A1, A2, A3];
  const stops = targets.flatMap((p, i) => (p ? [{ p, c: (clicks[i] ?? 0) - 0.1 }] : []));
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return null;
  const segments: [number, number, Point, Point][] = [
    [first.c - 0.65, first.c - 0.15, start, first.p],
  ];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (a && b) segments.push([b.c - 0.55, b.c - 0.12, a.p, b.p]);
  }
  segments.push([last.c + 0.3, last.c + 0.8, last.p, start]);
  const lastSegment = segments[segments.length - 1];
  if (t < first.c - 0.65 || !lastSegment || t > lastSegment[1]) return null;
  let p: Point = start;
  for (const [t0, t1, from, to] of segments) {
    if (t < t0) break;
    const k = easeInOut((t - t0) / (t1 - t0));
    p = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k];
  }
  return [p[0], p[1], stops.some((s) => t >= s.c && t < s.c + 0.12)];
}

interface VectorBox {
  readonly w: number;
  readonly h: number;
  readonly font: string;
  readonly before: string;
  readonly after: string;
  /** Button width before and after the click. */
  readonly w0: number;
  readonly w1: number;
}

const vector: VectorScene<SubscribeFields, VectorBox> = {
  measure(c, { fields, theme, locale }) {
    const font = themeFont(theme, 'display', 44);
    const before = themeCase(theme, fields.button, locale);
    const after = themeCase(theme, fields.done, locale);
    const w0 = 120 + textWidth(c, before, font) + 46;
    const w1 = 120 + textWidth(c, after, font) + 46;
    return {
      w: w1 + (fields.like ? 136 : 0) + (fields.bell ? 136 : 0),
      h: 160,
      font,
      before,
      after,
      w0,
      w1,
    };
  },

  draw(c, t, { fields, theme, accent, frame, duration: dur, box: g }) {
    const Hb = 110;
    const y = 24;
    const { exit } = theme.motion;
    // Buttons leave in reverse: bell, like, then the main button.
    const out = dur - 0.95;
    const ws = g.w0 + (g.w1 - g.w0) * easeInOut((t - A1) / 0.3);
    const done = t >= A1;
    const shift = (g.w1 - ws) / 2;
    const shift0 = (g.w1 - g.w0) / 2;
    const likeX = ws + 26;
    const bellX = likeX + (fields.like ? 136 : 0);
    const likeFinal = g.w1 + 26;
    const bellFinal = likeFinal + (fields.like ? 136 : 0);

    const pop = (start: number, outAt: number) =>
      t >= outAt ? 1 - exit((t - outAt) / 0.4) : easeOutBack((t - start) / 0.36);
    const bump = (a: number) =>
      t >= a && t < a + 0.28 ? 1 + 0.09 * Math.sin((Math.PI * (t - a)) / 0.28) : 1;
    const press = (a: number) => (t >= a - 0.1 && t < a ? 6 : 0);
    const scaled = (cx: number, cy: number, s: number, draw: () => void) => {
      if (s <= 0.002) return;
      c.save();
      c.translate(cx, cy);
      c.scale(s, s);
      c.translate(-cx, -cy);
      draw();
      c.restore();
    };

    c.save();
    c.translate(shift, 0);

    // Main button: play icon + "Subscribe", turning into a check + "Subscribed".
    scaled(ws / 2, y + Hb / 2, pop(0, out + 0.2) * bump(A1), () => {
      const py = y + press(A1);
      theme.button(c, 0, py, ws, Hb, done ? theme.colors.neutral : accent);
      const ib = 74;
      const ix = 18;
      const iy = py + (Hb - ib) / 2;
      roundRectPath(c, ix, iy, ib, ib, theme.iconRadius);
      c.fillStyle = '#fff';
      c.fill();
      if (!done) {
        c.beginPath();
        c.moveTo(ix + 28, iy + 20);
        c.lineTo(ix + 56, iy + 37);
        c.lineTo(ix + 28, iy + 54);
        c.closePath();
        c.fillStyle = luminance(accent) > 0.75 ? '#111' : accent;
        c.fill();
      } else {
        c.beginPath();
        c.moveTo(ix + 20, iy + 39);
        c.lineTo(ix + 32, iy + 51);
        c.lineTo(ix + 55, iy + 25);
        c.strokeStyle = theme.colors.neutral;
        c.lineWidth = 9;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.stroke();
      }
      withClip(c, 108, py - 10, ws - 118, Hb + 20, () =>
        fillTextAt(
          c,
          done ? g.after : g.before,
          118,
          py + Hb / 2 + 16,
          g.font,
          done ? '#fff' : onColor(accent),
        ),
      );
    });

    if (fields.like) {
      const on = t >= A2;
      scaled(likeX + 55, y + 55, pop(0.12, out + 0.1) * bump(A2), () => {
        const py = y + press(A2);
        theme.button(c, likeX, py, 110, 110, on ? accent : theme.colors.neutral);
        const icon = likeKind(frame) === 'thumb' ? thumbIcon : heartIcon;
        drawIcon(c, icon, likeX + 26, py + 24, 58, on ? onColor(accent) : '#fff');
      });
    }

    if (fields.bell) {
      const on = t >= A3;
      scaled(bellX + 55, y + 55, pop(0.24, out) * bump(A3), () => {
        const py = y + press(A3);
        theme.button(c, bellX, py, 110, 110, on ? accent : theme.colors.neutral);
        // The bell swings with a decaying wobble after it is clicked.
        const angle = on ? Math.sin((t - A3) * 34) * 0.38 * Math.exp(-(t - A3) * 2.6) : 0;
        c.save();
        c.translate(bellX + 55, py + 26);
        c.rotate(angle);
        c.translate(-(bellX + 55), -(py + 26));
        drawIcon(c, bellIcon, bellX + 26, py + 24, 58, on ? onColor(accent) : '#fff');
        c.restore();
        if (on && t < A3 + 1.1 && Math.floor((t - A3) * 8) % 2 === 0) {
          c.strokeStyle = '#fff';
          c.lineWidth = 6;
          c.lineCap = 'round';
          for (const side of [-1, 1]) {
            c.beginPath();
            c.arc(
              bellX + 55,
              py + 55,
              76,
              side < 0 ? Math.PI * 1.18 : Math.PI * 1.62,
              side < 0 ? Math.PI * 1.38 : Math.PI * 1.82,
            );
            c.stroke();
            c.beginPath();
            c.arc(
              bellX + 55,
              py + 55,
              92,
              side < 0 ? Math.PI * 1.2 : Math.PI * 1.64,
              side < 0 ? Math.PI * 1.36 : Math.PI * 1.8,
            );
            c.stroke();
          }
        }
      });
    }
    c.restore();

    // The theme's burst around each pressed button. It stays outside the
    // button, so the new label reads at once.
    const hits: [number, number, number, number, number][] = [[A1, g.w1 / 2, ws, Hb, 0]];
    if (fields.like) hits.push([A2, likeFinal + 55, 110, 110, 20]);
    if (fields.bell) hits.push([A3, bellFinal + 55, 110, 110, 40]);
    for (const [a, bx, bw, bh, seed] of hits)
      theme.burst(c, bx, y + bh / 2, (t - a) / 0.7, accent, seed, bw, bh);

    const targets: [number, Point | null][] = [
      [A1, [shift0 + g.w0 * 0.55, y + 64]],
      [A2, fields.like ? [likeFinal + 58, y + 62] : null],
      [A3, fields.bell ? [bellFinal + 58, y + 62] : null],
    ];
    const kind = pointerKind(fields.pointer, frame);
    if (kind === 'tap') {
      for (const [a, p] of targets) if (p) drawTap(c, p[0], p[1] + 6, t, a);
    } else if (kind === 'cursor') {
      const p = pointerPath(
        t,
        targets.map(([, p]) => p),
        [g.w + 260, y + 420],
      );
      if (p) drawCursor(c, p[0], p[1] + (p[2] ? 4 : 0), p[2] ? 1.75 : 1.9);
    }
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly before: PixelText;
  readonly after: PixelText;
  /** Label texts, part of the sprite cache key. */
  readonly labels: string;
  readonly w0: number;
  readonly w1: number;
}

/** The pixel subscribe button at width `w` (22 tall plus a 3-pixel shadow and press offset). */
function buttonSprite(
  w: number,
  done: boolean,
  press: number,
  accent: string,
  b: PixelBox,
): Sprite {
  const key = ['sub', w, done, press, accent, b.labels].join('|');
  return customSprite(key, w, 26, (c) => {
    pixelRoundRect(c, 0, 3, w, 22, 3, 'rgba(0,0,0,0.6)');
    const body = pixelPanel(w, 22, done ? '#505050' : accent, true);
    c.drawImage(body.canvas, 0, 0, w, 22, 0, press, w, 22);
    const y = press;
    pixelRoundRect(c, 5, 5 + y, 15, 12, 2, '#000000');
    pixelRoundRect(c, 6, 6 + y, 13, 10, 1, '#FFFFFF');
    c.fillStyle = '#D2D2D2';
    c.fillRect(6, 14 + y, 13, 1);
    c.fillRect(7, 15 + y, 11, 1);
    if (done) {
      c.drawImage(bitmapSprite(SPRITES.check, { X: '#303030' }).canvas, 9, 8 + y);
    } else {
      const play = bitmapSprite(
        SPRITES.play,
        { D: mix(accent, '#000000', 0.4), R: luminance(accent) > 0.75 ? '#111111' : accent },
        true,
      );
      c.drawImage(play.canvas, 9, 6 + y);
    }
    const label = done ? b.after : b.before;
    const visible = Math.min(label.w, w - 26);
    if (visible > 0) c.drawImage(label.canvas, 0, 0, visible, label.h, 23, 4 + y, visible, label.h);
  });
}

/** A square like/bell button with its icon, optionally pressed or nudged sideways. */
function iconButtonSprite(
  kind: 'thumb' | 'heart' | 'bell',
  on: boolean,
  press: number,
  dx: number,
  accent: string,
): Sprite {
  return customSprite(['icon', kind, on, press, dx, accent].join('|'), 24, 26, (c) => {
    pixelRoundRect(c, 0, 3, 24, 22, 3, 'rgba(0,0,0,0.6)');
    const body = pixelPanel(24, 22, on ? accent : '#505050', true);
    c.drawImage(body.canvas, 0, 0, 24, 22, 0, press, 24, 22);
    const ink = on ? onColor(accent) : '#FFFFFF';
    const icon = bitmapSprite(
      SPRITES[kind],
      { W: ink, g: on ? mix(ink, accent, 0.25) : '#D2D2D2' },
      true,
    );
    c.drawImage(
      icon.canvas,
      Math.floor((24 - icon.w) / 2) + dx,
      Math.floor((22 - icon.h) / 2) + press,
    );
  });
}

/** Rows of a pixel ring of radius `r` cells, `thickness` cells wide. */
function ringRows(r: number, thickness: number): string[] {
  const rows: string[] = [];
  for (let y = -r; y <= r; y++) {
    let row = '';
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      row += d <= r + 0.3 && d > r - thickness + 0.3 ? 'W' : '.';
    }
    rows.push(row);
  }
  return rows;
}

/**
 * A finger tap in pixels (see `tapPhase`): a ring that lands and tightens as
 * it presses, then a thin ring that spreads in whole steps. Drawn as pops so
 * it sits above the buttons, which are pops too.
 */
function pixelTap(P: Painter, x: number, y: number, t: number, at: number): void {
  const s = tapPhase(t, at);
  if (!s) return;
  const ring = (r: number, thickness: number) =>
    bitmapSprite(ringRows(r, thickness), { W: '#FFFFFF' }, true);
  if (s.ripple !== null && s.ripple < 0.9) {
    const r = [7, 9, 11][Math.min(2, Math.floor(s.ripple * 3))] ?? 11;
    P.pop(ring(r, 1), x - r - 1, y - r - 1, P.px);
  }
  if (s.alpha >= 0.5) {
    const r = s.appear < 0.6 ? 7 : s.press > 0.5 ? 4 : 5;
    P.pop(ring(r, 2), x - r - 1, y - r - 1, P.px);
  }
}

const BELL_SHAKE = [-1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 0, 0, -1, 1, 0];

const pixel: PixelScene<SubscribeFields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const before = pixelTextStyles.title(upper(fields.button, locale), accent);
    const after = rasterizeText(upper(fields.done, locale), PIXEL_FONT_BOLD, {
      fill: '#FFFFFF',
      shade: '#D2D2D2',
      outline: '#000000',
      shadow: '#1E1E1E',
      shadowOffset: 1,
    });
    const w0 = 23 + before.w + 4;
    const w1 = 23 + after.w + 4;
    const labels = `${fields.button}\u0000${fields.done}`;
    return {
      w: w1 + (fields.like ? 28 : 0) + (fields.bell ? 28 : 0),
      h: 26,
      before,
      after,
      labels,
      w0,
      w1,
    };
  },

  draw(P, t, { fields, accent, theme, frame, duration: dur, box: b }) {
    // Buttons leave in reverse: bell, like, then the main button.
    const out = dur - 0.95;
    const px = P.px;
    const ws = Math.round(b.w0 + (b.w1 - b.w0) * easeInOut((t - A1) / 0.3));
    const done = t >= A1;
    const shift = Math.round((b.w1 - ws) / 2);
    const shift0 = Math.round((b.w1 - b.w0) / 2);
    const likeX = shift + ws + 4;
    const bellX = likeX + (fields.like ? 28 : 0);
    const likeFinal = b.w1 + 4;
    const bellFinal = likeFinal + (fields.like ? 28 : 0);
    const press = (a: number) => (t >= a - 0.1 && t < a ? 1 : 0);
    // Pop scale, with a one-step bump right after the click.
    const scaleOf = (start: number, outAt: number, click: number) => {
      const k = popScale(t, start, outAt, px);
      return k === px && t >= click && t < click + 0.07 ? px + 1 : k;
    };

    P.pop(
      buttonSprite(ws, done, press(A1), accent, b),
      shift,
      0,
      scaleOf(FIRST_FRAME, out + 0.2, A1),
    );
    if (fields.like) {
      P.pop(
        iconButtonSprite(likeKind(frame), t >= A2, press(A2), 0, accent),
        likeX,
        0,
        scaleOf(0.13, out + 0.1, A2),
      );
    }
    if (fields.bell) {
      const on = t >= A3;
      const dx = on ? (BELL_SHAKE[Math.floor((t - A3) * 15)] ?? 0) : 0;
      P.pop(iconButtonSprite('bell', on, press(A3), dx, accent), bellX, 0, scaleOf(0.26, out, A3));
      const age = t - A3;
      if (age >= 0 && age < 1.1 && Math.floor(age * 7.5) % 2 === 0 && t < out) {
        const up = Math.floor(age * 7.5) % 4 >= 2 ? 1 : 0;
        const ring: Point[] = [
          [bellX - 1, 3 - up],
          [bellX - 2, 2 - up],
          [bellX - 3, 1 - up],
          [bellX + 24, 3 - up],
          [bellX + 25, 2 - up],
          [bellX + 26, 1 - up],
        ];
        for (const [x, y] of ring) P.rect(x - 1, y - 1, 3, 3, '#000000');
        for (const [x, y] of ring) P.rect(x, y, 1, 1, '#FFFFFF');
      }
    }

    // Sparks fly out from each click, slowing down frame by frame.
    const hits: [number, number, number, number][] = [
      [A1, shift0 + Math.round(b.w0 * 0.45), 12, 0],
    ];
    if (fields.like) hits.push([A2, likeFinal + 12, 11, 20]);
    if (fields.bell) hits.push([A3, bellFinal + 12, 11, 40]);
    const colors = [accent, '#FFFFFF', theme.semantic.spark];
    for (const [a, bx, by, seed] of hits) {
      const age = t - a;
      if (age < 0 || age > 0.5) continue;
      const frames = Math.floor(age * 30);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + (seededRandom(seed + i) - 0.5) * 0.5;
        const speed = 2.2 + seededRandom(seed + i + 3) * 1.4;
        let x = bx;
        let y = by;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        for (let f = 0; f < frames; f++) {
          x += vx;
          y += vy;
          vx *= 0.84;
          vy *= 0.84;
        }
        if (age >= 0.5 - 0.04 * (i % 3)) continue;
        const big = age < 0.27;
        const spark = bitmapSprite(
          big ? ['.X.', 'XXX', '.X.'] : ['X'],
          { X: colors[i % 3] ?? accent },
          true,
        );
        P.pop(spark, Math.round(x) - (big ? 2 : 1), Math.round(y) - (big ? 2 : 1), px);
      }
    }

    const targets: [number, Point | null][] = [
      [A1, [shift0 + Math.round(b.w0 * 0.55), 13]],
      [A2, fields.like ? [likeFinal + 13, 13] : null],
      [A3, fields.bell ? [bellFinal + 13, 13] : null],
    ];
    const kind = pointerKind(fields.pointer, frame);
    if (kind === 'tap') {
      for (const [a, p] of targets) if (p) pixelTap(P, p[0], p[1], t, a);
    } else if (kind === 'cursor') {
      const p = pointerPath(
        t,
        targets.map(([, p]) => p),
        [b.w + 44, 70],
      );
      if (p) {
        const cursor = bitmapSprite(SPRITES.cursor, { K: '#0C0C0C', W: '#FAFAFA' });
        P.pop(cursor, Math.round(p[0]), Math.round(p[1]) + (p[2] ? 1 : 0), px);
      }
    }
  },
};

export const subscribe = defineTemplate({
  id: 'subscribe',
  name: 'templates.subscribe.name',
  duration: 5.5,
  minDuration: 5,
  position: 'bc',
  fields,
  render: { vector, pixel },
  sounds: ({ fields, duration: dur, frame }) => {
    // Each press makes the pointer's sound (a click, or a tap on phones),
    // then the button answers: a confirmation, a pop, the bell ringing.
    const press = pointerKind(fields.pointer, frame) === 'tap' ? 'tap' : 'click';
    const at = (a: number) => a - 0.03;
    const cues: SoundCue[] = [
      { t: 0.03, kind: 'pop', gain: 0.6 },
      { t: at(A1), kind: press },
      { t: A1 + 0.02, kind: 'chime', gain: 0.7 },
    ];
    if (fields.like)
      cues.push(
        { t: 0.13, kind: 'pop', gain: 0.4 },
        { t: at(A2), kind: press },
        { t: A2 + 0.02, kind: 'pop' },
      );
    if (fields.bell)
      cues.push(
        { t: 0.26, kind: 'pop', gain: 0.4 },
        { t: at(A3), kind: press },
        { t: A3 + 0.02, kind: 'bell' },
      );
    cues.push({ t: dur - 0.95, kind: 'swoosh', gain: 0.8 });
    return cues;
  },
});

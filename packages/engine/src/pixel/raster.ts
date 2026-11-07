import {
  type Ctx2D,
  context2d,
  createSurface,
  type DrawableSurface,
  onCanvasConfigured,
} from '../canvas.ts';
import { luminance, mix, onColor, parseColor, type Rgba } from '../color.ts';
import { upper } from '../text.ts';
import { type BitmapFont, glyphFor, PIXEL_FONT_BOLD, PIXEL_FONT_SMALL } from './fonts.ts';

/** A pre-rendered pixel image, in pixel-grid units. */
export interface Sprite {
  readonly canvas: DrawableSurface;
  readonly w: number;
  readonly h: number;
}

/** Rasterized pixel text with what typewriter effects and carets need. */
export interface PixelText extends Sprite {
  /** Left edge of each character, plus the end, including padding. */
  readonly xs: readonly number[];
  /** Number of characters. */
  readonly length: number;
  /** Padding around the glyphs added by the outline. */
  readonly pad: number;
  readonly scale: number;
  /** Height of the accent rows above the capitals. */
  readonly ascentHeight: number;
  /** Height of the capitals. */
  readonly capHeight: number;
}

export interface PixelTextOptions {
  /** Integer magnification of each font pixel. */
  readonly scale?: number;
  readonly fill?: string;
  /** Color of the bottom `shadeRows` of each glyph (bold font only). */
  readonly shade?: string;
  /** Outline color; draws a 1-pixel (or `outlineWidth`) outline. */
  readonly outline?: string;
  readonly outlineWidth?: number;
  /** Hard drop-shadow color. */
  readonly shadow?: string;
  /** Drop-shadow offset in pixels (defaults to the scale). */
  readonly shadowOffset?: number;
}

const textCache = new Map<string, PixelText>();
const shapeCache = new Map<string, Sprite>();
onCanvasConfigured(() => {
  textCache.clear();
  shapeCache.clear();
});

function cached<T extends Sprite>(
  cache: Map<string, T>,
  key: string,
  limit: number,
  make: () => T,
): T {
  const hit = cache.get(key);
  if (hit) return hit;
  const value = make();
  if (cache.size > limit) cache.clear();
  cache.set(key, value);
  return value;
}

function newSprite(w: number, h: number): { canvas: DrawableSurface; c: Ctx2D } {
  const canvas = createSurface(w, h);
  return { canvas, c: context2d(canvas) };
}

/**
 * Rasterizes text with a bitmap font into a crisp sprite: glyphs (optionally
 * shaded at the bottom), then an outline grown around them, then a hard shadow.
 * Text is uppercased (Turkish-aware) since the fonts have capitals only.
 */
export function rasterizeText(text: string, font: BitmapFont, o: PixelTextOptions = {}): PixelText {
  const sc = o.scale ?? 1;
  const ol = o.outline ? (o.outlineWidth ?? 1) : 0;
  const sh = o.shadow ? (o.shadowOffset ?? sc) : 0;
  const s = upper(text);
  const key = [
    s,
    font === PIXEL_FONT_BOLD ? 'b' : 's',
    sc,
    o.fill,
    o.shade,
    o.outline,
    ol,
    o.shadow,
    sh,
  ].join('|');
  return cached(textCache, key, 900, () => {
    const chars = Array.from(s);
    const totalRows = font.ascent + font.height + font.descent;
    const points: [x: number, y: number, row: number][] = [];
    const xs: number[] = [];
    let x = 0;
    for (const ch of chars) {
      xs.push(x);
      if (ch === ' ') {
        x += font.space + font.gap;
        continue;
      }
      const g = glyphFor(font, ch);
      let gw = 0;
      g.rows.forEach((row, y) => {
        gw = Math.max(gw, row.length);
        for (let i = 0; i < row.length; i++)
          if (row[i] === 'X') points.push([x + i, font.ascent + y, y]);
      });
      g.accent?.forEach((row, y) => {
        for (let i = 0; i < row.length; i++) if (row[i] === 'X') points.push([x + i, y, -1]);
      });
      g.cedilla?.forEach((row, y) => {
        for (let i = 0; i < row.length; i++) {
          if (row[i] === 'X') points.push([x + i, font.ascent + font.height + y, -1]);
        }
      });
      x += gw + font.gap;
    }
    xs.push(x);
    const textWidth = Math.max(1, x - font.gap);
    const W = textWidth * sc + 2 * ol + sh;
    const H = totalRows * sc + 2 * ol + sh;

    // 0 = empty, 1 = fill, 2 = shade
    const fm = new Uint8Array(W * H);
    for (const [px, py, row] of points) {
      const v = o.shade && row >= font.height - font.shadeRows ? 2 : 1;
      for (let dy = 0; dy < sc; dy++) {
        for (let dx = 0; dx < sc; dx++) fm[(ol + py * sc + dy) * W + ol + px * sc + dx] = v;
      }
    }
    // Grow the glyph mask by `ol` pixels (4-neighbourhood) for the outline.
    let dil = new Uint8Array(W * H);
    for (let i = 0; i < fm.length; i++) dil[i] = fm[i] ? 1 : 0;
    for (let k = 0; k < ol; k++) {
      const next = dil.slice();
      for (let y = 0; y < H; y++) {
        for (let xx = 0; xx < W; xx++) {
          const i = y * W + xx;
          if (dil[i]) continue;
          if (
            (xx > 0 && dil[i - 1]) ||
            (xx < W - 1 && dil[i + 1]) ||
            (y > 0 && dil[i - W]) ||
            (y < H - 1 && dil[i + W])
          ) {
            next[i] = 1;
          }
        }
      }
      dil = next;
    }

    const { canvas, c } = newSprite(W, H);
    const img = c.createImageData(W, H);
    const D = img.data;
    const put = (i: number, col: Rgba) => {
      D[i * 4] = col[0];
      D[i * 4 + 1] = col[1];
      D[i * 4 + 2] = col[2];
      D[i * 4 + 3] = col[3];
    };
    const cFill = parseColor(o.fill ?? '#fff');
    const cShade = parseColor(o.shade ?? o.fill ?? '#fff');
    if (o.shadow) {
      const cShadow = parseColor(o.shadow);
      const src = ol ? dil : fm;
      for (let y = 0; y < H - sh; y++) {
        for (let xx = 0; xx < W - sh; xx++)
          if (src[y * W + xx]) put((y + sh) * W + xx + sh, cShadow);
      }
    }
    if (o.outline) {
      const cOutline = parseColor(o.outline);
      for (let i = 0; i < dil.length; i++) if (dil[i]) put(i, cOutline);
    }
    for (let i = 0; i < fm.length; i++) if (fm[i]) put(i, fm[i] === 2 ? cShade : cFill);
    c.putImageData(img, 0, 0);

    return {
      canvas,
      w: W,
      h: H,
      xs: xs.map((v) => v * sc + ol),
      length: chars.length,
      pad: ol,
      scale: sc,
      ascentHeight: font.ascent * sc,
      capHeight: font.height * sc,
    };
  });
}

/** Fills a rectangle with stepped (pixel-art) corners of radius `r`. */
export function pixelRoundRect(
  c: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) {
  c.fillStyle = color;
  for (let k = 0; k < h; k++) {
    const d = Math.min(k, h - 1 - k);
    const inset = d < r ? r - d : 0;
    if (w - 2 * inset > 0) c.fillRect(x + inset, y + k, w - 2 * inset, 1);
  }
}

/** Dark fill used by pixel-theme panels. */
export const PIXEL_PANEL_FILL = '#1C1C21';

/**
 * A pixel panel: white rim, black border, `fill` body with highlight and shadow
 * rows, and a soft drop shadow 3 pixels below (so the sprite is `h + 3` tall).
 * `button` adds a stronger bevel.
 */
export function pixelPanel(w: number, h: number, fill: string, button = false): Sprite {
  return cached(shapeCache, ['panel', w, h, fill, button ? 1 : 0].join('|'), 300, () => {
    const { canvas, c } = newSprite(w, h + 3);
    pixelRoundRect(c, 0, 3, w, h, 3, 'rgba(0,0,0,0.55)');
    pixelRoundRect(c, 0, 0, w, h, 3, '#FFFFFF');
    pixelRoundRect(c, 1, 1, w - 2, h - 2, 2, '#000000');
    pixelRoundRect(c, 2, 2, w - 4, h - 4, 1, fill);
    c.fillStyle = mix(fill, '#ffffff', button ? 0.4 : 0.14);
    c.fillRect(4, 3, w - 8, 1);
    if (button) {
      c.fillStyle = mix(fill, '#ffffff', 0.2);
      c.fillRect(3, 4, w - 6, 1);
    }
    c.fillStyle = mix(fill, '#000000', button ? 0.38 : 0.4);
    c.fillRect(3, h - 4, w - 6, 2);
    c.fillStyle = '#FFFFFF';
    c.fillRect(3, 3, 2, 1);
    c.fillRect(3, 4, 1, 1);
    c.fillRect(w - 5, 3, 2, 1);
    c.fillRect(w - 4, 4, 1, 1);
    return { canvas, w, h: h + 3 };
  });
}

/**
 * Turns a character map into a sprite: each character in `rows` is looked up
 * in `colors` (unmapped characters stay transparent). `outline` adds a 1-pixel
 * black outline around the shape.
 */
export function bitmapSprite(
  rows: readonly string[],
  colors: Readonly<Record<string, string>>,
  outline = false,
): Sprite {
  const key = `bm|${rows.join('/')}${JSON.stringify(colors)}${outline}`;
  return cached(shapeCache, key, Number.POSITIVE_INFINITY, () => {
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const o = outline ? 1 : 0;
    const { canvas, c } = newSprite(w + 2 * o, h + 2 * o);
    const lit: [number, number, string][] = [];
    for (let y = 0; y < h; y++) {
      const row = rows[y] ?? '';
      for (let x = 0; x < row.length; x++) {
        const color = colors[row[x] ?? ''];
        if (color) lit.push([x + o, y + o, color]);
      }
    }
    if (o) {
      const set = new Set(lit.map(([x, y]) => `${x},${y}`));
      c.fillStyle = '#000000';
      for (let y = 0; y < h + 2; y++) {
        for (let x = 0; x < w + 2; x++) {
          if (set.has(`${x},${y}`)) continue;
          if (
            set.has(`${x - 1},${y}`) ||
            set.has(`${x + 1},${y}`) ||
            set.has(`${x},${y - 1}`) ||
            set.has(`${x},${y + 1}`)
          ) {
            c.fillRect(x, y, 1, 1);
          }
        }
      }
    }
    for (const [x, y, color] of lit) {
      c.fillStyle = color;
      c.fillRect(x, y, 1, 1);
    }
    return { canvas, w: w + 2 * o, h: h + 2 * o };
  });
}

/** Generic pixel icons. Letters are color slots filled by `bitmapSprite`. */
export const SPRITES = {
  thumb: [
    '.....WW....',
    '....WWW....',
    '....WWW....',
    '...WWWW....',
    '...WWWWWWWW',
    'WW.WWWWWWWW',
    'WW.WWWWWWW.',
    'WW.WWWWWWWW',
    'WW.WWWWWWW.',
    'gg.gggggggg',
    'gg.gggggg..',
  ],
  bell: [
    '.....W.....',
    '....WWW....',
    '...WWWWW...',
    '..WWWWWWW..',
    '..WWWWWWW..',
    '..WWWWWWW..',
    '..WWWWWWW..',
    '.WWWWWWWWW.',
    'ggggggggggg',
    '...........',
    '....ggg....',
  ],
  cursor: [
    'K..........',
    'KK.........',
    'KWK........',
    'KWWK.......',
    'KWWWK......',
    'KWWWWK.....',
    'KWWWWWK....',
    'KWWWWWWK...',
    'KWWWWWWWK..',
    'KWWWWKKKKK.',
    'KWWKWK.....',
    'KWK.KWK....',
    'KK..KWK....',
    'K....KWK...',
    '.....KWK...',
    '......KK...',
  ],
  play: ['DR...', 'DRR..', 'DRRR.', 'DRRRR', 'DRRR.', 'DRR..', 'DR...'],
  check: ['......X', '.....XX', 'X...XX.', 'XX.XX..', '.XXX...', '..X....'],
} as const satisfies Record<string, readonly string[]>;

/** The pixel theme's text styles. */
export const pixelTextStyles = {
  /** Bold title: white with shading, black outline and an accent-tinted shadow. */
  title: (text: string, accent: string) =>
    rasterizeText(text, PIXEL_FONT_BOLD, {
      fill: '#FFFFFF',
      shade: '#D2D2D2',
      outline: '#000000',
      shadow: mix(accent, '#000000', 0.6),
      shadowOffset: 1,
    }),
  /** Bold title magnified `scale` times. */
  big: (text: string, scale: number, accent: string) =>
    rasterizeText(text, PIXEL_FONT_BOLD, {
      scale,
      fill: '#FFFFFF',
      shade: '#D2D2D2',
      outline: '#000000',
      outlineWidth: scale > 1 ? 2 : 1,
      shadow: mix(accent, '#000000', 0.55),
      shadowOffset: scale,
    }),
  /** Small outlined text. */
  small: (text: string, color = '#FFFFFF') =>
    rasterizeText(text, PIXEL_FONT_SMALL, { fill: color, outline: '#000000' }),
  /** Small outlined text in a lightened accent. */
  accent: (text: string, accent: string) =>
    rasterizeText(text, PIXEL_FONT_SMALL, {
      fill: mix(accent, '#FFFFFF', luminance(accent) < 0.25 ? 0.35 : 0.12),
      outline: '#000000',
    }),
  /** Small text without outline. */
  plain: (text: string, color: string) => rasterizeText(text, PIXEL_FONT_SMALL, { fill: color }),
};

/** A small accent-colored label chip. */
export function pixelChip(text: string, accent: string): Sprite {
  return cached(shapeCache, `chip|${text}${accent}`, Number.POSITIVE_INFINITY, () => {
    const label = pixelTextStyles.plain(text, onColor(accent));
    const w = label.w + 6;
    const h = 10;
    const { canvas, c } = newSprite(w, h);
    c.fillStyle = '#000000';
    c.fillRect(1, 0, w - 2, h);
    c.fillRect(0, 1, w, h - 2);
    c.fillStyle = accent;
    c.fillRect(1, 1, w - 2, h - 2);
    c.fillStyle = mix(accent, '#ffffff', 0.35);
    c.fillRect(2, 1, w - 4, 1);
    c.drawImage(label.canvas, 3, 1);
    return { canvas, w, h };
  });
}

/** A bordered square, optionally with a plus or minus sign. */
export function pixelBox(w: number, h: number, fill: string, inner?: 'plus' | 'minus'): Sprite {
  return cached(shapeCache, ['box', w, h, fill, inner].join('|'), Number.POSITIVE_INFINITY, () => {
    const { canvas, c } = newSprite(w, h);
    c.fillStyle = '#000000';
    c.fillRect(0, 0, w, h);
    c.fillStyle = fill;
    c.fillRect(1, 1, w - 2, h - 2);
    if (inner) {
      c.fillStyle = '#FFFFFF';
      const m = Math.floor(w / 2);
      c.fillRect(2, m - 1, w - 4, 2);
      if (inner === 'plus') c.fillRect(m - 1, 2, 2, h - 4);
    }
    return { canvas, w, h };
  });
}

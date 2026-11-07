import type { Ctx2D } from './canvas.ts';
import { upper } from './text.ts';
import { roundRectPath } from './vector/draw.ts';

export interface FontFace {
  /** CSS font family list, e.g. `"Chakra Petch", Manrope, sans-serif`. */
  readonly family: string;
  readonly weight: number;
}

export interface VectorThemeColors {
  /** Main text on panels. */
  readonly text: string;
  /** Secondary text. */
  readonly sub: string;
  /** Dividers and empty tracks. */
  readonly line: string;
  /** Inactive buttons ("subscribed" state). */
  readonly neutral: string;
  /** The light sweep that crosses panels as they appear. */
  readonly sweep: string;
}

/** Colors with a fixed meaning, shared by every theme. */
export interface SemanticColors {
  /** Good things: pros, checks. */
  readonly positive: string;
  /** Bad things: cons. */
  readonly negative: string;
  /** Celebration sparks and confetti, next to the accent and white. */
  readonly spark: string;
}

export const SEMANTIC_COLORS: SemanticColors = {
  positive: '#22C55E',
  negative: '#EF4444',
  spark: '#FFD43B',
};

/** A theme drawn with vector Canvas 2D: fonts, colors and a few shape styles. */
export interface VectorTheme {
  readonly kind: 'vector';
  readonly id: 'tech' | 'pop' | 'sade';
  /** Default accent color; users can override it. */
  readonly accent: string;
  readonly semantic: SemanticColors;
  readonly fonts: { readonly display: FontFace; readonly body: string };
  /** Whether headings are set in capitals. */
  readonly uppercase: boolean;
  readonly colors: VectorThemeColors;
  /** Color for text that would otherwise use the accent; `undefined` means the accent itself. */
  readonly accentText: string | undefined;
  /** Corner radius of icon tiles inside buttons. */
  readonly iconRadius: number;
  /** Style of small label chips (for example the lower third's tag). */
  readonly chip: { readonly radius: number; readonly outline: string | undefined };
  panel(c: Ctx2D, x: number, y: number, w: number, h: number): void;
  button(c: Ctx2D, x: number, y: number, w: number, h: number, fill: string): void;
  /** Large text with the theme's treatment (shadow, offset outline…). */
  heading(
    c: Ctx2D,
    text: string,
    x: number,
    y: number,
    font: string,
    align: CanvasTextAlign,
    color?: string,
    accent?: string,
  ): void;
}

/** The pixel theme renders through the pixel engine with bitmap fonts. */
export interface PixelTheme {
  readonly kind: 'pixel';
  readonly id: 'pixel';
  readonly accent: string;
  readonly semantic: SemanticColors;
}

export type Theme = VectorTheme | PixelTheme;
export type ThemeId = Theme['id'];

const tech: VectorTheme = {
  kind: 'vector',
  id: 'tech',
  semantic: SEMANTIC_COLORS,
  accent: '#00E5FF',
  fonts: {
    display: { family: '"Chakra Petch", Manrope, sans-serif', weight: 700 },
    body: 'Manrope, sans-serif',
  },
  uppercase: true,
  colors: {
    text: '#FFFFFF',
    sub: '#A7B1BF',
    line: 'rgba(255,255,255,.14)',
    neutral: '#3A414B',
    sweep: 'rgba(255,255,255,.16)',
  },
  accentText: undefined,
  iconRadius: 14,
  chip: { radius: 5, outline: undefined },
  panel(c, x, y, w, h) {
    roundRectPath(c, x, y, w, h, 6);
    c.fillStyle = 'rgba(11,14,19,.92)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.09)';
    c.lineWidth = 2;
    c.stroke();
  },
  button(c, x, y, w, h, fill) {
    roundRectPath(c, x, y, w, h, 14);
    c.fillStyle = fill;
    c.fill();
    c.save();
    roundRectPath(c, x, y, w, h, 14);
    c.clip();
    c.fillStyle = 'rgba(255,255,255,.16)';
    c.fillRect(x, y, w, h * 0.42);
    c.restore();
    roundRectPath(c, x, y, w, h, 14);
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = 3;
    c.stroke();
  },
  heading(c, text, x, y, font, align, color) {
    c.save();
    c.font = font;
    c.textAlign = align;
    c.shadowColor = 'rgba(0,0,0,.6)';
    c.shadowBlur = 26;
    c.shadowOffsetY = 4;
    c.fillStyle = color ?? '#fff';
    c.fillText(text, x, y);
    c.restore();
  },
};

const pop: VectorTheme = {
  kind: 'vector',
  id: 'pop',
  semantic: SEMANTIC_COLORS,
  accent: '#FFD21F',
  fonts: {
    display: { family: 'Anton, Impact, sans-serif', weight: 400 },
    body: 'Manrope, sans-serif',
  },
  uppercase: true,
  colors: {
    text: '#111111',
    sub: '#4A4A4A',
    line: 'rgba(0,0,0,.14)',
    neutral: '#2B2B2B',
    sweep: 'rgba(255,210,31,.35)',
  },
  accentText: '#111111',
  iconRadius: 12,
  chip: { radius: 0, outline: '#111' },
  panel(c, x, y, w, h) {
    c.fillStyle = '#111';
    c.fillRect(x + 12, y + 12, w, h);
    c.fillStyle = '#fff';
    c.fillRect(x, y, w, h);
    c.lineWidth = 5;
    c.strokeStyle = '#111';
    c.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  },
  button(c, x, y, w, h, fill) {
    roundRectPath(c, x + 9, y + 9, w, h, 16);
    c.fillStyle = '#111';
    c.fill();
    roundRectPath(c, x, y, w, h, 16);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = '#111';
    c.stroke();
  },
  heading(c, text, x, y, font, align, color, accent) {
    c.save();
    c.font = font;
    c.textAlign = align;
    c.lineJoin = 'round';
    c.lineWidth = 14;
    c.strokeStyle = '#111';
    c.strokeText(text, x + 9, y + 9);
    c.fillStyle = accent ?? '#FFD21F';
    c.fillText(text, x + 9, y + 9);
    c.strokeText(text, x, y);
    c.fillStyle = color ?? '#fff';
    c.fillText(text, x, y);
    c.restore();
  },
};

const sade: VectorTheme = {
  kind: 'vector',
  id: 'sade',
  semantic: SEMANTIC_COLORS,
  accent: '#3D5AFE',
  fonts: { display: { family: 'Manrope, sans-serif', weight: 800 }, body: 'Manrope, sans-serif' },
  uppercase: false,
  colors: {
    text: '#15171A',
    sub: '#5C6370',
    line: 'rgba(0,0,0,.1)',
    neutral: '#6B7280',
    sweep: 'rgba(61,90,254,.10)',
  },
  accentText: undefined,
  iconRadius: 37,
  chip: { radius: 5, outline: undefined },
  panel(c, x, y, w, h) {
    c.save();
    c.shadowColor = 'rgba(0,0,0,.28)';
    c.shadowBlur = 40;
    c.shadowOffsetY = 12;
    roundRectPath(c, x, y, w, h, 20);
    c.fillStyle = '#fff';
    c.fill();
    c.restore();
  },
  button(c, x, y, w, h, fill) {
    c.save();
    c.shadowColor = 'rgba(0,0,0,.28)';
    c.shadowBlur = 26;
    c.shadowOffsetY = 8;
    roundRectPath(c, x, y, w, h, h / 2);
    c.fillStyle = fill;
    c.fill();
    c.restore();
  },
  heading(c, text, x, y, font, align, color) {
    c.save();
    c.font = font;
    c.textAlign = align;
    c.shadowColor = 'rgba(0,0,0,.45)';
    c.shadowBlur = 32;
    c.shadowOffsetY = 6;
    c.fillStyle = color ?? '#fff';
    c.fillText(text, x, y);
    c.restore();
  },
};

const pixel: PixelTheme = {
  kind: 'pixel',
  id: 'pixel',
  accent: '#E8100E',
  semantic: SEMANTIC_COLORS,
};

export const THEMES = { tech, pixel, pop, sade } as const satisfies Record<ThemeId, Theme>;

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function isThemeId(value: string): value is ThemeId {
  return Object.hasOwn(THEMES, value);
}

export interface ThemeOptions {
  /** Accent color override (`#rrggbb`). */
  readonly accent?: string | undefined;
  /** Display font family override, e.g. `"Bebas Neue"`. Ignored by the pixel theme. */
  readonly displayFont?: string | undefined;
}

/** A theme with the user's accent and font choices applied. */
export function resolveTheme(id: ThemeId, options: ThemeOptions = {}): Theme {
  const base: Theme = THEMES[id];
  const accent = options.accent ?? base.accent;
  if (base.kind === 'pixel') return { ...base, accent };
  const family = options.displayFont
    ? `${quoteFamily(options.displayFont)}, ${base.fonts.display.family}`
    : base.fonts.display.family;
  return {
    ...base,
    accent,
    fonts: { ...base.fonts, display: { ...base.fonts.display, family } },
  };
}

function quoteFamily(family: string): string {
  const name = family.replace(/["\\]/g, '').trim();
  return /^[A-Za-z-]+$/.test(name) ? name : `"${name}"`;
}

/** Canvas font string for a theme's display or body font. Body weight defaults to 500. */
export function themeFont(
  theme: VectorTheme,
  role: 'display' | 'body',
  size: number,
  weight = 500,
): string {
  if (role === 'display')
    return `${theme.fonts.display.weight} ${size}px ${theme.fonts.display.family}`;
  return `${weight} ${size}px ${theme.fonts.body}`;
}

/** Applies the theme's capitalization to heading text. */
export function themeCase(theme: VectorTheme, text: string): string {
  return theme.uppercase ? upper(text) : String(text ?? '');
}

/** Color for text that "uses the accent", adjusted for themes that need contrast. */
export function accentTextColor(theme: VectorTheme, accent: string): string {
  return theme.accentText ?? accent;
}

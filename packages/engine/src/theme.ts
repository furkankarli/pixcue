import type { Ctx2D } from './canvas.ts';
import type { Easing } from './math.ts';
import { upper } from './text.ts';
import { fillTracked, type Point, trackedWidth } from './themes/kit.ts';
import { pop } from './themes/pop.ts';
import { sade } from './themes/sade.ts';
import { SEMANTIC_COLORS, type SemanticColors } from './themes/semantic.ts';
import { tech } from './themes/tech.ts';

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

export { SEMANTIC_COLORS, type SemanticColors } from './themes/semantic.ts';

/** How a theme moves: easings for entering, leaving and popping elements. */
export interface ThemeMotion {
  readonly enter: Easing;
  readonly exit: Easing;
  readonly pop: Easing;
}

/** Small captions and chip text: case, letter spacing (em) and color. */
export interface LabelStyle {
  readonly uppercase: boolean;
  readonly tracking: number;
  readonly tone: 'accent' | 'sub' | 'text';
}

export type MarkerKind = 'dot' | 'plus' | 'minus';

/**
 * A theme drawn with vector Canvas 2D. Beyond fonts and colors, it draws every
 * recurring element (see docs/themes.md), so templates look consistent within
 * a theme and distinct across themes.
 */
export interface VectorTheme {
  readonly kind: 'vector';
  readonly id: 'tech' | 'pop' | 'sade';
  /** Default accent color; users can override it. */
  readonly accent: string;
  readonly semantic: SemanticColors;
  readonly fonts: { readonly display: FontFace; readonly body: string; readonly label: FontFace };
  /** Whether headings are set in capitals. */
  readonly uppercase: boolean;
  readonly colors: VectorThemeColors;
  /** Color for text that would otherwise use the accent; `undefined` means the accent itself. */
  readonly accentText: string | undefined;
  /** Corner radius of icon tiles inside buttons. */
  readonly iconRadius: number;
  /** How far `heading`'s treatment (offset copy, outline) reaches below the glyphs. */
  readonly headingDrop: number;
  readonly label: LabelStyle;
  readonly motion: ThemeMotion;
  /** A card surface in the theme's style. */
  card(c: Ctx2D, x: number, y: number, w: number, h: number, accent: string): void;
  button(c: Ctx2D, x: number, y: number, w: number, h: number, fill: string): void;
  /** Large text over video with the theme's treatment (shadow, offset outline…). */
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
  /**
   * A small label (tag, chapter number) with its top-left at `(x, y)`; `size`
   * is the font size. With `draw: false` it only measures.
   */
  chip(
    c: Ctx2D,
    text: string,
    x: number,
    y: number,
    size: number,
    accent: string,
    draw?: boolean,
  ): { w: number; h: number };
  /** An accent bar or line. */
  rule(c: Ctx2D, x: number, y: number, w: number, h: number, color: string): void;
  /** A separator, drawn from the left up to `progress` (0–1) of its width. */
  divider(c: Ctx2D, x: number, y: number, w: number, progress: number): void;
  /** A horizontal meter filled to `value` (0–1). */
  meter(c: Ctx2D, x: number, y: number, w: number, h: number, value: number, color: string): void;
  /** A circular meter filled clockwise from the top to `value` (0–1). */
  ring(c: Ctx2D, cx: number, cy: number, r: number, value: number, color: string): void;
  /** A badge or anchor point; `t` (seconds) drives idle animation. */
  marker(
    c: Ctx2D,
    cx: number,
    cy: number,
    size: number,
    kind: MarkerKind,
    color: string,
    t: number,
  ): void;
  /** A connector line through `points`, drawn up to `progress` (0–1) of its length. */
  leader(c: Ctx2D, points: readonly Point[], progress: number, color: string): void;
  /** Reveals what `draw` paints inside the rectangle as `progress` goes 0 → 1. */
  reveal(
    c: Ctx2D,
    progress: number,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    draw: () => void,
  ): void;
  /** Feedback for a click or tap at `(x, y)`; `age` goes 0 → 1 over the effect. */
  burst(c: Ctx2D, x: number, y: number, age: number, color: string, seed: number): void;
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
  /**
   * Display font override: a family name, or a family with the weight to use
   * (for fonts that have only one weight). Ignored by the pixel theme.
   */
  readonly displayFont?: string | { readonly family: string; readonly weight: number } | undefined;
}

/** A theme with the user's accent and font choices applied. */
export function resolveTheme(id: ThemeId, options: ThemeOptions = {}): Theme {
  const base: Theme = THEMES[id];
  const accent = options.accent ?? base.accent;
  if (base.kind === 'pixel') return { ...base, accent };
  const override =
    typeof options.displayFont === 'string' ? { family: options.displayFont } : options.displayFont;
  if (!override) return { ...base, accent };
  return {
    ...base,
    accent,
    fonts: {
      ...base.fonts,
      display: {
        family: `${quoteFamily(override.family)}, ${base.fonts.display.family}`,
        weight: 'weight' in override ? override.weight : base.fonts.display.weight,
      },
    },
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

/** Applies the theme's capitalization to heading text, following the copy locale. */
export function themeCase(theme: VectorTheme, text: string, locale?: string): string {
  return theme.uppercase ? upper(text, locale) : String(text ?? '');
}

/** Color for text that "uses the accent", adjusted for themes that need contrast. */
export function accentTextColor(theme: VectorTheme, accent: string): string {
  return theme.accentText ?? accent;
}

/** Canvas font string for the theme's label font at `size`. */
export function labelFont(theme: VectorTheme, size: number): string {
  return `${theme.fonts.label.weight} ${size}px ${theme.fonts.label.family}`;
}

/** Label color for the theme: the accent, secondary text or main text. */
export function labelColor(theme: VectorTheme, accent: string): string {
  if (theme.label.tone === 'accent') return accentTextColor(theme, accent);
  return theme.label.tone === 'sub' ? theme.colors.sub : theme.colors.text;
}

/** Applies the label style's case. */
export function labelText(theme: VectorTheme, text: string, locale?: string): string {
  return theme.label.uppercase ? upper(text, locale) : String(text ?? '');
}

/** Width of a label in the theme's style. */
export function labelWidth(
  c: Ctx2D,
  theme: VectorTheme,
  text: string,
  size: number,
  locale?: string,
): number {
  return trackedWidth(
    c,
    labelText(theme, text, locale),
    labelFont(theme, size),
    theme.label.tracking * size,
  );
}

/** Draws a caption in the theme's label style; returns its width. */
export function drawLabel(
  c: Ctx2D,
  theme: VectorTheme,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  options: { readonly align?: CanvasTextAlign; readonly locale?: string } = {},
): number {
  return fillTracked(
    c,
    labelText(theme, text, options.locale),
    x,
    y,
    labelFont(theme, size),
    color,
    theme.label.tracking * size,
    options.align,
  );
}

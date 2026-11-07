import {
  type Ctx2D,
  context2d,
  createSurface,
  type DrawableSurface,
  onCanvasConfigured,
} from './canvas.ts';
import type { Frame } from './frame.ts';
import { fitScale, type Layout, place, type Size } from './layout.ts';
import { clamp } from './math.ts';
import { createPainter, type Painter } from './pixel/painter.ts';
import type { Theme, VectorTheme } from './theme.ts';

/** What every scene receives besides the time. */
export interface SceneArgs<F> {
  readonly fields: F;
  /** Clip length in seconds; outro animations count back from it. */
  readonly duration: number;
  readonly frame: Frame;
  readonly accent: string;
}

/**
 * How a template draws with vector themes. `measure` returns the graphic's
 * natural size in design units (plus anything `draw` wants to reuse); `draw`
 * paints one frame at time `t` with the origin at the graphic's top-left.
 */
export interface VectorScene<F, B extends Size = Size> {
  measure(c: Ctx2D, args: SceneArgs<F> & { readonly theme: VectorTheme }): B;
  draw(
    c: Ctx2D,
    t: number,
    args: SceneArgs<F> & { readonly theme: VectorTheme; readonly box: B },
  ): void;
}

/** How a template draws with the pixel theme, in pixel-grid units. */
export interface PixelScene<F, B extends Size = Size> {
  measure(args: SceneArgs<F>): B;
  draw(P: Painter, t: number, args: SceneArgs<F> & { readonly box: B }): void;
}

/** A template's drawing code for both rendering paths. */
export interface Scene<F> {
  readonly vector: VectorScene<F>;
  readonly pixel: PixelScene<F>;
}

export type Background =
  | { readonly kind: 'transparent' }
  | { readonly kind: 'color'; readonly color: string }
  /** Drawn to cover the frame, like CSS `background-size: cover`. */
  | {
      readonly kind: 'image';
      readonly image: CanvasImageSource;
      readonly width: number;
      readonly height: number;
    };

export interface RenderState<F> {
  readonly frame: Frame;
  readonly theme: Theme;
  readonly scene: Scene<F>;
  readonly fields: F;
  readonly duration: number;
  readonly layout: Layout;
  readonly background?: Background | undefined;
}

/** Where the graphic ended up, in output pixels. */
export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Output pixels per pixel-grid cell at 1080p and scale 1. */
const PIXEL_BASE = 6;

/** Size of one pixel-theme grid cell in output pixels for a user scale. */
export function pixelSize(scale: number, frame: Frame): number {
  return clamp(Math.round(PIXEL_BASE * scale * frame.unit), 2, Math.round(14 * frame.unit));
}

let measureCtx: Ctx2D | undefined;
let grid: { surface: DrawableSurface; ctx: Ctx2D } | undefined;
onCanvasConfigured(() => {
  measureCtx = undefined;
  grid = undefined;
});

function getMeasureCtx(): Ctx2D {
  measureCtx ??= context2d(createSurface(1, 1));
  return measureCtx;
}

function getGrid(width: number, height: number): { surface: DrawableSurface; ctx: Ctx2D } {
  if (!grid) {
    const surface = createSurface(width, height);
    grid = { surface, ctx: context2d(surface) };
  } else if (grid.surface.width !== width || grid.surface.height !== height) {
    grid.surface.width = width;
    grid.surface.height = height;
  }
  return grid;
}

function paintBackground(ctx: Ctx2D, frame: Frame, background: Background | undefined): void {
  const W = frame.pixelWidth;
  const H = frame.pixelHeight;
  if (!background || background.kind === 'transparent') return;
  if (background.kind === 'color') {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const { image, width, height } = background;
  const s = Math.max(W / width, H / height);
  ctx.drawImage(image, (W - width * s) / 2, (H - height * s) / 2, width * s, height * s);
}

/**
 * Renders one frame at time `t` (seconds). Deterministic: the same state and
 * time always produce the same pixels. The context must be sized to the
 * frame's pixel size; it is cleared first.
 */
export function render<F>(ctx: Ctx2D, t: number, state: RenderState<F>): Bounds {
  const { frame, theme, fields, duration } = state;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, frame.pixelWidth, frame.pixelHeight);
  paintBackground(ctx, frame, state.background);

  const args: SceneArgs<F> = { fields, duration, frame, accent: theme.accent };
  return theme.kind === 'pixel'
    ? renderPixel(ctx, t, state, args)
    : renderVector(ctx, t, state, { ...args, theme });
}

function renderVector<F>(
  ctx: Ctx2D,
  t: number,
  { frame, scene, layout }: RenderState<F>,
  args: SceneArgs<F> & { readonly theme: VectorTheme },
): Bounds {
  const box = scene.vector.measure(getMeasureCtx(), args);
  const s = fitScale(box, frame, layout.scale);
  const at = place({ w: box.w * s, h: box.h * s }, frame, layout);
  ctx.save();
  ctx.setTransform(frame.unit, 0, 0, frame.unit, 0, 0);
  ctx.translate(at.x, at.y);
  ctx.scale(s, s);
  ctx.textBaseline = 'alphabetic';
  scene.vector.draw(ctx, t, { ...args, box });
  ctx.restore();
  const u = frame.unit;
  return { x: at.x * u, y: at.y * u, width: box.w * s * u, height: box.h * s * u };
}

function renderPixel<F>(
  ctx: Ctx2D,
  t: number,
  { frame, scene, layout }: RenderState<F>,
  args: SceneArgs<F>,
): Bounds {
  const box = scene.pixel.measure(args);
  const { unit, safeArea } = frame;
  let px = pixelSize(layout.scale, frame);
  while (px > 2 && (box.w * px > safeArea.width * unit || box.h * px > safeArea.height * unit))
    px--;

  const gw = Math.ceil(frame.pixelWidth / px);
  const gh = Math.ceil(frame.pixelHeight / px);
  const { surface, ctx: g } = getGrid(gw, gh);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, gw, gh);

  const at = place({ w: (box.w * px) / unit, h: (box.h * px) / unit }, frame, layout);
  const gx = Math.round((at.x * unit) / px);
  const gy = Math.round((at.y * unit) / px);
  const P = createPainter(g, gx, gy, px);
  scene.pixel.draw(P, t, { ...args, box });

  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(surface, 0, 0, gw, gh, 0, 0, gw * px, gh * px);
  P.flush(ctx);
  ctx.imageSmoothingEnabled = smoothing;
  return { x: gx * px, y: gy * px, width: box.w * px, height: box.h * px };
}

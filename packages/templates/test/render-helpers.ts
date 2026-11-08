import {
  type Ctx2D,
  createFrame,
  FRAME_PRESETS,
  type FramePresetId,
  type Layout,
  render,
  resolveTheme,
  scaleFrame,
  type ThemeId,
} from '@pixcue/engine';
import { createTestCanvas } from '@pixcue/engine/testing';
import { createTranslator, type LocaleCode } from '@pixcue/i18n';
import { defaultPosition, resolveFields, type Template } from '../src/api.ts';

export interface RenderCase {
  readonly template: Template;
  readonly theme: ThemeId;
  readonly preset: FramePresetId;
  readonly t: number;
  /** Copy language; Turkish by default because it covers the most glyphs. */
  readonly locale?: LocaleCode;
  readonly overrides?: Readonly<Record<string, unknown>>;
  readonly layout?: Partial<Layout>;
  /** Output width in pixels, smaller than the preset's as in the preview. */
  readonly width?: number;
}

/** Renders one frame of a template with its defaults onto a fresh Node.js canvas. */
export function renderFrame(c: RenderCase) {
  const preset = createFrame(c.preset);
  const frame = c.width ? scaleFrame(preset, c.width) : preset;
  const locale = c.locale ?? 'tr';
  const fields = resolveFields(c.template, c.overrides ?? {}, {
    t: createTranslator(locale),
    locale,
    platform: FRAME_PRESETS[c.preset].platform,
  });
  const { canvas, ctx } = createTestCanvas(frame.pixelWidth, frame.pixelHeight);
  const bounds = render(ctx, c.t, {
    frame,
    theme: resolveTheme(c.theme),
    scene: c.template.render,
    fields,
    duration: c.template.duration,
    locale,
    layout: {
      position: defaultPosition(c.template, preset),
      offset: { x: 0, y: 0 },
      scale: 1,
      ...c.layout,
    },
  });
  return { canvas, ctx, frame, bounds };
}

/** Number of non-transparent pixels on a canvas. */
export function paintedPixels(ctx: Ctx2D, w: number, h: number): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) n++;
  return n;
}

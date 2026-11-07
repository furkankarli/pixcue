import {
  createFrame,
  type FramePresetId,
  type Layout,
  render,
  resolveTheme,
  type Scene,
  type ThemeId,
} from '@pixcue/engine';
import { createTestCanvas } from '@pixcue/engine/testing';

export interface RenderCase<F> {
  readonly scene: Scene<F>;
  readonly fields: F;
  readonly duration: number;
  readonly theme: ThemeId;
  readonly preset: FramePresetId;
  readonly t: number;
  readonly layout?: Partial<Layout>;
}

/** Renders one frame of a scene onto a fresh Node.js canvas. */
export function renderFrame<F>(c: RenderCase<F>) {
  const frame = createFrame(c.preset);
  const { canvas, ctx } = createTestCanvas(frame.pixelWidth, frame.pixelHeight);
  const bounds = render(ctx, c.t, {
    frame,
    theme: resolveTheme(c.theme),
    scene: c.scene,
    fields: c.fields,
    duration: c.duration,
    layout: { position: 'bl', offset: { x: 0, y: 0 }, scale: 1, ...c.layout },
  });
  return { canvas, ctx, frame, bounds };
}

/** Number of non-transparent pixels on a canvas. */
export function paintedPixels(
  ctx: ReturnType<typeof createTestCanvas>['ctx'],
  w: number,
  h: number,
): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) n++;
  return n;
}

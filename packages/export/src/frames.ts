/** A canvas the exporter can read pixels from and hand to encoders. */
export interface FrameCanvas {
  readonly width: number;
  readonly height: number;
  getContext(contextId: '2d'): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
}

export type FrameImage = FrameCanvas & CanvasImageSource;

/**
 * What to export: a fixed number of frames, each drawn on demand. Frame `i`
 * shows time `i / fps`. The exporter knows nothing about templates.
 */
export interface FrameSource {
  readonly width: number;
  readonly height: number;
  /** Integer frames per second. */
  readonly fps: number;
  readonly frameCount: number;
  /** Draws frame `index` on a transparent background and returns its canvas. */
  render(index: number): FrameImage | Promise<FrameImage>;
}

/** Platform services: browsers by default, a Node.js canvas in tests. */
export interface ExportPlatform {
  createCanvas(width: number, height: number): FrameImage;
  encodePng(canvas: FrameImage): Promise<Uint8Array>;
}

export const browserPlatform: ExportPlatform = {
  createCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },
  async encodePng(canvas) {
    const blob =
      'convertToBlob' in canvas
        ? await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' })
        : await new Promise<Blob>((resolve, reject) =>
            (canvas as HTMLCanvasElement).toBlob(
              (b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))),
              'image/png',
            ),
          );
    return new Uint8Array(await blob.arrayBuffer());
  },
};

export interface ExportOptions {
  /** Called with overall progress from 0 to 1. */
  readonly onProgress?: ((progress: number) => void) | undefined;
  /** Aborting rejects the export with an `AbortError`. */
  readonly signal?: AbortSignal | undefined;
  readonly platform?: ExportPlatform | undefined;
}

/** Share of the progress bar spent rendering frames; the rest is packaging. */
export const RENDER_SHARE = 0.95;

const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Renders every frame in order and passes it to `visit`, reporting progress and
 * yielding to the event loop now and then so the page stays responsive.
 */
export async function forEachFrame(
  source: FrameSource,
  options: ExportOptions,
  visit: (canvas: FrameImage, index: number) => void | Promise<void>,
): Promise<void> {
  for (let i = 0; i < source.frameCount; i++) {
    options.signal?.throwIfAborted();
    const canvas = await source.render(i);
    await visit(canvas, i);
    options.onProgress?.(((i + 1) / source.frameCount) * RENDER_SHARE);
    if (i % 4 === 3) await nextTick();
  }
  options.signal?.throwIfAborted();
}

/** Timestamp of frame `index` in microseconds, as WebCodecs and the muxers expect. */
export const frameTimestamp = (index: number, fps: number) => Math.round((index * 1e6) / fps);

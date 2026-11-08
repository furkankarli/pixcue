import { browserPlatform, type ExportOptions, type FrameSource, forEachFrame } from '../frames.ts';
import { muxMovPng } from '../mux/mov.ts';
import { createZip } from '../zip.ts';

/**
 * PNG encodes in flight at once. Browsers compress PNGs off the main thread,
 * so a few at a time make frames almost three times faster than one by one.
 */
const PNG_PARALLEL = 4;

async function pngFrames(source: FrameSource, options: ExportOptions): Promise<Uint8Array[]> {
  const platform = options.platform ?? browserPlatform;
  const frames: Uint8Array[] = [];
  // The source reuses one canvas, so each encode gets its own copy.
  const slots = Array.from({ length: PNG_PARALLEL }, () => ({
    canvas: platform.createCanvas(source.width, source.height),
    job: null as Promise<void> | null,
  }));
  await forEachFrame(source, options, async (canvas, i) => {
    const slot = slots[i % slots.length];
    if (!slot) return;
    if (slot.job) await slot.job;
    const ctx = slot.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    ctx.clearRect(0, 0, source.width, source.height);
    ctx.drawImage(canvas, 0, 0);
    slot.job = platform.encodePng(slot.canvas).then((data) => {
      frames[i] = data;
    });
  });
  await Promise.all(slots.map((s) => s.job));
  return frames;
}

/**
 * Transparent PNG images, one per frame, zipped in a folder:
 * `<name>/<name>_0000.png`. Editors import them as an image sequence.
 */
export async function exportPngSequence(
  source: FrameSource,
  options: ExportOptions & { readonly name: string },
): Promise<Blob> {
  const frames = await pngFrames(source, options);
  const digits = Math.max(4, String(frames.length - 1).length);
  const zip = createZip(
    frames.map((data, i) => ({
      name: `${options.name}/${options.name}_${String(i).padStart(digits, '0')}.png`,
      data,
    })),
  );
  options.onProgress?.(1);
  return zip;
}

/**
 * Transparent QuickTime MOV with the PNG codec, for DaVinci Resolve, Premiere
 * Pro and Final Cut Pro. Works in every browser: no video encoder is needed.
 */
export async function exportMov(source: FrameSource, options: ExportOptions = {}): Promise<Blob> {
  const frames = await pngFrames(source, options);
  const mov = muxMovPng(frames, { width: source.width, height: source.height, fps: source.fps });
  options.onProgress?.(1);
  return mov;
}

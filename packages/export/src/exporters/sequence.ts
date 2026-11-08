import { browserPlatform, type ExportOptions, type FrameSource, forEachFrame } from '../frames.ts';
import { muxMovPng } from '../mux/mov.ts';
import { interleave16, type SoundInput, wavFile } from '../sound.ts';
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
 * `<name>/<name>_0000.png`. Editors import them as an image sequence. With
 * sound, a WAV of it sits in the same folder.
 */
export async function exportPngSequence(
  source: FrameSource,
  options: ExportOptions & { readonly name: string; readonly sound?: SoundInput | undefined },
): Promise<Blob> {
  const frames = await pngFrames(source, options);
  const digits = Math.max(4, String(frames.length - 1).length);
  const zip = createZip([
    ...frames.map((data, i) => ({
      name: `${options.name}/${options.name}_${String(i).padStart(digits, '0')}.png`,
      data,
    })),
    // The sound goes beside the frames, to drop on the timeline with them.
    ...(options.sound
      ? [{ name: `${options.name}/${options.name}.wav`, data: wavFile(options.sound) }]
      : []),
  ]);
  options.onProgress?.(1);
  return zip;
}

/**
 * Transparent QuickTime MOV with the PNG codec, for DaVinci Resolve, Premiere
 * Pro and Final Cut Pro. Works in every browser: no video encoder is needed.
 * With sound, it carries a 16-bit PCM sound track.
 */
export async function exportMov(
  source: FrameSource,
  options: ExportOptions & { readonly sound?: SoundInput | undefined } = {},
): Promise<Blob> {
  const frames = await pngFrames(source, options);
  const { sound } = options;
  const mov = muxMovPng(frames, {
    width: source.width,
    height: source.height,
    fps: source.fps,
    audio: sound && {
      pcm: interleave16(sound),
      sampleRate: sound.sampleRate,
      channels: sound.channels.length,
    },
  });
  options.onProgress?.(1);
  return mov;
}

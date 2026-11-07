import { createCanvas } from '@napi-rs/canvas';
import type { ExportPlatform, FrameImage, FrameSource } from '../src/frames.ts';
import { drawFrame, H, W } from './synthetic.ts';

export const nodePlatform: ExportPlatform = {
  createCanvas: (w, h) => createCanvas(w, h) as unknown as FrameImage,
  encodePng: async (canvas) =>
    new Uint8Array(
      await (canvas as unknown as { encode(f: 'png'): Promise<Buffer> }).encode('png'),
    ),
};

/** The synthetic test clip as a frame source. */
export function syntheticSource(frameCount: number, fps = 30): FrameSource {
  return {
    width: W,
    height: H,
    fps,
    frameCount,
    render: (i) => drawFrame(i) as unknown as FrameImage,
  };
}

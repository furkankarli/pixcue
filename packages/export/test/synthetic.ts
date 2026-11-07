/** Synthetic RGBA test frames: a moving square over a horizontal alpha ramp. */
import { createCanvas } from '@napi-rs/canvas';

export const W = 160;
export const H = 90;

export function drawFrame(index: number) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const ramp = ctx.createLinearGradient(0, 0, W, 0);
  ramp.addColorStop(0, 'rgba(0, 120, 255, 0)');
  ramp.addColorStop(1, 'rgba(0, 120, 255, 1)');
  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, W, H / 2);
  ctx.fillStyle = 'rgba(255, 60, 0, 0.6)';
  ctx.fillRect(10 + index * 8, H / 2, 30, 30);
  return canvas;
}

/** Straight (non-premultiplied) RGBA pixels of a frame. */
export function rgbaOf(index: number): Buffer {
  return Buffer.from(drawFrame(index).getContext('2d').getImageData(0, 0, W, H).data);
}

export async function pngOf(index: number): Promise<Uint8Array> {
  return new Uint8Array(await drawFrame(index).encode('png'));
}

import type { ExportPlatform, FrameImage } from './frames.ts';

/** Background colors for chroma keying, pure so keyers pick them up exactly. */
export const KEY_COLORS = {
  green: '#00FF00',
  blue: '#0000FF',
  magenta: '#FF00FF',
} as const;

export type KeyColor = keyof typeof KEY_COLORS;

/**
 * Alpha at or above which a pixel counts as part of the graphic in chroma-key
 * mode. Soft shadows and glows (mostly below 60 % opacity) fall under it and
 * disappear; anti-aliased edges become hard.
 */
export const HARD_EDGE_CUTOFF = Math.round(0.7 * 255);

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Composites straight-alpha RGBA pixels onto a solid color, in place, making
 * every pixel opaque. With `hardEdges`, pixels are either fully the graphic or
 * fully the background, so a chroma keyer leaves no halo.
 */
export function composeOnColor(pixels: Uint8ClampedArray, color: string, hardEdges: boolean): void {
  const [kr, kg, kb] = rgb(color);
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3] ?? 0;
    if (hardEdges) {
      if (a < HARD_EDGE_CUTOFF) {
        pixels[i] = kr;
        pixels[i + 1] = kg;
        pixels[i + 2] = kb;
      }
    } else {
      const f = a / 255;
      pixels[i] = Math.round((pixels[i] ?? 0) * f + kr * (1 - f));
      pixels[i + 1] = Math.round((pixels[i + 1] ?? 0) * f + kg * (1 - f));
      pixels[i + 2] = Math.round((pixels[i + 2] ?? 0) * f + kb * (1 - f));
    }
    pixels[i + 3] = 255;
  }
}

/**
 * Whether a color in the graphic is close enough to the key color that a
 * keyer would cut holes in it, so the editor can suggest another key.
 */
export function conflictsWithKey(color: string, key: KeyColor): boolean {
  const [r, g, b] = rgb(color);
  const [kr, kg, kb] = rgb(KEY_COLORS[key]);
  return Math.hypot(r - kr, g - kg, b - kb) < 160;
}

/** Returns a canvas with `frame` composited onto `color` (reusing `target`). */
export function frameOnColor(
  frame: FrameImage,
  color: string,
  hardEdges: boolean,
  platform: ExportPlatform,
  target?: FrameImage,
): FrameImage {
  const out = target ?? platform.createCanvas(frame.width, frame.height);
  const src = frame.getContext('2d');
  const dst = out.getContext('2d');
  if (!src || !dst) throw new Error('Canvas 2D is not available');
  const image = src.getImageData(0, 0, frame.width, frame.height);
  composeOnColor(image.data, color, hardEdges);
  dst.putImageData(image, 0, 0);
  return out;
}

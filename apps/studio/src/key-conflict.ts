/**
 * Checks whether a chroma key color appears in the graphic. Kept apart from
 * the export pipeline so the export dialog can warn without loading it.
 */
import { render, scaleFrame } from '@pixcue/engine';
import { conflictsWithKey, type KeyColor } from '@pixcue/export';
import { duration, frame, renderState } from './store.ts';

/** Share of the graphic's pixels a keyer would remove before we warn. */
const CONFLICT_SHARE = 0.005;

/**
 * Whether the key color would cut holes in the graphic: renders the mid-clip
 * frame small and counts opaque pixels close to the key. Works for any
 * template, theme and color.
 */
export function keyConflict(key: KeyColor): boolean {
  const output = scaleFrame(frame(), 480);
  const canvas = new OffscreenCanvas(output.pixelWidth, output.pixelHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  render(ctx, duration() / 2, renderState(output));
  const { data } = ctx.getImageData(0, 0, output.pixelWidth, output.pixelHeight);
  let graphic = 0;
  let close = 0;
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 180) continue;
    graphic++;
    const hex = `#${[data[i], data[i + 1], data[i + 2]].map((v) => (v ?? 0).toString(16).padStart(2, '0')).join('')}`;
    if (conflictsWithKey(hex, key)) close++;
  }
  return graphic > 0 && close / graphic > CONFLICT_SHARE;
}

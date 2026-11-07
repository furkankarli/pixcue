import { clamp } from '../math.ts';

/** Pixel animations step at a fixed 30 steps per second, whatever the export frame rate. */
const STEP = 1 / 30;

/** Default typing speed, in characters per second. */
export const TYPE_SPEED = 32;

/** Integer magnifications for a "pop in": 1, 2, …, px + 1 (overshoot), then px. */
export function popSequence(px: number): number[] {
  const seq: number[] = [];
  for (let i = 1; i <= px + 1; i++) seq.push(i);
  seq.push(px);
  return seq;
}

/**
 * Magnification of a sprite that pops in at `start` and, if `outStart` is
 * given, pops out from then on. 0 means hidden; `px` is the resting size.
 */
export function popScale(t: number, start: number, outStart: number | null, px: number): number {
  if (t < start) return 0;
  if (outStart !== null && t >= outStart) {
    const out = [px, px + 1];
    for (let i = px - 1; i >= 1; i--) out.push(i);
    const i = Math.floor((t - outStart) / STEP);
    return i < out.length ? (out[i] ?? 0) : 0;
  }
  const seq = popSequence(px);
  const i = Math.floor((t - start) / STEP);
  return i < seq.length ? (seq[i] ?? px) : px;
}

/** How many of `length` characters are typed by time `t`. */
export function typedCount(t: number, start: number, length: number, speed = TYPE_SPEED): number {
  return clamp(Math.floor((t - start) * speed), 0, length);
}

/**
 * Characters visible at time `t`: typed in from `start`, then deleted quickly
 * (70 per second) from `outStart` on.
 */
export function typedVisible(
  t: number,
  start: number,
  length: number,
  outStart: number | null,
): number {
  let n = typedCount(t, start, length, TYPE_SPEED);
  if (outStart !== null && t >= outStart) {
    n = Math.min(n, clamp(length - Math.floor((t - outStart) * 70), 0, length));
  }
  return n;
}

/** When typing `length` characters from `start` finishes. */
export function typedEnd(start: number, length: number): number {
  return start + length / TYPE_SPEED;
}

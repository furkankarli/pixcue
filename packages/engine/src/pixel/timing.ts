import { clamp, easeInBack, easeOutBack } from '../math.ts';

/** Pixel animations step at a fixed 30 steps per second, whatever the export frame rate. */
const STEP = 1 / 30;

/** Steps a pop takes to appear (0.3 s) and to disappear (about 0.43 s). */
const POP_IN_STEPS = 9;
const POP_OUT_STEPS = 13;

/** Seconds a sprite takes to pop away; schedule exits to finish before the end. */
export const POP_OUT = POP_OUT_STEPS * STEP;

/** Default typing speed, in characters per second. */
export const TYPE_SPEED = 32;

/** Characters erased per second when typed text leaves. */
const ERASE_SPEED = 40;

/** Longest time erasing takes: long text erases faster so exits stay predictable. */
export const ERASE_MAX = 0.6;

/** Whole steps since `start`, so movement advances in 1/30 s frames. */
function stepsSince(t: number, start: number): number {
  return Math.floor((t - start) / STEP + 1e-9);
}

/**
 * Magnification of a sprite that pops in at `start` and, if `outStart` is
 * given, pops out from then on. 0 means hidden; `px` is the resting size.
 *
 * The timing is the same at every output size: the size follows an eased
 * curve over a fixed number of steps and is rounded to whole magnifications,
 * so sprites stay crisp. In, it overshoots and settles; out, it swells a
 * little, then shrinks away.
 */
export function popScale(t: number, start: number, outStart: number | null, px: number): number {
  if (t < start) return 0;
  if (outStart !== null && t >= outStart) {
    const i = stepsSince(t, outStart);
    if (i >= POP_OUT_STEPS) return 0;
    return Math.max(1, Math.round(px * (1 - easeInBack(i / POP_OUT_STEPS))));
  }
  const i = stepsSince(t, start);
  if (i + 1 >= POP_IN_STEPS) return px;
  return Math.max(1, Math.round(px * easeOutBack((i + 1) / POP_IN_STEPS)));
}

/** How many of `length` characters are typed by time `t`. */
export function typedCount(t: number, start: number, length: number, speed = TYPE_SPEED): number {
  return clamp(Math.floor((t - start) * speed), 0, length);
}

/** Seconds that erasing `length` characters takes. */
export function eraseDuration(length: number): number {
  return Math.min(length / ERASE_SPEED, ERASE_MAX);
}

/**
 * Characters visible at time `t`: typed in from `start`, then erased from
 * `outStart` on, at a steady pace that finishes within `ERASE_MAX` seconds.
 */
export function typedVisible(
  t: number,
  start: number,
  length: number,
  outStart: number | null,
): number {
  const n = typedCount(t, start, length, TYPE_SPEED);
  if (outStart === null || t < outStart || length === 0) return n;
  const erased = Math.floor(clamp((t - outStart) / eraseDuration(length)) * length + 1e-9);
  return Math.min(n, length - erased);
}

/** When typing `length` characters from `start` finishes. */
export function typedEnd(start: number, length: number): number {
  return start + length / TYPE_SPEED;
}

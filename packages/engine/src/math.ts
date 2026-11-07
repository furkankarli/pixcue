/** Clamps `value` to the range [min, max]. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** An easing curve: maps progress in [0, 1] to eased progress. Input is clamped. */
export type Easing = (progress: number) => number;

export const linear: Easing = (p) => clamp(p);

/** Cubic ease-out: fast start, gentle stop. */
export const easeOut: Easing = (p) => 1 - (1 - clamp(p)) ** 3;

/** Cubic ease-in: gentle start, fast stop. */
export const easeIn: Easing = (p) => clamp(p) ** 3;

/** Cubic ease-in-out. */
export const easeInOut: Easing = (p) => {
  const x = clamp(p);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

/** Ease-out with a small overshoot past 1 before settling ("back"). */
export const easeOutBack: Easing = (p) => {
  const x = clamp(p);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

/** Exponential ease-out: very fast start, precise stop (HUD-like). */
export const easeOutExpo: Easing = (p) => {
  const x = clamp(p);
  return x === 1 ? 1 : 1 - 2 ** (-10 * x);
};

/** Exponential ease-in. */
export const easeInExpo: Easing = (p) => {
  const x = clamp(p);
  return x === 0 ? 0 : 2 ** (10 * x - 10);
};

/**
 * Animates in, holds, then animates out: the standard life cycle of an element.
 *
 * - In: eases from 0 to 1 between `inStart` and `inEnd` seconds.
 * - Out: eases from 1 back to 0, starting `outStart` seconds before the end of
 *   the clip and finishing `outEnd` seconds before it.
 *
 * @example
 *   // in over 0–0.42 s, out from 0.55 s to 0.15 s before the end
 *   const bar = envelope(t, duration, 0, 0.42, 0.55, 0.15, easeOutBack, easeIn);
 */
export function envelope(
  t: number,
  duration: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
  easeInCurve: Easing = easeOut,
  easeOutCurve: Easing = easeIn,
): number {
  if (t < duration - outStart) return easeInCurve((t - inStart) / (inEnd - inStart));
  return 1 - easeOutCurve((t - (duration - outStart)) / (outStart - outEnd));
}

/**
 * Deterministic pseudo-random number in [0, 1) for an integer seed. Use it
 * instead of `Math.random()` so every render of a frame is identical.
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

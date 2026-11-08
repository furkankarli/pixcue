import { clamp, easeInOut, easeOut } from './math.ts';

/**
 * A finger tap on a touch screen, the phone counterpart of a mouse click.
 * The touch appears just before the moment of the tap, presses down, then
 * lifts while a ripple spreads from the point.
 */
export interface TapPhase {
  /** 0 to 1 as the touch lands. */
  readonly appear: number;
  /** 0 to 1 while pressing down, back to 0 as the finger lifts. */
  readonly press: number;
  /** Opacity of the touch itself. */
  readonly alpha: number;
  /** Age of the ripple from 0 to 1, or null when there is none. */
  readonly ripple: number | null;
}

/** Seconds before the tap that the touch starts to appear. */
export const TAP_LEAD = 0.34;
/** Seconds the press takes, ending at the tap. */
const PRESS = 0.12;
/** Seconds the touch takes to fade after the tap. */
const LIFT = 0.3;
/** Seconds the ripple spreads after the tap. */
export const TAP_RIPPLE = 0.5;

/** The tap's state at time `t` for a tap at `at`, or null when nothing shows. */
export function tapPhase(t: number, at: number): TapPhase | null {
  if (t < at - TAP_LEAD || t >= at + Math.max(LIFT, TAP_RIPPLE)) return null;
  const appear = easeOut((t - (at - TAP_LEAD)) / (TAP_LEAD - PRESS));
  if (t < at) {
    const press = easeInOut((t - (at - PRESS)) / PRESS);
    return { appear, press, alpha: appear, ripple: null };
  }
  const lift = clamp((t - at) / LIFT);
  return {
    appear: 1,
    press: 1 - easeOut(lift),
    alpha: 1 - easeInOut(lift),
    ripple: (t - at) / TAP_RIPPLE,
  };
}

/**
 * The preview clock: plays the clip in a loop with a short pause at the end,
 * or holds a time chosen on the timeline.
 */
import { createEffect, createRoot, createSignal, onCleanup } from 'solid-js';
import { duration } from './store.ts';

/** Pause after the clip ends before looping, in seconds. */
const LOOP_PAUSE = 0.35;

const reducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const [time, setTime] = createSignal(0);
const [playing, setPlaying] = createSignal(!reducedMotion);

export { playing, time };

let last = 0;
let frameRequest = 0;

function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const total = duration();
  setTime((t) => (t + dt > total + LOOP_PAUSE ? 0 : t + dt));
  frameRequest = requestAnimationFrame(tick);
}

createRoot(() => {
  // Solid ignores an effect's return value, so the loop is stopped with
  // onCleanup: it runs before the effect re-runs, which is when play stops.
  createEffect(() => {
    if (!playing() || typeof requestAnimationFrame === 'undefined') return;
    last = performance.now();
    frameRequest = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(frameRequest));
  });
  // Keep the playhead inside a clip that got shorter.
  createEffect(() => {
    const total = duration();
    if (time() > total + LOOP_PAUSE) setTime(0);
  });
});

export function togglePlay() {
  if (!playing() && time() >= duration()) setTime(0);
  setPlaying((p) => !p);
}

/** Moves the playhead and pauses, as when dragging the timeline. */
export function seek(t: number) {
  setPlaying(false);
  setTime(Math.max(0, Math.min(duration(), t)));
}

/** Time shown in the preview: holds the last frame during the loop pause. */
export const displayTime = () => Math.min(time(), duration());

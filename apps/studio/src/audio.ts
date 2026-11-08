/**
 * Plays the soundtrack in time with the preview. Browsers only allow sound
 * after a click or key press, so the audio context starts on the first one.
 * The samples are the ones an export carries.
 */
import { createEffect, createRoot, createSignal, onCleanup, untrack } from 'solid-js';
import { displayTime, loops, playing } from './playback.ts';
import { soundtrack } from './store.ts';

const [context, setContext] = createSignal<AudioContext | null>(null);

/** Starts (or resumes) audio; call from a click or key press. */
export function unlockAudio(): void {
  if (typeof AudioContext === 'undefined') return;
  const ctx = context() ?? new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  if (!context()) setContext(ctx);
}

if (typeof document !== 'undefined') {
  for (const type of ['pointerdown', 'keydown'] as const)
    document.addEventListener(type, unlockAudio, { capture: true, passive: true });
}

createRoot(() => {
  // Restarts with the loop, and whenever the sound changes while playing.
  createEffect(() => {
    const ctx = context();
    const track = soundtrack();
    loops();
    if (!ctx || !track || !playing()) return;
    const [left, right] = track.channels;
    const buffer = ctx.createBuffer(2, left.length, track.sampleRate);
    buffer.copyToChannel(left as Float32Array<ArrayBuffer>, 0);
    buffer.copyToChannel(right as Float32Array<ArrayBuffer>, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const offset = untrack(displayTime);
    if (offset < buffer.duration) source.start(0, offset);
    onCleanup(() => {
      try {
        source.stop();
      } catch {
        // Never started (the playhead was past the end).
      }
      source.disconnect();
    });
  });
});

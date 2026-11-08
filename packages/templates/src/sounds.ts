/** Helpers for templates' sound cues. */
import { type SoundCue, TYPE_SPEED } from '@pixcue/engine';

/**
 * Keystrokes for text typed in from `start` at the pixel theme's typing
 * speed: one every other character, skipping spaces, quieter than effects.
 */
export function typing(start: number, text: string, speed = TYPE_SPEED): SoundCue[] {
  const cues: SoundCue[] = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i += 2) {
    if (chars[i]?.trim()) cues.push({ t: start + i / speed, kind: 'type', gain: 0.5 });
  }
  return cues;
}

/** When typing `text` from `start` finishes. */
export const typedUntil = (start: number, text: string, speed = TYPE_SPEED) =>
  start + Array.from(text).length / speed;

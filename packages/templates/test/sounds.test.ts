import { createFrame, renderSoundtrack } from '@pixcue/engine';
import { createTranslator } from '@pixcue/i18n';
import { describe, expect, it } from 'vitest';
import { resolveFields } from '../src/api.ts';
import { TEMPLATES } from '../src/registry.ts';
import { typing } from '../src/sounds.ts';

describe('template sounds', () => {
  for (const template of TEMPLATES) {
    for (const preset of ['youtube', 'vertical'] as const) {
      for (const pixel of [false, true]) {
        it(`${template.id} keeps its cues inside the clip (${preset}, ${pixel ? 'pixel' : 'vector'})`, () => {
          const frame = createFrame(preset);
          const fields = resolveFields(
            template,
            {},
            {
              t: createTranslator('en'),
              locale: 'en',
              platform: frame.platform,
            },
          );
          for (const duration of [template.minDuration, template.duration]) {
            const cues = template.sounds?.({ fields, duration, frame, pixel } as never) ?? [];
            expect(cues.length, `${duration} s`).toBeGreaterThan(0);
            for (const cue of cues) {
              expect(cue.t, `${cue.kind} at ${duration} s`).toBeGreaterThanOrEqual(0);
              expect(cue.t, `${cue.kind} at ${duration} s`).toBeLessThan(duration);
            }
            const track = renderSoundtrack(cues, { duration, style: pixel ? 'chip' : 'digital' });
            expect(track.channels[0].some((x) => x !== 0)).toBe(true);
          }
        });
      }
    }
  }

  it('ends every template with a sound as it leaves', () => {
    const frame = createFrame('youtube');
    for (const template of TEMPLATES) {
      const fields = resolveFields(
        template,
        {},
        {
          t: createTranslator('en'),
          locale: 'en',
          platform: frame.platform,
        },
      );
      const cues =
        template.sounds?.({ fields, duration: template.duration, frame, pixel: false } as never) ??
        [];
      const last = Math.max(...cues.map((c) => c.t));
      expect(last, template.id).toBeGreaterThan(template.duration - 1.2);
    }
  });

  it('types a keystroke every other character, skipping spaces', () => {
    const cues = typing(1, 'ab cd');
    expect(cues.map((c) => c.t)).toEqual([1, 1 + 4 / 32]);
    expect(cues.every((c) => c.kind === 'type')).toBe(true);
  });
});

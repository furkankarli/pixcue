import { FRAME_PRESETS, type FramePresetId, THEME_IDS } from '@pixcue/engine';
import { expectToMatchSnapshot } from '@pixcue/engine/testing';
import { describe, it } from 'vitest';
import { TEMPLATES } from '../src/registry.ts';
import { renderFrame } from './render-helpers.ts';

/** One preset per distinct frame shape; platform-specific vertical presets share the size. */
const PRESETS: FramePresetId[] = ['youtube', 'youtube-4k', 'vertical', 'instagram-post', 'square'];

/** Frames compared for each template: the hold in every format, the intro and outro at 1080p. */
const baseline = (id: string, name: string) =>
  new URL(`./__snapshots__/${id}/${name}.png`, import.meta.url).pathname;

describe.each(TEMPLATES.map((t) => [t.id, t] as const))('%s visuals', (id, template) => {
  const hold = template.duration / 2;
  for (const theme of THEME_IDS) {
    for (const preset of PRESETS) {
      const { width, height } = FRAME_PRESETS[preset];
      it(`${theme} holding in ${preset} (${width}×${height})`, async () => {
        const { canvas } = renderFrame({ template, theme, preset, t: hold });
        await expectToMatchSnapshot(canvas, baseline(id, `${theme}-${preset}-hold`));
      });
    }
    for (const [label, t] of [
      ['intro', 0.6],
      ['outro', template.duration - 0.4],
    ] as const) {
      it(`${theme} ${label} at ${t}s`, async () => {
        const { canvas } = renderFrame({ template, theme, preset: 'youtube', t });
        await expectToMatchSnapshot(canvas, baseline(id, `${theme}-youtube-${label}`));
      });
    }
  }
});

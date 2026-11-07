import { FRAME_PRESETS, type FramePresetId, THEME_IDS } from '@pixcue/engine';
import { expectToMatchSnapshot } from '@pixcue/engine/testing';
import { describe, it } from 'vitest';
import { lowerThird, lowerThirdDefaults } from '../src/lower-third.ts';
import { renderFrame } from './render-helpers.ts';

const duration = 5;
/** One preset per distinct frame shape; platform-specific vertical presets share the size. */
const presets: FramePresetId[] = ['youtube', 'youtube-4k', 'vertical', 'instagram-post', 'square'];

const baseline = (name: string) =>
  new URL(`./__snapshots__/lower-third/${name}.png`, import.meta.url).pathname;

describe('lower third visuals', () => {
  for (const theme of THEME_IDS) {
    for (const preset of presets) {
      it(`${theme} holding in ${preset} (${FRAME_PRESETS[preset].width}×${FRAME_PRESETS[preset].height})`, async () => {
        const { canvas } = renderFrame({
          scene: lowerThird,
          fields: lowerThirdDefaults,
          duration,
          theme,
          preset,
          t: 2.5,
        });
        await expectToMatchSnapshot(canvas, baseline(`${theme}-${preset}-hold`));
      });
    }

    for (const [label, t] of [
      ['intro', 0.6],
      ['outro', 4.6],
    ] as const) {
      it(`${theme} ${label} at ${t}s`, async () => {
        const { canvas } = renderFrame({
          scene: lowerThird,
          fields: lowerThirdDefaults,
          duration,
          theme,
          preset: 'youtube',
          t,
        });
        await expectToMatchSnapshot(canvas, baseline(`${theme}-youtube-${label}`));
      });
    }
  }
});

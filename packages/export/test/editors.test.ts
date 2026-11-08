import { describe, expect, it } from 'vitest';
import {
  EDITOR_IDS,
  EDITORS,
  EXPORT_FORMATS,
  needsVideoEncoder,
  recommendedFormat,
} from '../src/editors.ts';

describe('editor profiles', () => {
  it('gives desktop editors with alpha support a transparent MOV', () => {
    for (const id of ['davinci', 'premiere', 'final-cut'] as const)
      expect(recommendedFormat(id)).toBe('mov');
  });

  it('gives CapCut and Edits a chroma-key MP4', () => {
    for (const id of ['capcut-desktop', 'capcut-mobile', 'edits'] as const)
      expect(recommendedFormat(id)).toBe('mp4-key');
  });

  it('offers every editor the MP4 that phones and messaging apps open', () => {
    for (const id of EDITOR_IDS) expect(EDITORS[id].formats).toContain('mp4-key');
  });

  it('marks phone apps for the share sheet', () => {
    expect(EDITOR_IDS.filter((id) => EDITORS[id].mobile)).toEqual(['capcut-mobile', 'edits']);
  });

  it('always offers a format that works without WebCodecs where possible', () => {
    for (const id of EDITOR_IDS) {
      const formats: readonly string[] = EDITORS[id].formats;
      expect(formats.every((f) => (EXPORT_FORMATS as readonly string[]).includes(f))).toBe(true);
    }
    expect(needsVideoEncoder('mov')).toBe(false);
    expect(needsVideoEncoder('mp4-key')).toBe(true);
  });
});

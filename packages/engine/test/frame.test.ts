import { describe, expect, it } from 'vitest';
import { createFrame, FRAME_PRESETS, type FramePresetId } from '../src/frame.ts';
import { SAFE_AREA_INSETS } from '../src/safe-areas.ts';

const ids = Object.keys(FRAME_PRESETS) as FramePresetId[];

describe('createFrame', () => {
  it('uses design units with a 1080 short side', () => {
    expect(createFrame('youtube')).toMatchObject({ width: 1920, height: 1080, unit: 1 });
    expect(createFrame('youtube-4k')).toMatchObject({
      width: 1920,
      height: 1080,
      pixelWidth: 3840,
      pixelHeight: 2160,
      unit: 2,
    });
    expect(createFrame('tiktok')).toMatchObject({ width: 1080, height: 1920, unit: 1 });
    expect(createFrame('instagram-post')).toMatchObject({ width: 1080, height: 1350 });
  });

  it('derives orientation', () => {
    expect(createFrame('youtube').orientation).toBe('horizontal');
    expect(createFrame('reels').orientation).toBe('vertical');
    expect(createFrame('instagram-post').orientation).toBe('vertical');
    expect(createFrame('square').orientation).toBe('square');
  });

  it('keeps the 4K safe area identical to 1080p in design units', () => {
    expect(createFrame('youtube-4k').safeArea).toEqual(createFrame('youtube').safeArea);
  });

  it.each(ids)('%s has a sensible safe area', (id) => {
    const f = createFrame(id);
    const s = f.safeArea;
    expect(s.x).toBeGreaterThan(0);
    expect(s.y).toBeGreaterThan(0);
    expect(s.x + s.width).toBeLessThan(f.width);
    expect(s.y + s.height).toBeLessThan(f.height);
    // At least half of each dimension stays usable.
    expect(s.width / f.width).toBeGreaterThan(0.5);
    expect(s.height / f.height).toBeGreaterThan(0.5);
  });
});

describe('safe areas', () => {
  it('keeps vertical graphics clear of the right-hand buttons and bottom captions', () => {
    for (const id of ['shorts', 'tiktok', 'reels', 'vertical'] as const) {
      const i = SAFE_AREA_INSETS[id];
      expect(i.right).toBeGreaterThan(i.left);
      expect(i.bottom).toBeGreaterThan(i.top);
    }
  });

  it('makes the all-platforms vertical preset the strictest of the three', () => {
    const all = SAFE_AREA_INSETS.vertical;
    for (const id of ['shorts', 'tiktok', 'reels'] as const) {
      const i = SAFE_AREA_INSETS[id];
      expect(all.top).toBeGreaterThanOrEqual(i.top);
      expect(all.right).toBeGreaterThanOrEqual(i.right);
      expect(all.bottom).toBeGreaterThanOrEqual(i.bottom);
      expect(all.left).toBeGreaterThanOrEqual(i.left);
    }
  });
});

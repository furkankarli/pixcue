import { describe, expect, it } from 'vitest';
import {
  type FrameImage,
  type FrameSource,
  forEachFrame,
  frameTimestamp,
  RENDER_SHARE,
} from '../src/frames.ts';

const source = (frameCount: number, onRender?: (i: number) => void): FrameSource => ({
  width: 2,
  height: 2,
  fps: 30,
  frameCount,
  render(i) {
    onRender?.(i);
    return {} as FrameImage;
  },
});

describe('forEachFrame', () => {
  it('visits every frame in order and reports progress', async () => {
    const seen: number[] = [];
    const progress: number[] = [];
    await forEachFrame(source(5), { onProgress: (p) => progress.push(p) }, (_c, i) => {
      seen.push(i);
    });
    expect(seen).toEqual([0, 1, 2, 3, 4]);
    expect(progress.at(-1)).toBeCloseTo(RENDER_SHARE);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    const rendered: number[] = [];
    const run = forEachFrame(
      source(100, (i) => (i === 3 ? controller.abort() : rendered.push(i))),
      {
        signal: controller.signal,
      },
      () => {},
    );
    await expect(run).rejects.toThrow(/abort/i);
    expect(rendered.length).toBeLessThan(10);
  });
});

describe('frameTimestamp', () => {
  it('converts frame numbers to microseconds', () => {
    expect(frameTimestamp(0, 30)).toBe(0);
    expect(frameTimestamp(30, 30)).toBe(1_000_000);
    expect(frameTimestamp(1, 60)).toBe(16_667);
  });
});

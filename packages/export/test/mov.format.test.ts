import { afterAll, describe, expect, it } from 'vitest';
import { muxMovPng } from '../src/mux/mov.ts';
import { decodeRgba, ffprobe, tempDir } from './ffmpeg.ts';
import { H, pngOf, rgbaOf, W } from './synthetic.ts';

const tmp = tempDir();
afterAll(tmp.cleanup);
const FRAMES = 12;

describe('PNG MOV', async () => {
  const pngs = await Promise.all(Array.from({ length: FRAMES }, (_, i) => pngOf(i)));
  const blob = muxMovPng(pngs, { width: W, height: H, fps: 30 });
  const file = tmp.file('alpha.mov', new Uint8Array(await blob.arrayBuffer()));

  it('is a QuickTime file with a PNG RGBA stream', () => {
    const info = ffprobe(file, ['-count_frames']);
    expect(info.format.format_name).toContain('mov');
    expect(info.streams).toHaveLength(1);
    expect(info.streams[0]).toMatchObject({
      codec_name: 'png',
      pix_fmt: 'rgba',
      width: W,
      height: H,
      r_frame_rate: '30/1',
      nb_read_frames: String(FRAMES),
    });
    expect(Number(info.format.duration)).toBeCloseTo(FRAMES / 30, 3);
  });

  it('decodes to exactly the source pixels, alpha included', () => {
    const decoded = decodeRgba(file);
    const frameSize = W * H * 4;
    expect(decoded.length).toBe(frameSize * FRAMES);
    for (let i = 0; i < FRAMES; i++) {
      expect(
        decoded.subarray(i * frameSize, (i + 1) * frameSize).equals(rgbaOf(i)),
        `frame ${i}`,
      ).toBe(true);
    }
  });
});

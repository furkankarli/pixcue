import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { muxWebm, type WebmSample } from '../src/mux/webm.ts';
import { decodeRgba, ffmpeg, ffprobe, tempDir } from './ffmpeg.ts';
import { H, pngOf, rgbaOf, W } from './synthetic.ts';

const tmp = tempDir();
afterAll(tmp.cleanup);
const FRAMES = 12;
const VP9 = [
  '-c:v',
  'libvpx-vp9',
  '-g',
  '6',
  '-auto-alt-ref',
  '0',
  '-lag-in-frames',
  '0',
  '-deadline',
  'realtime',
  '-cpu-used',
  '8',
  '-b:v',
  '2M',
];

/** Frames of an IVF file (the raw VP9 container ffmpeg can write). */
function ivfFrames(file: string): Uint8Array[] {
  const buf = readFileSync(file);
  const frames: Uint8Array[] = [];
  let p = buf.readUInt16LE(6); // header length
  while (p + 12 <= buf.length) {
    const length = buf.readUInt32LE(p);
    frames.push(new Uint8Array(buf.subarray(p + 12, p + 12 + length)));
    p += 12 + length;
  }
  return frames;
}

/** VP9 keyframe: frame_type bit of the uncompressed header is 0 (profile 0). */
const isKey = (frame: Uint8Array) => (((frame[0] ?? 0) >> 2) & 1) === 0;

describe('VP9 WebM with alpha', async () => {
  for (let i = 0; i < FRAMES; i++) tmp.file(`f${String(i).padStart(3, '0')}.png`, await pngOf(i));
  const input = ['-framerate', '30', '-i', `${tmp.dir}/f%03d.png`];
  // WebCodecs gives the alpha plane as a separate VP9 frame; do the same with ffmpeg.
  ffmpeg([...input, '-vf', 'format=yuv420p', ...VP9, tmp.file('color.ivf')]);
  // Keep the alpha plane full range, like WebCodecs: 0 and 255 must not become 16 and 235.
  const alphaPlane = 'alphaextract,scale=in_range=full:out_range=full,format=yuv420p';
  ffmpeg([...input, '-vf', alphaPlane, ...VP9, tmp.file('alpha.ivf')]);
  const color = ivfFrames(tmp.file('color.ivf'));
  const alpha = ivfFrames(tmp.file('alpha.ivf'));
  const samples: WebmSample[] = color.map((data, i) => ({
    data,
    key: isKey(data),
    timestamp: Math.round((i * 1e6) / 30),
    alpha: alpha[i],
  }));

  it('starts with a keyframe and has later keyframes', () => {
    expect(samples).toHaveLength(FRAMES);
    expect(samples[0]?.key).toBe(true);
    expect(samples.filter((s) => s.key).length).toBeGreaterThan(1);
  });

  for (const withAlpha of [true, false]) {
    describe(withAlpha ? 'transparent' : 'opaque', async () => {
      const file = tmp.file(`out-${withAlpha}.webm`);
      tmp.file(
        `out-${withAlpha}.webm`,
        new Uint8Array(
          await muxWebm(samples, { width: W, height: H, fps: 30, alpha: withAlpha }).arrayBuffer(),
        ),
      );

      it('is a valid VP9 WebM with every frame', () => {
        const info = ffprobe(file, ['-count_frames']);
        expect(info.format.format_name).toContain('webm');
        expect(info.streams[0]).toMatchObject({
          codec_name: 'vp9',
          width: W,
          height: H,
          nb_read_frames: String(FRAMES),
        });
        const tags = info.streams[0]?.tags ?? {};
        expect(tags.alpha_mode ?? tags.ALPHA_MODE ?? '0').toBe(withAlpha ? '1' : '0');
        expect(Number(info.format.duration)).toBeCloseTo(FRAMES / 30, 2);
      });

      it(withAlpha ? 'decodes with the source transparency' : 'decodes fully opaque', () => {
        const decoded = decodeRgba(file, ['-c:v', 'libvpx-vp9']);
        const frameSize = W * H * 4;
        expect(decoded.length).toBe(frameSize * FRAMES);
        const frame = decoded.subarray(0, frameSize);
        const source = rgbaOf(0);
        let error = 0;
        let transparent = 0;
        for (let p = 3; p < frameSize; p += 4) {
          error += Math.abs((frame[p] ?? 0) - (withAlpha ? (source[p] ?? 0) : 255));
          if ((frame[p] ?? 0) < 16) transparent++;
        }
        expect(error / (W * H)).toBeLessThan(6); // lossy, but close
        if (withAlpha) expect(transparent).toBeGreaterThan((W * H) / 4);
        else expect(transparent).toBe(0);
      });
    });
  }
});

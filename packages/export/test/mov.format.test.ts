import { afterAll, describe, expect, it } from 'vitest';
import { muxMovPng } from '../src/mux/mov.ts';
import { decodeRgba, ffmpeg, ffprobe, tempDir } from './ffmpeg.ts';
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

describe('PNG MOV with sound', async () => {
  // One second of a 440 Hz tone, 16-bit stereo, the right channel quieter.
  const sampleRate = 48000;
  const pcm = new Uint8Array(sampleRate * 4);
  const view = new DataView(pcm.buffer);
  for (let i = 0; i < sampleRate; i++) {
    const v = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    view.setInt16(i * 4, Math.round(v * 20000), true);
    view.setInt16(i * 4 + 2, Math.round(v * 8000), true);
  }
  const frames = 30;
  const pngs = await Promise.all(Array.from({ length: frames }, (_, i) => pngOf(i % FRAMES)));
  const blob = muxMovPng(pngs, {
    width: W,
    height: H,
    fps: 30,
    audio: { pcm, sampleRate, channels: 2 },
  });
  const file = tmp.file('sound.mov', new Uint8Array(await blob.arrayBuffer()));

  it('has a PCM sound track beside the video, as long as it', () => {
    const info = ffprobe(file);
    expect(info.streams).toHaveLength(2);
    const audio = info.streams[1] as unknown as Record<string, unknown>;
    expect(audio).toMatchObject({
      codec_type: 'audio',
      codec_name: 'pcm_s16le',
      sample_rate: String(sampleRate),
      channels: 2,
    });
    expect(Number(audio.duration)).toBeCloseTo(1, 3);
    expect(Number(info.format.duration)).toBeCloseTo(1, 2);
  });

  it('decodes to exactly the source samples', () => {
    const decoded = ffmpeg([
      '-i',
      file,
      '-map',
      '0:a',
      '-f',
      's16le',
      '-acodec',
      'pcm_s16le',
      'pipe:1',
    ]);
    expect(decoded.equals(Buffer.from(pcm))).toBe(true);
  });

  it('still decodes the video exactly', () => {
    expect(decodeRgba(file).length).toBe(W * H * 4 * frames);
  });
});

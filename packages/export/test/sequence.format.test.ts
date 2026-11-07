import { afterAll, describe, expect, it } from 'vitest';
import { exportMov, exportPngSequence } from '../src/exporters/sequence.ts';
import { decodeRgba, ffprobe, tempDir } from './ffmpeg.ts';
import { nodePlatform, syntheticSource } from './node-platform.ts';
import { H, rgbaOf, W } from './synthetic.ts';

const tmp = tempDir();
afterAll(tmp.cleanup);
const FRAMES = 8;

/** Reads stored zip entries (see zip.test.ts). */
function entries(buf: Buffer) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out: { name: string; data: Buffer }[] = [];
  for (let i = 0; i < count; i++) {
    const size = buf.readUInt32LE(p + 20);
    const nameLength = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const start = local + 30 + buf.readUInt16LE(local + 26);
    out.push({
      name: buf.toString('utf8', p + 46, p + 46 + nameLength),
      data: buf.subarray(start, start + size),
    });
    p += 46 + nameLength;
  }
  return out;
}

describe('PNG sequence export', () => {
  it('zips one transparent PNG per frame, in order', async () => {
    const progress: number[] = [];
    const zip = await exportPngSequence(syntheticSource(FRAMES), {
      name: 'alt-bant',
      platform: nodePlatform,
      onProgress: (p) => progress.push(p),
    });
    expect(progress.at(-1)).toBe(1);
    const files = entries(Buffer.from(await zip.arrayBuffer()));
    expect(files.map((f) => f.name)).toEqual(
      Array.from(
        { length: FRAMES },
        (_, i) => `alt-bant/alt-bant_${String(i).padStart(4, '0')}.png`,
      ),
    );
    for (const [i, f] of files.entries()) {
      const png = tmp.file(`frame${i}.png`, new Uint8Array(f.data));
      expect(ffprobe(png).streams[0]).toMatchObject({
        codec_name: 'png',
        pix_fmt: 'rgba',
        width: W,
        height: H,
      });
      expect(decodeRgba(png).equals(rgbaOf(i)), `frame ${i}`).toBe(true);
    }
  });
});

describe('MOV export', () => {
  it('writes a lossless transparent MOV of every frame', async () => {
    const mov = await exportMov(syntheticSource(FRAMES, 25), { platform: nodePlatform });
    const file = tmp.file('export.mov', new Uint8Array(await mov.arrayBuffer()));
    expect(ffprobe(file, ['-count_frames']).streams[0]).toMatchObject({
      codec_name: 'png',
      pix_fmt: 'rgba',
      r_frame_rate: '25/1',
      nb_read_frames: String(FRAMES),
    });
    const decoded = decodeRgba(file);
    const size = W * H * 4;
    for (let i = 0; i < FRAMES; i++) {
      expect(decoded.subarray(i * size, (i + 1) * size).equals(rgbaOf(i)), `frame ${i}`).toBe(true);
    }
  });
});

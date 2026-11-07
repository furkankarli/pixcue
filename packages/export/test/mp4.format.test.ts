import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { type EncodedSample, muxMp4 } from '../src/mux/mp4.ts';
import { ffmpeg, ffprobe, frameHashes, hexdumpBytes, tempDir } from './ffmpeg.ts';

const tmp = tempDir();
afterAll(tmp.cleanup);
const FRAMES = 30;

/**
 * Real H.264 samples with B-frames: ffmpeg encodes a test pattern, and we read
 * its packets (decode order, presentation timestamps, keyframes) and avcC the
 * same way WebCodecs hands them to the exporter.
 */
function encodedSamples(source: string) {
  const probe = ffprobe(source, ['-show_packets', '-show_data']);
  const stream = probe.streams[0];
  const bytes = readFileSync(source);
  const [num = 1, den = 1] = (stream?.time_base ?? '1/1').split('/').map(Number);
  const samples: EncodedSample[] = (probe.packets ?? []).map((p) => {
    const pos = Number(p.pos);
    return {
      data: new Uint8Array(bytes.subarray(pos, pos + Number(p.size))),
      key: p.flags.includes('K'),
      timestamp: Math.round((p.pts * num * 1e6) / den),
    };
  });
  return { samples, avcC: hexdumpBytes(stream?.extradata ?? '') };
}

describe('H.264 MP4', () => {
  const source = tmp.file('source.mp4');
  ffmpeg([
    ...['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30'],
    ...[
      '-frames:v',
      String(FRAMES),
      '-c:v',
      'libx264',
      '-bf',
      '2',
      '-g',
      '12',
      '-pix_fmt',
      'yuv420p',
    ],
    source,
  ]);
  const { samples, avcC } = encodedSamples(source);
  const out = tmp.file('out.mp4');

  it('has B-frames to exercise composition offsets', () => {
    const decodeOrderIsPresentationOrder = samples.every(
      (s, i) => i === 0 || s.timestamp > (samples[i - 1]?.timestamp ?? 0),
    );
    expect(decodeOrderIsPresentationOrder).toBe(false);
  });

  it('muxes into a valid H.264 MP4', async () => {
    const blob = muxMp4(samples, { width: 320, height: 180, fps: 30, avcC });
    tmp.file('out.mp4', new Uint8Array(await blob.arrayBuffer()));
    const info = ffprobe(out, ['-count_frames']);
    expect(info.streams[0]).toMatchObject({
      codec_name: 'h264',
      pix_fmt: 'yuv420p',
      width: 320,
      height: 180,
      r_frame_rate: '30/1',
      nb_read_frames: String(FRAMES),
    });
    expect(Number(info.format.duration)).toBeCloseTo(FRAMES / 30, 2);
  });

  it('decodes to the same frames, at the same times, as the source', () => {
    expect(frameHashes(out)).toEqual(frameHashes(source));
    const times = (file: string) =>
      (ffprobe(file, ['-show_frames']).frames ?? []).map((f) =>
        Number(f.best_effort_timestamp_time).toFixed(3),
      );
    expect(times(out)).toEqual(times(source));
  });
});

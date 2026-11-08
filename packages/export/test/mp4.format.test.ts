import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { ensureAvcC, isValidAvcC } from '../src/mux/avc.ts';
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

  it('repairs a malformed avcC so the file decodes without errors', async () => {
    // Recreate Firefox's bug: duplicate the NAL header byte of the SPS and PPS.
    const p = 6;
    const spsLength = (avcC[p] ?? 0) * 256 + (avcC[p + 1] ?? 0);
    const sps = avcC.subarray(p + 2, p + 2 + spsLength);
    const rest = avcC.subarray(p + 2 + spsLength);
    const ppsLength = (rest[1] ?? 0) * 256 + (rest[2] ?? 0);
    const pps = rest.subarray(3, 3 + ppsLength);
    const broken = new Uint8Array([
      1,
      avcC[1] ?? 0,
      avcC[2] ?? 0,
      avcC[3] ?? 0,
      3,
      1,
      0,
      spsLength + 1,
      sps[0] ?? 0,
      ...sps,
      1,
      0,
      ppsLength + 1,
      pps[0] ?? 0,
      ...pps,
    ]);
    expect(isValidAvcC(broken)).toBe(false);
    // Like Firefox, carry the SPS and PPS in band in the first keyframe.
    const lengthPrefixed = (nal: Uint8Array) => [
      0,
      0,
      (nal.length >> 8) & 255,
      nal.length & 255,
      ...nal,
    ];
    const [first, ...others] = samples;
    if (!first) throw new Error('no samples');
    const withParameterSets: EncodedSample[] = [
      {
        ...first,
        data: new Uint8Array([...lengthPrefixed(sps), ...lengthPrefixed(pps), ...first.data]),
      },
      ...others,
    ];
    const repaired = ensureAvcC(broken, withParameterSets[0]?.data);
    expect(isValidAvcC(repaired)).toBe(true);
    const blob = muxMp4(withParameterSets, { width: 320, height: 180, fps: 30, avcC: repaired });
    const file = tmp.file('repaired.mp4', new Uint8Array(await blob.arrayBuffer()));
    const log = ffmpeg(['-v', 'warning', '-i', file, '-f', 'null', '-']).toString();
    expect(log).toBe('');
    expect(frameHashes(file)).toEqual(frameHashes(source));
  });

  it('carries an AAC sound track that decodes cleanly', async () => {
    // Real AAC frames: ffmpeg encodes one second of a tone; we read its
    // packets and AudioSpecificConfig as WebCodecs' AudioEncoder gives them.
    const aac = tmp.file('tone.m4a');
    ffmpeg([
      ...['-f', 'lavfi', '-i', 'sine=frequency=440:duration=1:sample_rate=48000'],
      ...['-ac', '2', '-c:a', 'aac', '-b:a', '160k', aac],
    ]);
    const probe = ffprobe(aac, ['-show_packets', '-show_data']);
    const bytes = readFileSync(aac);
    const frames = (probe.packets ?? []).map((p) => {
      const pos = Number(p.pos);
      return new Uint8Array(bytes.subarray(pos, pos + Number(p.size)));
    });
    const config = hexdumpBytes(probe.streams[0]?.extradata ?? '');
    const blob = muxMp4(samples, {
      width: 320,
      height: 180,
      fps: 30,
      avcC,
      audio: { frames, sampleRate: 48000, channels: 2, config, bitrate: 160_000, priming: 1024 },
    });
    const file = tmp.file('sound.mp4', new Uint8Array(await blob.arrayBuffer()));
    const info = ffprobe(file);
    expect(info.streams).toHaveLength(2);
    expect(info.streams[1]).toMatchObject({
      codec_type: 'audio',
      codec_name: 'aac',
      sample_rate: '48000',
      channels: 2,
    });
    const log = ffmpeg(['-v', 'warning', '-i', file, '-map', '0:a', '-f', 'null', '-']).toString();
    expect(log).toBe('');
    const pcm = ffmpeg(['-i', file, '-map', '0:a', '-f', 's16le', '-ac', '1', 'pipe:1']);
    // About one second of samples, with the encoder delay trimmed.
    expect(pcm.length / 2).toBeGreaterThan(47000);
    expect(pcm.length / 2).toBeLessThan(49100);
    expect(frameHashes(file)).toEqual(frameHashes(source));
  });
});

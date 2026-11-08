import { describe, expect, it } from 'vitest';
import {
  ExportUnsupportedError,
  exportMp4,
  exportWebm,
  h264Codecs,
  videoBitrate,
  vp9Codecs,
  type WebCodecsApi,
} from '../src/exporters/video.ts';
import type { FrameImage } from '../src/frames.ts';
import type { AudioCodecsApi } from '../src/sound.ts';
import { find, parseBoxes } from './boxes.ts';
import { nodePlatform, syntheticSource } from './node-platform.ts';
import { H, W } from './synthetic.ts';

interface Encoded {
  readonly pixels: Uint8ClampedArray;
  readonly timestamp: number;
  readonly alpha: string | undefined;
  readonly keyFrame: boolean;
}

/** A WebCodecs stand-in: records what it is asked to encode and returns tiny fake chunks. */
function fakeWebCodecs({ codecs = (_codec: string): boolean => true, alphaSideData = true } = {}) {
  const encoded: Encoded[] = [];
  const state = { configured: undefined as VideoEncoderConfig | undefined, closed: false };
  class FakeFrame {
    constructor(
      readonly image: FrameImage,
      readonly init: VideoFrameInit,
    ) {}
    close() {}
  }
  class FakeEncoder {
    static async isConfigSupported(config: VideoEncoderConfig) {
      return { supported: codecs(config.codec), config };
    }
    state: CodecState = 'unconfigured';
    encodeQueueSize = 0;
    constructor(private readonly init: VideoEncoderInit) {}
    configure(config: VideoEncoderConfig) {
      state.configured = config;
      this.state = 'configured';
    }
    encode(frame: FakeFrame, options?: VideoEncoderEncodeOptions) {
      const ctx = frame.image.getContext('2d');
      encoded.push({
        pixels: ctx?.getImageData(0, 0, W, H).data ?? new Uint8ClampedArray(),
        timestamp: frame.init.timestamp ?? -1,
        alpha: frame.init.alpha,
        keyFrame: options?.keyFrame ?? false,
      });
      const keep = state.configured?.alpha === 'keep';
      this.init.output(
        {
          type: options?.keyFrame ? 'key' : 'delta',
          timestamp: frame.init.timestamp ?? 0,
          byteLength: 3,
          copyTo: (d: Uint8Array) => d.set([1, 2, 3]),
        } as unknown as EncodedVideoChunk,
        {
          decoderConfig: { codec: 'x', description: new Uint8Array([1, 0x64, 0, 0x28]) },
          ...(keep && alphaSideData ? { alphaSideData: new Uint8Array([9]) } : {}),
        } as EncodedVideoChunkMetadata,
      );
    }
    async flush() {}
    close() {
      this.state = 'closed';
      state.closed = true;
    }
  }
  return {
    api: { VideoEncoder: FakeEncoder, VideoFrame: FakeFrame } as unknown as WebCodecsApi,
    encoded,
    state,
  };
}

const bytes = async (blob: Blob) => Buffer.from(await blob.arrayBuffer());

describe('codec choice', () => {
  it('picks the lowest sufficient H.264 level, High profile first', () => {
    expect(h264Codecs(1920, 1080, 30)[0]).toBe('avc1.640028');
    expect(h264Codecs(1080, 1920, 60)[0]).toBe('avc1.64002A');
    expect(h264Codecs(3840, 2160, 30)[0]).toBe('avc1.640033');
    expect(h264Codecs(3840, 2160, 60)[0]).toBe('avc1.640034');
    expect(h264Codecs(1920, 1080, 30).at(-1)).toMatch(/^avc1\.42E0/);
  });

  it('offers VP9 levels that fit the frame rate and size', () => {
    expect(vp9Codecs(1920, 1080, 30)[0]).toBe('vp09.00.40.08');
    expect(vp9Codecs(3840, 2160, 60)[0]).toBe('vp09.00.51.08');
  });

  it('scales the bitrate with pixels per second', () => {
    expect(videoBitrate(1920, 1080, 30)).toBe(24e6);
    expect(videoBitrate(1920, 1080, 60)).toBe(48e6);
    expect(videoBitrate(3840, 2160, 60)).toBe(120e6);
    expect(videoBitrate(320, 180, 30)).toBe(8e6);
  });
});

describe('exportMp4', () => {
  it('adds the sound as AAC when the browser can encode it, and leaves it out otherwise', async () => {
    const tone = { sampleRate: 48000, channels: [new Float32Array(4800), new Float32Array(4800)] };
    const audioCodecs = (supported: boolean) =>
      ({
        AudioEncoder: class {
          static async isConfigSupported(config: AudioEncoderConfig) {
            return { supported, config };
          }
          state: CodecState = 'unconfigured';
          constructor(private readonly init: AudioEncoderInit) {}
          configure() {}
          encode() {
            this.init.output(
              {
                byteLength: 1,
                copyTo: (d: Uint8Array) => d.set([5]),
              } as unknown as EncodedAudioChunk,
              undefined,
            );
          }
          async flush() {}
          close() {
            this.state = 'closed';
          }
        },
        AudioData: class {
          close() {}
        },
      }) as unknown as AudioCodecsApi;
    for (const supported of [true, false]) {
      const mp4 = await bytes(
        await exportMp4(syntheticSource(3), {
          webcodecs: fakeWebCodecs().api,
          platform: nodePlatform,
          sound: tone,
          audioCodecs: audioCodecs(supported),
        }),
      );
      expect(mp4.includes('mp4a'), String(supported)).toBe(supported);
    }
  });

  it('encodes every frame with a keyframe every two seconds and muxes an MP4', async () => {
    const fake = fakeWebCodecs();
    const progress: number[] = [];
    const mp4 = await exportMp4(syntheticSource(75), {
      webcodecs: fake.api,
      platform: nodePlatform,
      onProgress: (p) => progress.push(p),
    });
    expect(fake.state.configured).toMatchObject({
      codec: 'avc1.640028',
      avc: { format: 'avc' },
      framerate: 30,
    });
    expect(fake.encoded.map((e) => e.keyFrame).flatMap((k, i) => (k ? [i] : []))).toEqual([0, 60]);
    expect(fake.encoded[30]?.timestamp).toBe(1_000_000);
    expect(fake.state.closed).toBe(true);
    expect(progress.at(-1)).toBe(1);

    const boxes = parseBoxes(await bytes(mp4));
    expect(find(boxes, 'moov/trak/mdia/minf/stbl/stsz')?.body.readUInt32BE(8)).toBe(75);
    const stss = find(boxes, 'moov/trak/mdia/minf/stbl/stss');
    expect([stss?.body.readUInt32BE(8), stss?.body.readUInt32BE(12)]).toEqual([1, 61]);
  });

  it('paints a green screen with hard edges in chroma-key mode', async () => {
    const fake = fakeWebCodecs();
    await exportMp4(syntheticSource(1), {
      webcodecs: fake.api,
      platform: nodePlatform,
      background: { color: '#00FF00', hardEdges: true },
    });
    const px = fake.encoded[0]?.pixels ?? new Uint8ClampedArray();
    // Bottom-left corner is transparent in the source: pure key color now.
    const corner = (H - 1) * W * 4;
    expect([...px.subarray(corner, corner + 4)]).toEqual([0, 255, 0, 255]);
    // Every pixel is opaque and either key green or untouched graphic color.
    for (let i = 3; i < px.length; i += 4) expect(px[i]).toBe(255);
    expect(fake.encoded[0]?.alpha).toBe('discard');
  });

  it('reports browsers without H.264 encoding', async () => {
    const fake = fakeWebCodecs({ codecs: (c) => !c.startsWith('avc1') });
    await expect(
      exportMp4(syntheticSource(2), { webcodecs: fake.api, platform: nodePlatform }),
    ).rejects.toBeInstanceOf(ExportUnsupportedError);
  });

  it('closes the encoder when aborted', async () => {
    const fake = fakeWebCodecs();
    const controller = new AbortController();
    const source = syntheticSource(40);
    const run = exportMp4(
      {
        ...source,
        render: (i) => {
          if (i === 10) controller.abort();
          return source.render(i);
        },
      },
      { webcodecs: fake.api, platform: nodePlatform, signal: controller.signal },
    );
    await expect(run).rejects.toThrow(/abort/i);
    expect(fake.state.closed).toBe(true);
  });
});

describe('exportWebm', () => {
  it('keeps alpha and stores it in BlockAdditions', async () => {
    const fake = fakeWebCodecs();
    const webm = await bytes(
      await exportWebm(syntheticSource(3), { webcodecs: fake.api, platform: nodePlatform }),
    );
    expect(fake.state.configured).toMatchObject({ alpha: 'keep' });
    expect(fake.encoded[0]?.alpha).toBe('keep');
    expect(webm.includes(Buffer.from([0x75, 0xa1]))).toBe(true); // BlockAdditions
    expect(webm.includes(Buffer.from([0x53, 0xc0]))).toBe(true); // AlphaMode
  });

  it('fails clearly when the browser drops alpha', async () => {
    const fake = fakeWebCodecs({ alphaSideData: false });
    await expect(
      exportWebm(syntheticSource(2), { webcodecs: fake.api, platform: nodePlatform }),
    ).rejects.toMatchObject({
      name: 'ExportUnsupportedError',
      feature: 'alpha',
    });
  });

  it('writes opaque WebM on a background', async () => {
    const fake = fakeWebCodecs();
    const webm = await bytes(
      await exportWebm(syntheticSource(2), {
        webcodecs: fake.api,
        platform: nodePlatform,
        background: { color: '#FF00FF', hardEdges: true },
      }),
    );
    expect(fake.state.configured).toMatchObject({ alpha: 'discard' });
    expect(webm.includes(Buffer.from([0x75, 0xa1]))).toBe(false);
  });
});

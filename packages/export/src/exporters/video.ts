import { frameOnColor } from '../chroma.ts';
import {
  browserPlatform,
  type ExportOptions,
  type FrameImage,
  type FrameSource,
  forEachFrame,
  frameTimestamp,
} from '../frames.ts';
import { muxMp4 } from '../mux/mp4.ts';
import { muxWebm, type WebmSample } from '../mux/webm.ts';

/** The WebCodecs classes the exporter uses; injectable for tests. */
export interface WebCodecsApi {
  readonly VideoEncoder: {
    new (
      init: VideoEncoderInit,
    ): Pick<VideoEncoder, 'configure' | 'encode' | 'flush' | 'close' | 'encodeQueueSize' | 'state'>;
    isConfigSupported(config: VideoEncoderConfig): Promise<VideoEncoderSupport>;
  };
  readonly VideoFrame: new (image: CanvasImageSource, init?: VideoFrameInit) => VideoFrame;
}

/** Thrown when the browser cannot encode the requested format. */
export class ExportUnsupportedError extends Error {
  override readonly name = 'ExportUnsupportedError';
  constructor(readonly feature: 'h264' | 'vp9' | 'alpha') {
    super(
      `This browser cannot encode ${feature === 'alpha' ? 'transparent VP9' : feature.toUpperCase()} video.`,
    );
  }
}

export interface VideoExportOptions extends ExportOptions {
  /** Paint frames onto a solid color, e.g. a green screen; `hardEdges` is chroma-key mode. */
  readonly background?: { readonly color: string; readonly hardEdges: boolean } | undefined;
  readonly webcodecs?: WebCodecsApi | undefined;
}

function api(options: VideoExportOptions): WebCodecsApi | null {
  if (options.webcodecs) return options.webcodecs;
  const g = globalThis as Partial<WebCodecsApi>;
  return g.VideoEncoder && g.VideoFrame ? (g as WebCodecsApi) : null;
}

/** H.264 levels (level_idc) with their macroblock limits. */
const AVC_LEVELS: readonly [idc: number, maxFrameMbs: number, maxMbsPerSecond: number][] = [
  [0x28, 8192, 245_760], // 4.0
  [0x2a, 8704, 522_240], // 4.2
  [0x32, 22_080, 589_824], // 5.0
  [0x33, 36_864, 983_040], // 5.1
  [0x34, 36_864, 2_073_600], // 5.2
];

/** H.264 codec strings to try, best first: High, Main, then Baseline, at sufficient levels. */
export function h264Codecs(width: number, height: number, fps: number): string[] {
  const mbs = Math.ceil(width / 16) * Math.ceil(height / 16);
  const levels = AVC_LEVELS.filter(([, frame, rate]) => mbs <= frame && mbs * fps <= rate).map(
    ([idc]) => idc.toString(16).padStart(2, '0').toUpperCase(),
  );
  return ['6400', '4D00', '42E0'].flatMap((profile) =>
    levels.map((level) => `avc1.${profile}${level}`),
  );
}

/** VP9 profile 0 codec strings to try, at sufficient levels. */
export function vp9Codecs(width: number, height: number, fps: number): string[] {
  const pixelsPerSecond = width * height * fps;
  const levels =
    pixelsPerSecond > 2048 * 1088 * 60
      ? ['51', '52']
      : pixelsPerSecond > 1920 * 1080 * 30
        ? ['41', '50', '51']
        : ['40', '41', '50'];
  return levels.map((l) => `vp09.00.${l}.08`);
}

/** Bitrate scaled from 24 Mbps at 1080p30, within sensible bounds. */
export function videoBitrate(width: number, height: number, fps: number, base = 24e6): number {
  const scale = (width * height * fps) / (1920 * 1080 * 30);
  return Math.round(Math.min(120e6, Math.max(8e6, base * scale)));
}

async function pickConfig(
  codecs: WebCodecsApi,
  candidates: readonly string[],
  base: Omit<VideoEncoderConfig, 'codec'>,
): Promise<VideoEncoderConfig | null> {
  for (const codec of candidates) {
    try {
      const result = await codecs.VideoEncoder.isConfigSupported({ ...base, codec });
      if (result.supported) return result.config ?? { ...base, codec };
    } catch {
      // Malformed or unknown codec string: try the next one.
    }
  }
  return null;
}

/** Copies encoder output into a buffer we own (the source may be reused or detached). */
function copy(data: AllowSharedBufferSource): Uint8Array<ArrayBuffer> {
  const view = ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);
  return new Uint8Array(view);
}

interface Encoded {
  readonly samples: WebmSample[];
  readonly description: Uint8Array | undefined;
}

/** Encodes every frame with WebCodecs, keyframes every two seconds. */
async function encodeFrames(
  source: FrameSource,
  options: VideoExportOptions,
  codecs: WebCodecsApi,
  config: VideoEncoderConfig,
  transparent: boolean,
): Promise<Encoded> {
  const platform = options.platform ?? browserPlatform;
  const samples: WebmSample[] = [];
  let description: Uint8Array | undefined;
  let failure: unknown = null;
  const encoder = new codecs.VideoEncoder({
    output(chunk, meta) {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      if (meta?.decoderConfig?.description && !description)
        description = copy(meta.decoderConfig.description);
      const alpha = (meta as { alphaSideData?: AllowSharedBufferSource } | undefined)
        ?.alphaSideData;
      samples.push({
        data,
        key: chunk.type === 'key',
        timestamp: chunk.timestamp,
        alpha: alpha ? copy(alpha) : null,
      });
    },
    error(e) {
      failure = e;
    },
  });
  try {
    encoder.configure(config);
    let composed: FrameImage | undefined;
    await forEachFrame(source, options, async (canvas, i) => {
      if (failure) throw failure;
      let image = canvas;
      if (options.background) {
        composed = frameOnColor(
          canvas,
          options.background.color,
          options.background.hardEdges,
          platform,
          composed,
        );
        image = composed;
      }
      const frame = new codecs.VideoFrame(image, {
        timestamp: frameTimestamp(i, source.fps),
        duration: frameTimestamp(1, source.fps),
        alpha: transparent ? 'keep' : 'discard',
      });
      encoder.encode(frame, { keyFrame: i % (source.fps * 2) === 0 });
      frame.close();
      while (encoder.encodeQueueSize > 3) await new Promise((r) => setTimeout(r, 2));
    });
    await encoder.flush();
    if (failure) throw failure;
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
  return { samples, description };
}

/**
 * H.264 MP4. Without a background the frames are flattened onto black, since
 * MP4 has no alpha; pass a key color for green-screen exports.
 */
export async function exportMp4(
  source: FrameSource,
  options: VideoExportOptions = {},
): Promise<Blob> {
  const codecs = api(options);
  const { width, height, fps } = source;
  const config = codecs
    ? await pickConfig(codecs, h264Codecs(width, height, fps), {
        width,
        height,
        framerate: fps,
        bitrate: videoBitrate(width, height, fps, options.background ? 20e6 : 24e6),
        latencyMode: 'quality',
        avc: { format: 'avc' },
      })
    : null;
  if (!codecs || !config) throw new ExportUnsupportedError('h264');
  const { samples, description } = await encodeFrames(source, options, codecs, config, false);
  if (!description) throw new Error('The H.264 encoder did not provide its configuration (avcC).');
  const mp4 = muxMp4(samples, { width, height, fps, avcC: description });
  options.onProgress?.(1);
  return mp4;
}

/** VP9 WebM, transparent by default (alpha kept), or opaque on a background. */
export async function exportWebm(
  source: FrameSource,
  options: VideoExportOptions & { readonly transparent?: boolean } = {},
): Promise<Blob> {
  const codecs = api(options);
  const transparent = options.transparent ?? !options.background;
  const { width, height, fps } = source;
  const config = codecs
    ? await pickConfig(codecs, vp9Codecs(width, height, fps), {
        width,
        height,
        framerate: fps,
        bitrate: videoBitrate(width, height, fps, options.background ? 20e6 : 24e6),
        latencyMode: 'quality',
        alpha: transparent ? 'keep' : 'discard',
      })
    : null;
  if (!codecs || !config) throw new ExportUnsupportedError('vp9');
  const { samples } = await encodeFrames(source, options, codecs, config, transparent);
  if (transparent && !samples.some((s) => s.alpha)) throw new ExportUnsupportedError('alpha');
  const webm = muxWebm(samples, { width, height, fps, alpha: transparent });
  options.onProgress?.(1);
  return webm;
}

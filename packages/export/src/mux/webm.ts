import { type Bytes, concat, f64, i16, u8, utf8 } from '../bytes.ts';
import type { EncodedSample } from './mp4.ts';

/** A VP9 frame, optionally with its alpha plane encoded as a second VP9 frame. */
export interface WebmSample extends EncodedSample {
  /** WebCodecs `alphaSideData`: the alpha plane as a VP9 frame. */
  readonly alpha?: Uint8Array | null | undefined;
}

export interface WebmOptions {
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  /** Store the alpha plane (BlockAdditions); readers that support it show transparency. */
  readonly alpha: boolean;
}

/** Element ID bytes (IDs already include their length marker). */
function id(value: number): Bytes {
  const bytes: number[] = [];
  let v = value;
  while (v > 0) {
    bytes.unshift(v & 255);
    v = Math.floor(v / 256);
  }
  return new Uint8Array(bytes);
}

/** Element size as an 8-byte variable-length integer. */
function size(n: number): Bytes {
  const bytes = [0x01];
  for (let i = 6; i >= 0; i--) bytes.push(Math.floor(n / 2 ** (8 * i)) & 255);
  return new Uint8Array(bytes);
}

function el(elementId: number, ...children: Uint8Array[]): Bytes {
  const body = concat(children);
  return concat([id(elementId), size(body.length), body]);
}

/** Unsigned integer in the fewest bytes. */
function uint(n: number): Bytes {
  const bytes: number[] = [];
  let v = n;
  do {
    bytes.unshift(v & 255);
    v = Math.floor(v / 256);
  } while (v > 0);
  return new Uint8Array(bytes);
}

/** Clusters start on keyframes, and at least every 30 s (block times are 16-bit ms). */
const MAX_CLUSTER_MS = 30_000;

/**
 * Muxes VP9 frames into WebM. With `alpha`, each frame carries its alpha plane
 * in a BlockAdditional (AlphaMode 1), which is how Chrome and ffmpeg store
 * transparent VP9.
 */
export function muxWebm(samples: readonly WebmSample[], o: WebmOptions): Blob {
  const header = el(
    0x1a45dfa3, // EBML
    el(0x4286, uint(1)), // EBMLVersion
    el(0x42f7, uint(1)), // EBMLReadVersion
    el(0x42f2, uint(4)), // EBMLMaxIDLength
    el(0x42f3, uint(8)), // EBMLMaxSizeLength
    el(0x4282, utf8('webm')), // DocType
    el(0x4287, uint(4)), // DocTypeVersion
    el(0x4285, uint(2)), // DocTypeReadVersion
  );
  const durationMs = (samples.length * 1000) / o.fps;
  const info = el(
    0x1549a966, // Info
    el(0x2ad7b1, uint(1_000_000)), // TimestampScale: 1 ms
    el(0x4d80, utf8('Pixcue')), // MuxingApp
    el(0x5741, utf8('Pixcue')), // WritingApp
    el(0x4489, f64(durationMs)), // Duration
  );
  const video = [el(0xb0, uint(o.width)), el(0xba, uint(o.height))];
  if (o.alpha) video.push(el(0x53c0, uint(1))); // AlphaMode
  const track = [
    el(0xd7, uint(1)), // TrackNumber
    el(0x73c5, uint(1)), // TrackUID
    el(0x83, uint(1)), // TrackType: video
    el(0x86, utf8('V_VP9')), // CodecID
    el(0x9c, uint(0)), // FlagLacing
    el(0x23e383, uint(Math.round(1e9 / o.fps))), // DefaultDuration (ns)
    el(0xe0, ...video), // Video
  ];
  if (o.alpha) track.push(el(0x55ee, uint(1))); // MaxBlockAdditionID
  const tracks = el(0x1654ae6b, el(0xae, ...track));

  const clusters: Bytes[] = [];
  let current: Bytes[] | null = null;
  let clusterTime = 0;
  let previous = 0;
  for (const s of samples) {
    const t = Math.round(s.timestamp / 1000);
    if (!current || s.key || t - clusterTime > MAX_CLUSTER_MS) {
      if (current) clusters.push(el(0x1f43b675, ...current));
      current = [el(0xe7, uint(t))]; // Cluster Timestamp
      clusterTime = t;
    }
    const relative = t - clusterTime;
    if (o.alpha && s.alpha) {
      const group = [el(0xa1, concat([u8(0x81), i16(relative), u8(0), s.data]))]; // Block
      if (!s.key) group.push(el(0xfb, i16(previous - t))); // ReferenceBlock
      group.push(el(0x75a1, el(0xa6, el(0xee, uint(1)), el(0xa5, s.alpha)))); // BlockAdditions
      current.push(el(0xa0, ...group)); // BlockGroup
    } else {
      current.push(el(0xa3, concat([u8(0x81), i16(relative), u8(s.key ? 0x80 : 0), s.data]))); // SimpleBlock
    }
    previous = t;
  }
  if (current) clusters.push(el(0x1f43b675, ...current));

  return new Blob([header, el(0x18538067, info, tracks, ...clusters)], { type: 'video/webm' });
}

import { ascii, u32 } from '../bytes.ts';
import { box, movieHeader, TICKS_PER_FRAME, visualSampleEntry } from './isobmff.ts';

/** An encoded video frame in decode order, as WebCodecs emits it. */
export interface EncodedSample {
  readonly data: Uint8Array;
  /** Whether the frame is a keyframe (sync sample). */
  readonly key: boolean;
  /** Presentation time in microseconds. */
  readonly timestamp: number;
}

export interface Mp4Options {
  readonly width: number;
  readonly height: number;
  /** Integer frame rate. */
  readonly fps: number;
  /** The `avcC` decoder configuration (WebCodecs `decoderConfig.description`). */
  readonly avcC: Uint8Array;
}

/**
 * Muxes H.264 samples (AVC format, length-prefixed NAL units) into an MP4.
 * Handles B-frames: presentation times that differ from decode order become
 * composition offsets, and an edit list hides the resulting start delay.
 */
export function muxMp4(samples: readonly EncodedSample[], o: Mp4Options): Blob {
  const ticksPerSecond = o.fps * TICKS_PER_FRAME;
  // Decode time of sample i is i frames; composition offset = pts - dts.
  const offsets = samples.map(
    (s, i) => Math.round((s.timestamp * ticksPerSecond) / 1e6) - i * TICKS_PER_FRAME,
  );
  const minOffset = offsets.length ? Math.min(...offsets) : 0;
  const composition = offsets.map((x) => x - minOffset);
  const hasComposition = composition.some((x) => x !== 0);
  const earliest = Math.min(...samples.map((_, i) => i * TICKS_PER_FRAME + (composition[i] ?? 0)));

  const ftyp = box(
    'ftyp',
    ascii('isom'),
    u32(512),
    ascii('isom'),
    ascii('iso2'),
    ascii('avc1'),
    ascii('mp41'),
  );
  const sampleEntry = visualSampleEntry(
    'avc1',
    o.width,
    o.height,
    '',
    0x18,
    { temporal: 0, spatial: 0 },
    box('avcC', o.avcC),
  );
  const header = movieHeader({
    ftyp,
    sampleEntry,
    width: o.width,
    height: o.height,
    fps: o.fps,
    sampleSizes: samples.map((s) => s.data.length),
    syncSamples: samples.flatMap((s, i) => (s.key ? [i + 1] : [])),
    compositionOffsets: hasComposition ? composition : null,
    editMediaTime: samples.length && earliest > 0 ? earliest : 0,
    quicktime: false,
  });
  return new Blob([header, ...samples.map((s) => s.data as Uint8Array<ArrayBuffer>)], {
    type: 'video/mp4',
  });
}

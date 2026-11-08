import { ascii, u32 } from '../bytes.ts';
import { box, movieHeader, pcmSampleEntry, visualSampleEntry } from './isobmff.ts';

export interface MovOptions {
  readonly width: number;
  readonly height: number;
  /** Integer frame rate. */
  readonly fps: number;
  /** A sound track: 16-bit little-endian interleaved PCM. */
  readonly audio?:
    | { readonly pcm: Uint8Array; readonly sampleRate: number; readonly channels: number }
    | undefined;
}

/**
 * Muxes PNG images into a QuickTime MOV with the PNG codec and an alpha
 * channel (depth 32): the transparent format DaVinci Resolve, Premiere Pro and
 * Final Cut Pro import directly. Every frame is a sync sample. An optional
 * sound track carries 16-bit PCM (`sowt`), which they all read.
 */
export function muxMovPng(frames: readonly Uint8Array[], o: MovOptions): Blob {
  const ftyp = box('ftyp', ascii('qt  '), u32(0x200), ascii('qt  '));
  // Spatial quality 0x400 = lossless.
  const sampleEntry = visualSampleEntry('png ', o.width, o.height, 'PNG', 32, {
    temporal: 0,
    spatial: 0x400,
  });
  const header = movieHeader({
    ftyp,
    sampleEntry,
    width: o.width,
    height: o.height,
    fps: o.fps,
    sampleSizes: frames.map((f) => f.length),
    syncSamples: null,
    compositionOffsets: null,
    editMediaTime: 0,
    quicktime: true,
    audio: o.audio && {
      sampleEntry: pcmSampleEntry(o.audio.sampleRate, o.audio.channels),
      sampleRate: o.audio.sampleRate,
      sampleDelta: 1,
      // A sample is one frame across channels: 2 bytes per channel.
      sampleSizes: {
        each: 2 * o.audio.channels,
        count: o.audio.pcm.length / (2 * o.audio.channels),
      },
    },
  });
  const audio = o.audio ? [o.audio.pcm as Uint8Array<ArrayBuffer>] : [];
  return new Blob([header, ...(frames as Uint8Array<ArrayBuffer>[]), ...audio], {
    type: 'video/quicktime',
  });
}

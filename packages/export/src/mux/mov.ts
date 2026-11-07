import { ascii, u32 } from '../bytes.ts';
import { box, movieHeader, visualSampleEntry } from './isobmff.ts';

export interface MovOptions {
  readonly width: number;
  readonly height: number;
  /** Integer frame rate. */
  readonly fps: number;
}

/**
 * Muxes PNG images into a QuickTime MOV with the PNG codec and an alpha
 * channel (depth 32): the transparent format DaVinci Resolve, Premiere Pro and
 * Final Cut Pro import directly. Every frame is a sync sample.
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
  });
  return new Blob([header, ...(frames as Uint8Array<ArrayBuffer>[])], { type: 'video/quicktime' });
}

/**
 * Shared ISO base media file format (MP4 / QuickTime) writing for one video
 * track: everything goes in a single chunk and `moov` is written before `mdat`,
 * so files start playing and import without a second pass.
 */
import { ascii, type Bytes, concat, u8, u16, u32, u64 } from '../bytes.ts';

export function box(type: string, ...body: Uint8Array[]): Bytes {
  const content = concat(body);
  return concat([u32(8 + content.length), ascii(type), content]);
}

export function fullBox(
  type: string,
  version: number,
  flags: number,
  ...body: Uint8Array[]
): Bytes {
  return box(type, u8(version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255), ...body);
}

/** Identity transformation matrix (16.16 and 2.30 fixed point). */
const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].map(u32);

/** A Pascal string padded to `size` bytes (QuickTime compressor and handler names). */
export function pascal(text: string, size?: number): Bytes {
  const bytes = ascii(text.slice(0, 255));
  const out = new Uint8Array(size ?? bytes.length + 1);
  out[0] = bytes.length;
  out.set(bytes.subarray(0, out.length - 1), 1);
  return out;
}

/** The fields shared by `avc1` and QuickTime `png ` visual sample entries. */
export function visualSampleEntry(
  type: string,
  width: number,
  height: number,
  compressor: string,
  depth: number,
  quality: { temporal: number; spatial: number },
  ...children: Uint8Array[]
): Bytes {
  return box(
    type,
    new Uint8Array(6), // reserved
    u16(1), // data reference index
    u16(0), // version
    u16(0), // revision
    u32(0), // vendor
    u32(quality.temporal),
    u32(quality.spatial),
    u16(width),
    u16(height),
    u32(0x00480000), // 72 dpi
    u32(0x00480000),
    u32(0), // data size
    u16(1), // frames per sample
    pascal(compressor, 32),
    u16(depth),
    u16(0xffff), // no color table
    ...children,
  );
}

export interface MovieOptions {
  readonly ftyp: Uint8Array;
  readonly sampleEntry: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly sampleSizes: readonly number[];
  /** 1-based sync sample numbers, or `null` when every sample is a sync sample. */
  readonly syncSamples: readonly number[] | null;
  /** Per-sample composition offsets in media ticks (B-frames), or `null`. */
  readonly compositionOffsets: readonly number[] | null;
  /** Media time where presentation starts, for an edit list; 0 for none. */
  readonly editMediaTime: number;
  /** QuickTime-style handlers (`mhlr` / `dhlr` + `alis`) instead of ISO ones. */
  readonly quicktime: boolean;
  /** A sound track, stored after the video samples. */
  readonly audio?: AudioTrack | undefined;
}

/** A sound track: its samples sit in one chunk after the video. */
export interface AudioTrack {
  readonly sampleEntry: Uint8Array;
  /** Media timescale: the sample rate. */
  readonly sampleRate: number;
  /** Duration of every sample in media ticks (1 for PCM frames, 1024 for AAC). */
  readonly sampleDelta: number;
  /** One size per sample, or a single size shared by all of them. */
  readonly sampleSizes: readonly number[] | { readonly each: number; readonly count: number };
  /** Ticks to skip at the start (encoder priming), for an edit list; 0 for none. */
  readonly editMediaTime?: number;
}

/** The audio sample entry for 16-bit little-endian PCM in QuickTime (`sowt`). */
export function pcmSampleEntry(sampleRate: number, channels: number): Bytes {
  return box(
    'sowt',
    new Uint8Array(6), // reserved
    u16(1), // data reference index
    u16(0), // version 0
    u16(0), // revision
    u32(0), // vendor
    u16(channels),
    u16(16), // sample size in bits
    u16(0), // compression id
    u16(0), // packet size
    u32(sampleRate * 65536), // 16.16 fixed point
  );
}

/** An MPEG-4 descriptor: tag, size (one byte while under 128) and body. */
function descriptor(tag: number, ...body: Uint8Array[]): Bytes {
  const content = concat(body);
  if (content.length > 127) throw new Error('Descriptor too long');
  return concat([u8(tag, content.length), content]);
}

/**
 * The audio sample entry for AAC (`mp4a` with an `esds`), from the
 * AudioSpecificConfig the encoder reports.
 */
export function aacSampleEntry(
  sampleRate: number,
  channels: number,
  audioSpecificConfig: Uint8Array,
  bitrate: number,
): Bytes {
  const esds = fullBox(
    'esds',
    0,
    0,
    descriptor(
      0x03, // ES_Descriptor
      u16(0), // ES id
      u8(0), // flags
      descriptor(
        0x04, // DecoderConfigDescriptor
        u8(0x40), // object type: MPEG-4 audio
        u8((0x05 << 2) | 1), // stream type: audio
        u8(0, 0x18, 0), // buffer size (6 KiB)
        u32(bitrate), // max bitrate
        u32(bitrate), // average bitrate
        descriptor(0x05, audioSpecificConfig), // DecoderSpecificInfo
      ),
      descriptor(0x06, u8(0x02)), // SLConfigDescriptor: predefined for MP4
    ),
  );
  return box(
    'mp4a',
    new Uint8Array(6), // reserved
    u16(1), // data reference index
    u32(0),
    u32(0), // reserved
    u16(channels),
    u16(16), // sample size
    u16(0),
    u16(0),
    u32(sampleRate * 65536),
    esds,
  );
}

const audioCount = (t: AudioTrack) =>
  Array.isArray(t.sampleSizes) ? t.sampleSizes.length : (t.sampleSizes as { count: number }).count;

const audioBytes = (t: AudioTrack) => {
  if (!Array.isArray(t.sampleSizes)) {
    const s = t.sampleSizes as { each: number; count: number };
    return s.each * s.count;
  }
  let n = 0;
  for (const size of t.sampleSizes as readonly number[]) n += size;
  return n;
};

/** Media ticks per frame; the media timescale is `fps * 1000`. */
export const TICKS_PER_FRAME = 1000;

/**
 * Returns the file header (`ftyp`, `moov`, and the `mdat` header); the samples
 * follow it back to back, in order.
 */
export function movieHeader(o: MovieOptions): Bytes {
  const n = o.sampleSizes.length;
  const timescale = o.fps * TICKS_PER_FRAME;
  const movieDuration = Math.round((n * 1000) / o.fps);
  const mediaDuration = n * TICKS_PER_FRAME;
  let videoBytes = 0;
  for (const s of o.sampleSizes) videoBytes += s;
  const dataSize = videoBytes + (o.audio ? audioBytes(o.audio) : 0);
  const large = dataSize + 8 > 0xffffffff;
  const mdatHeader = large
    ? concat([u32(1), ascii('mdat'), u64(dataSize + 16)])
    : concat([u32(dataSize + 8), ascii('mdat')]);

  const stsd = fullBox('stsd', 0, 0, u32(1), o.sampleEntry);
  const stts = fullBox('stts', 0, 0, u32(1), u32(n), u32(TICKS_PER_FRAME));
  const stss = o.syncSamples
    ? fullBox('stss', 0, 0, u32(o.syncSamples.length), ...o.syncSamples.map(u32))
    : null;
  const stsc = fullBox('stsc', 0, 0, u32(1), u32(1), u32(n), u32(1));
  const stsz = fullBox('stsz', 0, 0, u32(0), u32(n), ...o.sampleSizes.map(u32));
  const ctts = o.compositionOffsets
    ? fullBox(
        'ctts',
        0,
        0,
        u32(n),
        ...o.compositionOffsets.flatMap((offset) => [u32(1), u32(offset)]),
      )
    : null;
  const edts =
    o.editMediaTime > 0
      ? box(
          'edts',
          fullBox('elst', 0, 0, u32(1), u32(movieDuration), u32(o.editMediaTime), u16(1), u16(0)),
        )
      : null;

  const handler = o.quicktime
    ? fullBox(
        'hdlr',
        0,
        0,
        ascii('mhlr'),
        ascii('vide'),
        u32(0),
        u32(0),
        u32(0),
        pascal('VideoHandler'),
      )
    : fullBox('hdlr', 0, 0, u32(0), ascii('vide'), u32(0), u32(0), u32(0), ascii('VideoHandler\0'));
  const dataHandler = o.quicktime
    ? fullBox(
        'hdlr',
        0,
        0,
        ascii('dhlr'),
        ascii('alis'),
        u32(0),
        u32(0),
        u32(0),
        pascal('DataHandler'),
      )
    : null;
  const dataReference = o.quicktime ? fullBox('alis', 0, 1) : fullBox('url ', 0, 1);

  const moov = (chunkOffset: number) => {
    const stco = fullBox('stco', 0, 0, u32(1), u32(chunkOffset));
    const stbl = box(
      'stbl',
      ...[stsd, stts, ctts, stss, stsc, stsz, stco].filter((b) => b !== null),
    );
    const minf = box(
      'minf',
      fullBox('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0)),
      ...(dataHandler ? [dataHandler] : []),
      box('dinf', fullBox('dref', 0, 0, u32(1), dataReference)),
      stbl,
    );
    const mdia = box(
      'mdia',
      fullBox(
        'mdhd',
        0,
        0,
        u32(0),
        u32(0),
        u32(timescale),
        u32(mediaDuration),
        u16(0x55c4),
        u16(0),
      ),
      handler,
      minf,
    );
    const tkhd = fullBox(
      'tkhd',
      0,
      3, // enabled, in movie
      u32(0), // creation time
      u32(0), // modification time
      u32(1), // track id
      u32(0),
      u32(movieDuration),
      u32(0),
      u32(0),
      u16(0), // layer
      u16(0), // alternate group
      u16(0), // volume
      u16(0),
      ...MATRIX,
      u32(o.width * 65536),
      u32(o.height * 65536),
    );
    const trak = box('trak', tkhd, ...(edts ? [edts] : []), mdia);
    const sound = o.audio
      ? audioTrak(o.audio, chunkOffset + videoBytes, movieDuration, o.quicktime)
      : null;
    const mvhd = fullBox(
      'mvhd',
      0,
      0,
      u32(0),
      u32(0),
      u32(1000), // movie timescale: milliseconds
      u32(movieDuration),
      u32(0x10000), // rate 1.0
      u16(0x100), // volume 1.0
      u16(0),
      u32(0),
      u32(0),
      ...MATRIX,
      ...Array.from({ length: 6 }, () => u32(0)), // pre-defined
      u32(sound ? 3 : 2), // next track id
    );
    return box('moov', mvhd, trak, ...(sound ? [sound] : []));
  };

  // moov's size does not depend on the chunk offset, so measure it once.
  const moovSize = moov(0).length;
  return concat([o.ftyp, moov(o.ftyp.length + moovSize + mdatHeader.length), mdatHeader]);
}

/** The `trak` of a sound track whose samples start at `chunkOffset`. */
function audioTrak(
  a: AudioTrack,
  chunkOffset: number,
  movieDuration: number,
  quicktime: boolean,
): Bytes {
  const count = audioCount(a);
  const mediaDuration = count * a.sampleDelta;
  const stsz = Array.isArray(a.sampleSizes)
    ? fullBox('stsz', 0, 0, u32(0), u32(count), ...(a.sampleSizes as readonly number[]).map(u32))
    : fullBox('stsz', 0, 0, u32((a.sampleSizes as { each: number }).each), u32(count));
  const stbl = box(
    'stbl',
    fullBox('stsd', 0, 0, u32(1), a.sampleEntry),
    fullBox('stts', 0, 0, u32(1), u32(count), u32(a.sampleDelta)),
    fullBox('stsc', 0, 0, u32(1), u32(1), u32(count), u32(1)),
    stsz,
    fullBox('stco', 0, 0, u32(1), u32(chunkOffset)),
  );
  const handler = quicktime
    ? fullBox(
        'hdlr',
        0,
        0,
        ascii('mhlr'),
        ascii('soun'),
        u32(0),
        u32(0),
        u32(0),
        pascal('SoundHandler'),
      )
    : fullBox('hdlr', 0, 0, u32(0), ascii('soun'), u32(0), u32(0), u32(0), ascii('SoundHandler\0'));
  const dataHandler = quicktime
    ? fullBox(
        'hdlr',
        0,
        0,
        ascii('dhlr'),
        ascii('alis'),
        u32(0),
        u32(0),
        u32(0),
        pascal('DataHandler'),
      )
    : null;
  const dataReference = quicktime ? fullBox('alis', 0, 1) : fullBox('url ', 0, 1);
  const minf = box(
    'minf',
    fullBox('smhd', 0, 0, u16(0), u16(0)),
    ...(dataHandler ? [dataHandler] : []),
    box('dinf', fullBox('dref', 0, 0, u32(1), dataReference)),
    stbl,
  );
  const mdia = box(
    'mdia',
    fullBox(
      'mdhd',
      0,
      0,
      u32(0),
      u32(0),
      u32(a.sampleRate),
      u32(mediaDuration),
      u16(0x55c4),
      u16(0),
    ),
    handler,
    minf,
  );
  const edts =
    a.editMediaTime && a.editMediaTime > 0
      ? box(
          'edts',
          fullBox('elst', 0, 0, u32(1), u32(movieDuration), u32(a.editMediaTime), u16(1), u16(0)),
        )
      : null;
  const tkhd = fullBox(
    'tkhd',
    0,
    3, // enabled, in movie
    u32(0),
    u32(0),
    u32(2), // track id
    u32(0),
    u32(movieDuration),
    u32(0),
    u32(0),
    u16(0), // layer
    u16(1), // alternate group
    u16(0x100), // volume 1.0
    u16(0),
    ...MATRIX,
    u32(0), // no width or height
    u32(0),
  );
  return box('trak', tkhd, ...(edts ? [edts] : []), mdia);
}

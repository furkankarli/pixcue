/**
 * H.264 decoder configuration (`avcC`) checks and repair. Some encoders hand
 * out a malformed avcC (Firefox 140+ duplicates the NAL header byte of the SPS
 * and PPS); players recover from in-band parameter sets, but editors may not.
 * When the avcC is invalid we rebuild it from the first keyframe.
 */
import { type Bytes, concat, u8, u16 } from '../bytes.ts';

const NAL_SPS = 7;
const NAL_PPS = 8;
/** Profiles whose avcC carries chroma format and bit depths (ISO/IEC 14496-15). */
const HIGH_PROFILES = new Set([100, 110, 122, 144]);

interface ParsedAvcC {
  readonly lengthSize: number;
  readonly sps: Uint8Array[];
  readonly pps: Uint8Array[];
}

function parseAvcC(avcC: Uint8Array): ParsedAvcC | null {
  try {
    if (avcC.length < 7 || avcC[0] !== 1) return null;
    const view = new DataView(avcC.buffer, avcC.byteOffset, avcC.byteLength);
    const lengthSize = ((avcC[4] ?? 0) & 3) + 1;
    let p = 6; // after the SPS count byte
    const read = (count: number) => {
      const list: Uint8Array[] = [];
      for (let i = 0; i < count; i++) {
        const length = view.getUint16(p);
        list.push(avcC.subarray(p + 2, p + 2 + length));
        p += 2 + length;
      }
      return list;
    };
    const sps = read((avcC[5] ?? 0) & 0x1f);
    const pps = read(avcC[p++] ?? 0);
    return p <= avcC.length ? { lengthSize, sps, pps } : null;
  } catch {
    return null;
  }
}

/** Whether an avcC is well-formed and its parameter sets look like real SPS/PPS NAL units. */
export function isValidAvcC(avcC: Uint8Array): boolean {
  const parsed = parseAvcC(avcC);
  const sps = parsed?.sps[0];
  const pps = parsed?.pps[0];
  if (!parsed || !sps || !pps) return false;
  return (
    ((avcC[4] ?? 0) & 0xfc) === 0xfc &&
    ((avcC[5] ?? 0) & 0xe0) === 0xe0 &&
    ((sps[0] ?? 0) & 0x1f) === NAL_SPS &&
    sps[1] === avcC[1] && // profile_idc matches
    sps[3] === avcC[3] && // level_idc matches
    ((pps[0] ?? 0) & 0x1f) === NAL_PPS
  );
}

/** Splits a length-prefixed (AVC format) sample into NAL units. */
export function nalUnits(sample: Uint8Array, lengthSize = 4): Uint8Array[] {
  const units: Uint8Array[] = [];
  let p = 0;
  while (p + lengthSize <= sample.length) {
    let length = 0;
    for (let i = 0; i < lengthSize; i++) length = length * 256 + (sample[p + i] ?? 0);
    p += lengthSize;
    if (length === 0 || p + length > sample.length) break;
    units.push(sample.subarray(p, p + length));
    p += length;
  }
  return units;
}

/** Reads exp-Golomb codes from an SPS, skipping emulation-prevention bytes. */
class BitReader {
  private readonly bytes: number[] = [];
  private bit = 0;
  constructor(nal: Uint8Array) {
    for (let i = 0; i < nal.length; i++) {
      // 00 00 03 → drop the 03
      if (i >= 2 && nal[i] === 3 && nal[i - 1] === 0 && nal[i - 2] === 0) continue;
      this.bytes.push(nal[i] ?? 0);
    }
  }
  skip(bits: number) {
    this.bit += bits;
  }
  readBit(): number {
    const byte = this.bytes[this.bit >> 3] ?? 0;
    const value = (byte >> (7 - (this.bit & 7))) & 1;
    this.bit++;
    return value;
  }
  readUe(): number {
    let zeros = 0;
    while (this.readBit() === 0 && zeros < 32) zeros++;
    let value = 0;
    for (let i = 0; i < zeros; i++) value = value * 2 + this.readBit();
    return 2 ** zeros - 1 + value;
  }
}

/** Builds a standard avcC from one SPS and one PPS (NAL units with their header byte). */
export function buildAvcC(sps: Uint8Array, pps: Uint8Array): Bytes {
  const profile = sps[1] ?? 0;
  const parts: Uint8Array[] = [
    u8(1, profile, sps[2] ?? 0, sps[3] ?? 0, 0xff /* 4-byte lengths */, 0xe1 /* one SPS */),
    u16(sps.length),
    sps,
    u8(1),
    u16(pps.length),
    pps,
  ];
  if (HIGH_PROFILES.has(profile)) {
    const r = new BitReader(sps);
    r.skip(32); // NAL header, profile, constraints, level
    r.readUe(); // seq_parameter_set_id
    const chromaFormat = r.readUe();
    if (chromaFormat === 3) r.skip(1);
    const lumaDepth = r.readUe();
    const chromaDepth = r.readUe();
    parts.push(u8(0xfc | (chromaFormat & 3), 0xf8 | (lumaDepth & 7), 0xf8 | (chromaDepth & 7), 0));
  }
  return concat(parts);
}

/**
 * Returns `avcC` when it is valid; otherwise an avcC rebuilt from the SPS and
 * PPS inside the first keyframe. Falls back to the original if neither works.
 */
export function ensureAvcC(avcC: Uint8Array, keyframe: Uint8Array | undefined): Uint8Array {
  if (isValidAvcC(avcC) || !keyframe) return avcC;
  const units = nalUnits(keyframe);
  const sps = units.find((u) => ((u[0] ?? 0) & 0x1f) === NAL_SPS);
  const pps = units.find((u) => ((u[0] ?? 0) & 0x1f) === NAL_PPS);
  return sps && pps ? buildAvcC(sps, pps) : avcC;
}

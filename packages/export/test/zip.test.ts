import { describe, expect, it } from 'vitest';
import { utf8 } from '../src/bytes.ts';
import { crc32 } from '../src/crc32.ts';
import { createZip } from '../src/zip.ts';

describe('crc32', () => {
  it('matches the standard check value', () => {
    expect(crc32(utf8('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

/** Minimal zip reader for tests: follows the central directory. */
function readZip(buf: Buffer): { name: string; data: Buffer; crc: number }[] {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(p)).toBe(0x02014b50);
    const crc = buf.readUInt32LE(p + 16);
    const size = buf.readUInt32LE(p + 20);
    const nameLength = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLength).toString('utf8');
    const localName = buf.readUInt16LE(local + 26);
    const start = local + 30 + localName;
    out.push({ name, data: buf.subarray(start, start + size), crc });
    p += 46 + nameLength;
  }
  return out;
}

describe('createZip', () => {
  it('stores entries that read back intact, with UTF-8 names', async () => {
    const files = [
      { name: 'kare/şeffaf_0000.png', data: utf8('first') },
      { name: 'kare/şeffaf_0001.png', data: new Uint8Array([0, 1, 2, 255]) },
    ];
    const blob = createZip(files);
    expect(blob.type).toBe('application/zip');
    const entries = readZip(Buffer.from(await blob.arrayBuffer()));
    expect(entries.map((e) => e.name)).toEqual(files.map((f) => f.name));
    entries.forEach((e, i) => {
      expect(new Uint8Array(e.data)).toEqual(files[i]?.data);
      expect(e.crc).toBe(crc32(files[i]?.data ?? new Uint8Array()));
    });
  });

  it('writes an empty archive', async () => {
    const buf = Buffer.from(await createZip([]).arrayBuffer());
    expect(buf.length).toBe(22);
  });
});

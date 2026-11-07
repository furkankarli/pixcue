import { type Bytes, utf8 } from './bytes.ts';
import { crc32 } from './crc32.ts';

export interface ZipEntry {
  /** Path inside the archive, with forward slashes. */
  readonly name: string;
  readonly data: Uint8Array;
}

/** Largest archive a plain (non-Zip64) zip can describe. */
const ZIP32_LIMIT = 0xffffffff;

/**
 * Builds an uncompressed ("stored") zip. PNG data is already compressed, so
 * storing keeps exports fast. File names are UTF-8.
 */
export function createZip(entries: readonly ZipEntry[]): Blob {
  const parts: BlobPart[] = [];
  const central: Bytes[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = utf8(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;
    if (offset + 30 + name.length + size > ZIP32_LIMIT) {
      throw new RangeError(
        'The export is larger than 4 GB; shorten the clip or lower the resolution.',
      );
    }

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // local file header signature
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // flags: UTF-8 names
    local.setUint16(12, 0x21, true); // date: 1980-01-01
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, entry.data as Bytes);

    const record = new DataView(new ArrayBuffer(46));
    record.setUint32(0, 0x02014b50, true); // central directory signature
    record.setUint16(4, 20, true); // version made by
    record.setUint16(6, 20, true); // version needed
    record.setUint16(8, 0x0800, true);
    record.setUint16(14, 0x21, true);
    record.setUint32(16, crc, true);
    record.setUint32(20, size, true);
    record.setUint32(24, size, true);
    record.setUint16(28, name.length, true);
    record.setUint32(42, offset, true); // local header offset
    central.push(new Uint8Array(record.buffer), name);

    offset += 30 + name.length + size;
  }

  let centralSize = 0;
  for (const c of central) centralSize += c.length;
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // end of central directory
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

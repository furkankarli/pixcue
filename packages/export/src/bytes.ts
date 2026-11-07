/** Bytes we own, backed by a plain ArrayBuffer (accepted by Blob and DataView). */
export type Bytes = Uint8Array<ArrayBuffer>;

export function concat(parts: readonly Uint8Array[]): Bytes {
  let length = 0;
  for (const p of parts) length += p.length;
  const out = new Uint8Array(length);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function u8(...values: number[]): Bytes {
  return new Uint8Array(values);
}

export function u16(value: number): Bytes {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, value & 0xffff);
  return b;
}

export function i16(value: number): Bytes {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setInt16(0, value);
  return b;
}

export function u32(value: number): Bytes {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, value >>> 0);
  return b;
}

export function u64(value: number): Bytes {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, BigInt(value));
  return b;
}

export function f64(value: number): Bytes {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setFloat64(0, value);
  return b;
}

/** Latin-1 bytes of a string (box types, four-character codes). */
export function ascii(text: string): Bytes {
  const b = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) b[i] = text.charCodeAt(i) & 0xff;
  return b;
}

export function utf8(text: string): Bytes {
  return new TextEncoder().encode(text) as Bytes;
}

/** Total length of a list of parts. */
export function byteLength(parts: readonly Uint8Array[]): number {
  let n = 0;
  for (const p of parts) n += p.length;
  return n;
}

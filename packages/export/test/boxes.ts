/** Test helper: reads an ISO-BMFF box tree. */
export interface Box {
  readonly type: string;
  readonly start: number;
  readonly size: number;
  /** Payload (after the 8-byte header). */
  readonly body: Buffer;
  readonly children: Box[];
}

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'edts']);

export function parseBoxes(buf: Buffer, start = 0, end = buf.length): Box[] {
  const out: Box[] = [];
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(p + 8));
      header = 16;
    }
    const body = buf.subarray(p + header, p + size);
    const children = CONTAINERS.has(type) ? parseBoxes(buf, p + header, p + size) : [];
    out.push({ type, start: p, size, body, children });
    p += size;
  }
  return out;
}

/** Finds the first box at a slash-separated path, e.g. "moov/trak/mdia/minf/stbl/stsd". */
export function find(boxes: Box[], path: string): Box | undefined {
  const [head, ...rest] = path.split('/');
  const b = boxes.find((x) => x.type === head);
  if (!b || rest.length === 0) return b;
  return find(b.children, rest.join('/'));
}

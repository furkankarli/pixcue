import { describe, expect, it } from 'vitest';
import { muxMovPng } from '../src/mux/mov.ts';
import { find, parseBoxes } from './boxes.ts';

const bytes = async (blob: Blob) => Buffer.from(await blob.arrayBuffer());

describe('muxMovPng', () => {
  it('writes a QuickTime file with a 32-bit png sample description and no sync table', async () => {
    const pngs = [new Uint8Array(10), new Uint8Array(20)];
    const buf = await bytes(muxMovPng(pngs, { width: 1920, height: 1080, fps: 30 }));
    const boxes = parseBoxes(buf);
    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'moov', 'mdat']);
    expect(boxes[0]?.body.toString('latin1', 0, 4)).toBe('qt  ');
    const stsd = find(boxes, 'moov/trak/mdia/minf/stbl/stsd');
    const entry = stsd?.body.subarray(8);
    expect(entry?.toString('latin1', 4, 8)).toBe('png ');
    // depth sits after 8 + 70 bytes of the visual sample entry header
    expect(entry?.readUInt16BE(8 + 74)).toBe(32);
    expect(find(boxes, 'moov/trak/mdia/minf/stbl/stss')).toBeUndefined();
    expect(find(boxes, 'moov/trak/mdia/minf/stbl/ctts')).toBeUndefined();
    expect(find(boxes, 'moov/trak/mdia/hdlr')?.body.toString('latin1', 4, 12)).toBe('mhlrvide');
    expect(boxes[2]?.body.length).toBe(30);
  });
});

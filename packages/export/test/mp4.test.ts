import { describe, expect, it } from 'vitest';
import { type EncodedSample, muxMp4 } from '../src/mux/mp4.ts';
import { find, parseBoxes } from './boxes.ts';

const bytes = async (blob: Blob) => Buffer.from(await blob.arrayBuffer());
const fakeAvcC = new Uint8Array([1, 0x64, 0, 0x28, 0xff, 0xe0, 0]);

describe('muxMp4', () => {
  const frames = (pts: number[]): EncodedSample[] =>
    pts.map((p, i) => ({
      data: new Uint8Array([i, i, i]),
      key: i === 0,
      timestamp: (p * 1e6) / 30,
    }));

  it('writes ftyp, moov, then mdat with the samples', async () => {
    const buf = await bytes(
      muxMp4(frames([0, 1, 2]), { width: 64, height: 32, fps: 30, avcC: fakeAvcC }),
    );
    const boxes = parseBoxes(buf);
    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'moov', 'mdat']);
    const stco = find(boxes, 'moov/trak/mdia/minf/stbl/stco');
    const mdat = boxes[2];
    expect(stco?.body.readUInt32BE(8)).toBe((mdat?.start ?? 0) + 8);
    expect([...(mdat?.body ?? [])]).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2]);
    expect(find(boxes, 'moov/trak/mdia/minf/stbl/stss')?.body.readUInt32BE(4)).toBe(1);
    expect(find(boxes, 'moov/trak/mdia/minf/stbl/ctts')).toBeUndefined();
  });

  it('writes composition offsets and an edit list for B-frames', async () => {
    // Decode order I P B B: presentation 0 3 1 2
    const buf = await bytes(
      muxMp4(frames([0, 3, 1, 2]), { width: 64, height: 32, fps: 30, avcC: fakeAvcC }),
    );
    const boxes = parseBoxes(buf);
    const ctts = find(boxes, 'moov/trak/mdia/minf/stbl/ctts');
    expect(ctts).toBeDefined();
    const offsets = [0, 1, 2, 3].map((i) => ctts?.body.readUInt32BE(8 + i * 8 + 4));
    // pts - dts is [0, 2, -1, -1] frames; shifted by the minimum: [1, 3, 0, 0] frames
    expect(offsets).toEqual([1000, 3000, 0, 0]);
    // The earliest presentation is 1000 ticks in, so the edit list starts there.
    const elst = find(boxes, 'moov/trak/edts/elst');
    expect(elst?.body.readUInt32BE(12)).toBe(1000);
  });
});

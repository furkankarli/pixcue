import { describe, expect, it } from 'vitest';
import { context2d } from '../src/canvas.ts';
import { PIXEL_FONT_BOLD, PIXEL_FONT_SMALL } from '../src/pixel/fonts.ts';
import {
  bitmapSprite,
  pixelChip,
  pixelPanel,
  pixelTextStyles,
  rasterizeText,
  SPRITES,
  type Sprite,
} from '../src/pixel/raster.ts';

/** Reads a sprite back as rows of characters: '#' for opaque pixels, '.' for empty. */
function ascii(s: Sprite): string[] {
  const data = context2d(s.canvas).getImageData(0, 0, s.w, s.h).data;
  const rows: string[] = [];
  for (let y = 0; y < s.h; y++) {
    let row = '';
    for (let x = 0; x < s.w; x++) row += (data[(y * s.w + x) * 4 + 3] ?? 0) > 0 ? '#' : '.';
    rows.push(row);
  }
  return rows;
}

describe('rasterizeText', () => {
  it('lays out glyphs with gaps and reserves accent and descent rows', () => {
    const t = rasterizeText('AB', PIXEL_FONT_BOLD);
    // two 6-wide glyphs + 1 gap; 2 accent rows + 7 cap rows + 2 descent rows
    expect(t).toMatchObject({ w: 13, h: 11, length: 2, pad: 0 });
    expect(t.xs).toEqual([0, 7, 14]);
  });

  it('draws the glyph rows exactly', () => {
    const rows = ascii(rasterizeText('I', PIXEL_FONT_SMALL));
    expect(rows.slice(2, 7)).toEqual(['###', '.#.', '.#.', '.#.', '###']);
  });

  it('draws Turkish marks above and below the capitals', () => {
    const g = ascii(rasterizeText('Ğ', PIXEL_FONT_SMALL));
    expect(g[0]).toBe('.##.'); // breve in the ascent rows
    const c = ascii(rasterizeText('Ç', PIXEL_FONT_SMALL));
    expect(c[7]).toBe('.#..'); // cedilla in the descent row
  });

  it('uppercases with Turkish rules', () => {
    expect(ascii(rasterizeText('iğ', PIXEL_FONT_SMALL))).toEqual(
      ascii(rasterizeText('İĞ', PIXEL_FONT_SMALL)),
    );
  });

  it('grows by the outline and shadow, and scales', () => {
    const t = rasterizeText('A', PIXEL_FONT_BOLD, {
      scale: 2,
      outline: '#000',
      outlineWidth: 2,
      shadow: '#333',
      shadowOffset: 2,
    });
    expect(t).toMatchObject({ w: 6 * 2 + 4 + 2, h: 11 * 2 + 4 + 2, pad: 2, scale: 2 });
  });

  it('caches identical requests', () => {
    expect(pixelTextStyles.title('Pixcue', '#E8100E')).toBe(
      pixelTextStyles.title('Pixcue', '#E8100E'),
    );
  });
});

describe('sprites', () => {
  it('outlines bitmap sprites by one pixel', () => {
    const s = bitmapSprite(SPRITES.play, { D: '#800', R: '#f00' }, true);
    expect(s).toMatchObject({ w: 7, h: 9 });
  });

  it('adds a 3-pixel drop shadow under panels', () => {
    expect(pixelPanel(40, 20, '#1C1C21')).toMatchObject({ w: 40, h: 23 });
  });

  it('sizes chips to their label', () => {
    const chip = pixelChip('İnceleme', '#E8100E');
    expect(chip.h).toBe(10);
    expect(chip.w).toBe(pixelTextStyles.plain('İnceleme', '#fff').w + 6);
  });
});

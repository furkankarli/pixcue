import { describe, expect, it } from 'vitest';
import {
  type BitmapFont,
  glyphFor,
  PIXEL_FONT_BOLD,
  PIXEL_FONT_SMALL,
} from '../src/pixel/fonts.ts';

const fonts: [string, BitmapFont][] = [
  ['bold', PIXEL_FONT_BOLD],
  ['small', PIXEL_FONT_SMALL],
];

describe.each(fonts)('%s pixel font', (_, font) => {
  it('has glyphs only made of "X" and "." in its cap height (or one more row for commas)', () => {
    for (const [ch, rows] of Object.entries(font.glyphs)) {
      expect(rows.length, ch).toBeGreaterThanOrEqual(font.height);
      expect(rows.length, ch).toBeLessThanOrEqual(font.height + font.descent);
      for (const row of rows) expect(row, ch).toMatch(/^[X.]+$/);
    }
  });

  it('covers A–Z and 0–9', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      expect(font.glyphs[ch], ch).toBeDefined();
    }
  });

  it('draws Turkish capitals with their marks', () => {
    for (const ch of 'ÖÜİĞ') {
      const g = glyphFor(font, ch);
      expect(g.accent, ch).toBeDefined();
      expect(g.accent?.length ?? 0, ch).toBeLessThanOrEqual(font.ascent);
    }
    for (const ch of 'ÇŞ') {
      const g = glyphFor(font, ch);
      expect(g.cedilla, ch).toBe(font.cedilla);
      expect(g.rows).toBe(font.glyphs[ch === 'Ç' ? 'C' : 'S']);
    }
  });

  it('falls back to the base letter for other accents and to "?" for unknown characters', () => {
    expect(glyphFor(font, 'É').rows).toBe(font.glyphs.E);
    expect(glyphFor(font, '€').rows).toBe(font.glyphs['?']);
  });

  it('maps typographic punctuation to plain glyphs', () => {
    expect(glyphFor(font, '’').rows).toBe(font.glyphs["'"]);
    expect(glyphFor(font, '“').rows).toBe(font.glyphs['"']);
    expect(glyphFor(font, '—').rows).toBe(font.glyphs['-']);
  });
});

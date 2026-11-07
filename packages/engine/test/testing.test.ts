import { describe, expect, it } from 'vitest';
import { createTestCanvas } from '../testing/index.ts';

const { ctx } = createTestCanvas(8, 8);
const width = (font: string, text: string) => {
  ctx.font = font;
  return ctx.measureText(text).width;
};

describe('test fonts', () => {
  it('loads every theme font family', () => {
    const fallback = width('700 40px sans-serif', 'Pixcue');
    for (const family of ['"Chakra Petch"', 'Anton', 'Manrope', '"JetBrains Mono"']) {
      expect(width(`700 40px ${family}`, 'Pixcue'), family).not.toBeCloseTo(fallback, 1);
    }
  });

  it('selects Manrope weights by font-weight', () => {
    const medium = width('500 40px Manrope', 'Pixcue Studio');
    const extraBold = width('800 40px Manrope', 'Pixcue Studio');
    expect(extraBold).toBeGreaterThan(medium);
  });

  it('has Turkish glyphs in every family', () => {
    // A missing glyph falls back to another font and changes the width
    // relative to the base letter by a large amount; accented letters should
    // be as wide as their base letters (± a little).
    for (const family of ['"Chakra Petch"', 'Anton', 'Manrope', '"JetBrains Mono"']) {
      for (const [accented, base] of [
        ['Ğ', 'G'],
        ['Ş', 'S'],
        ['İ', 'I'],
        ['Ç', 'C'],
        ['Ö', 'O'],
        ['Ü', 'U'],
        ['ğ', 'g'],
        ['ş', 's'],
        ['ç', 'c'],
        ['ö', 'o'],
        ['ü', 'u'],
      ] as const) {
        const ratio = width(`700 40px ${family}`, accented) / width(`700 40px ${family}`, base);
        expect(ratio, `${family} ${accented}`).toBeGreaterThan(0.85);
        expect(ratio, `${family} ${accented}`).toBeLessThan(1.15);
      }
    }
  });
});

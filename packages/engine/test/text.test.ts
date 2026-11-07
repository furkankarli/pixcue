import { describe, expect, it } from 'vitest';
import {
  decimalsOf,
  formatLike,
  formatNumber,
  lines,
  pairs,
  parseNumber,
  upper,
} from '../src/text.ts';

describe('upper', () => {
  it('uses Turkish rules when the text has Turkish letters', () => {
    expect(upper("istanbul'da güzel")).toBe("İSTANBUL'DA GÜZEL");
  });

  it('uses default rules otherwise', () => {
    expect(upper('pixcue studio')).toBe('PIXCUE STUDIO');
  });

  it('uses Turkish rules for Turkish copy', () => {
    expect(upper('pil', 'tr')).toBe('PİL');
    expect(upper('dinamik', 'tr-TR')).toBe('DİNAMİK');
  });

  it('keeps guessing from the text for other languages', () => {
    expect(upper('driver', 'en')).toBe('DRIVER');
    expect(upper('sürücü icin', 'en')).toBe('SÜRÜCÜ İCİN');
  });

  it('is idempotent', () => {
    expect(upper(upper('dinamik', 'tr'))).toBe('DİNAMİK');
  });
});

describe('lines and pairs', () => {
  it('drops blank lines and trims', () => {
    expect(lines('  a \n\n b\n')).toEqual(['a', 'b']);
  });

  it('splits label | value, keeping later pipes in the value', () => {
    expect(pairs('Sensör | PixArt PAW3311\nTuş sayısı\nA | b | c')).toEqual([
      ['Sensör', 'PixArt PAW3311'],
      ['Tuş sayısı', ''],
      ['A', 'b | c'],
    ]);
  });
});

describe('numbers', () => {
  it('accepts decimal commas', () => {
    expect(parseNumber('8,5', 0)).toBe(8.5);
    expect(parseNumber('', 10)).toBe(10);
    expect(parseNumber(null, 3)).toBe(3);
  });

  it('formats like the user typed it', () => {
    expect(formatLike('8,5', 7.25)).toBe('7,3');
    expect(formatLike('9.25', 4)).toBe('4.00');
    expect(formatLike('10', 6.6)).toBe('7');
  });
});

describe('locale numbers', () => {
  it('counts decimals', () => {
    expect(decimalsOf(8.5)).toBe(1);
    expect(decimalsOf(10)).toBe(0);
    expect(decimalsOf(7.25)).toBe(2);
  });

  it('uses the locale decimal separator without grouping', () => {
    expect(formatNumber(8.5, 1, 'tr')).toBe('8,5');
    expect(formatNumber(8.5, 1, 'en')).toBe('8.5');
    expect(formatNumber(1234.56, 0, 'tr')).toBe('1235');
  });
});

import { describe, expect, it } from 'vitest';
import { formatLike, lines, pairs, parseNumber, upper } from '../src/text.ts';

describe('upper', () => {
  it('uses Turkish rules when the text has Turkish letters', () => {
    expect(upper("istanbul'da güzel")).toBe("İSTANBUL'DA GÜZEL");
  });

  it('uses default rules otherwise', () => {
    expect(upper('pixcue studio')).toBe('PIXCUE STUDIO');
  });

  it('follows an explicit locale', () => {
    expect(upper('istanbul', 'tr')).toBe('İSTANBUL');
    expect(upper('istanbul', 'en')).toBe('ISTANBUL');
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

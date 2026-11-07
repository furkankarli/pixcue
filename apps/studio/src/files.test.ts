import { describe, expect, it } from 'vitest';
import { fileName, slug } from './files.ts';

describe('slug', () => {
  it('transliterates Turkish letters', () => {
    expect(slug('Kablosuz Kulaklık – İnceleme!')).toBe('kablosuz-kulaklik-inceleme');
    expect(slug('ŞEKER ÇÖĞÜ')).toBe('seker-cogu');
  });

  it('drops accents and symbols and limits the length', () => {
    expect(slug('Crème brûlée & co.')).toBe('creme-brulee-co');
    expect(slug('a'.repeat(60))).toHaveLength(40);
    expect(slug('—')).toBe('');
  });
});

describe('fileName', () => {
  it('joins the non-empty parts', () => {
    expect(fileName(['Alt bant', 'Kablosuz Kulaklık', 'youtube'], 'mov')).toBe(
      'alt-bant-kablosuz-kulaklik-youtube.mov',
    );
    expect(fileName(['', '!!'], 'zip')).toBe('pixcue.zip');
  });
});

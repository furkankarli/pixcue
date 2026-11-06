import { describe, expect, it } from 'vitest';
import { createTranslator, DEFAULT_LOCALE, detectLocale, interpolate } from '../src/index.ts';

describe('detectLocale', () => {
  it('matches an exact language tag', () => {
    expect(detectLocale(['tr'])).toBe('tr');
  });

  it('falls back to the base language of a regional tag', () => {
    expect(detectLocale(['tr-TR'])).toBe('tr');
  });

  it('is case-insensitive', () => {
    expect(detectLocale(['TR-tr'])).toBe('tr');
  });

  it('respects preference order', () => {
    expect(detectLocale(['de-DE', 'tr', 'en'])).toBe('tr');
    expect(detectLocale(['en-GB', 'tr'])).toBe('en');
  });

  it('defaults to English', () => {
    expect(detectLocale([])).toBe(DEFAULT_LOCALE);
    expect(detectLocale(['de', 'fr-FR'])).toBe('en');
  });
});

describe('interpolate', () => {
  it('replaces placeholders', () => {
    expect(interpolate('{n} frames at {fps} fps', { n: 90, fps: 30 })).toBe('90 frames at 30 fps');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
  });
});

describe('createTranslator', () => {
  it('translates nested keys', () => {
    expect(createTranslator('en')('settings.language')).toBe('Language');
    expect(createTranslator('tr')('settings.language')).toBe('Dil');
  });

  it('keeps Turkish characters intact', () => {
    expect(createTranslator('tr')('app.tagline')).toMatch(/^İçerik üreticileri/);
  });
});

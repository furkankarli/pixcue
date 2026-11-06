import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { type Locale, locales } from '../src/index.ts';

type Tree = { readonly [key: string]: string | Tree };

/** Flattens a message tree into `dot.path → message`. */
function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix + key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of leaves(value, `${path}.`)) out.set(k, v);
  }
  return out;
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

const source = leaves(locales.en.messages);
const entries = Object.entries(locales) as [string, Locale][];

describe('locale files', () => {
  it('registers every file in src/locales/', () => {
    const files = readdirSync(new URL('../src/locales/', import.meta.url))
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => f.replace(/\.ts$/, ''))
      .sort();
    expect(
      Object.keys(locales).sort(),
      'register new locale files in src/locales/index.ts',
    ).toEqual(files);
  });

  describe.each(entries)('%s', (key, locale) => {
    const messages = leaves(locale.messages);

    it('uses its registry key as its code', () => {
      expect(locale.code).toBe(key);
    });

    it('has a native language name', () => {
      expect(locale.name.trim()).not.toBe('');
    });

    it('has exactly the English keys', () => {
      expect([...messages.keys()].sort()).toEqual([...source.keys()].sort());
    });

    it('has no empty messages', () => {
      const empty = [...messages].filter(([, m]) => m.trim() === '').map(([k]) => k);
      expect(empty).toEqual([]);
    });

    it('keeps the same {placeholders} as English', () => {
      for (const [k, m] of messages) {
        expect(placeholders(m), k).toEqual(placeholders(source.get(k) ?? ''));
      }
    });
  });
});

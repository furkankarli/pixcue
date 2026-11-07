import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { THEME_IDS } from '@pixcue/engine';
import { describe, expect, it } from 'vitest';
import { messagesSource, namesFor, templateSource } from '../../../scripts/new-template.ts';
import type { Template } from '../src/api.ts';
import { paintedPixels, renderFrame } from './render-helpers.ts';

describe('new-template scaffolder', () => {
  it('derives names from the id', () => {
    expect(namesFor('quote-card')).toEqual({
      id: 'quote-card',
      camel: 'quoteCard',
      pascal: 'QuoteCard',
      title: 'Quote card',
    });
  });

  it('rejects ids that are not kebab-case', () => {
    for (const id of ['QuoteCard', 'quote_card', '-quote', 'quote--card', '1-card']) {
      expect(() => namesFor(id), id).toThrow(/not a valid id/);
    }
  });

  it('marks non-English strings for translation', () => {
    expect(messagesSource(namesFor('quote-card'), true)).toMatch(/TODO\(i18n\)/);
    expect(messagesSource(namesFor('quote-card'), false)).not.toMatch(/TODO/);
  });

  it('matches the complete example in docs/templates.md', () => {
    const doc = readFileSync(new URL('../../../docs/templates.md', import.meta.url), 'utf8');
    const block = doc.split('<!-- example:title-card -->')[1]?.match(/```ts\n([\s\S]*?)```/)?.[1];
    // Formatting may differ (line breaks, trailing commas); the code must not.
    const code = (s: string) => s.replace(/\s+/g, '').replace(/,([)\]}])/g, '$1');
    expect(block).toBeDefined();
    expect(code(block ?? '')).toBe(code(templateSource(namesFor('title-card'))));
  });

  it('generates a template that renders in every theme, empty at both ends', async () => {
    const dir = new URL('./.scaffold/', import.meta.url);
    mkdirSync(dir, { recursive: true });
    const file = new URL('title-card.ts', dir);
    writeFileSync(file, templateSource(namesFor('title-card'), '../../src/api.ts'));
    const { titleCard } = (await import(file.href)) as { titleCard: Template };

    expect(titleCard.id).toBe('title-card');
    for (const theme of THEME_IDS) {
      for (let t = 0; t <= titleCard.duration; t += 0.25) {
        const { ctx, frame } = renderFrame({ template: titleCard, theme, preset: 'youtube', t });
        const painted = paintedPixels(ctx, frame.pixelWidth, frame.pixelHeight);
        if (t === 0 || t === titleCard.duration) expect(painted, `${theme} t=${t}`).toBe(0);
        if (t === 2) expect(painted, `${theme} t=${t}`).toBeGreaterThan(1000);
      }
    }
  });
});

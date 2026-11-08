import { THEME_IDS } from '@pixcue/engine';
import { createTranslator, localeCodes, type MessageKey } from '@pixcue/i18n';
import { describe, expect, it } from 'vitest';
import { coerceValue, type Field, resolveFields, type Template } from '../src/api.ts';
import { TEMPLATES } from '../src/registry.ts';
import { paintedPixels, renderFrame } from './render-helpers.ts';

function messageKeys(template: Template): MessageKey[] {
  const keys: MessageKey[] = [template.name];
  for (const f of Object.values(template.fields) as Field[]) {
    keys.push(f.label);
    if (f.help) keys.push(f.help);
    if (f.type === 'select') keys.push(...f.options.map((o) => o.label));
    if (f.type === 'list') keys.push(...Object.values(f.item).map((i) => i.label));
  }
  return keys;
}

describe('template registry', () => {
  it('has unique ids', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe.each(TEMPLATES.map((t) => [t.id, t] as const))('%s', (_, template) => {
  it.each(localeCodes)('is translated in %s', (locale) => {
    const t = createTranslator(locale);
    const missing = messageKeys(template).filter((key) => t(key) === key);
    expect(missing).toEqual([]);
  });

  it('has valid defaults in every language and platform', () => {
    for (const locale of localeCodes) {
      for (const platform of ['youtube', 'tiktok', 'instagram', 'any'] as const) {
        const values = resolveFields(
          template,
          {},
          { t: createTranslator(locale), locale, platform },
        );
        for (const [key, f] of Object.entries(template.fields) as [string, Field][]) {
          const value = (values as Record<string, unknown>)[key];
          expect(coerceValue(f, value), `${locale}/${platform}/${key}`).toEqual(value);
        }
      }
    }
  });

  it.each(THEME_IDS)('renders the whole clip in %s without errors', (theme) => {
    for (let t = 0; t <= template.duration; t += 0.25) {
      expect(() => renderFrame({ template, theme, preset: 'youtube', t })).not.toThrow();
    }
  });

  it.each(THEME_IDS)('starts and ends empty in %s', (theme) => {
    for (const t of [0, template.duration]) {
      const { ctx, frame } = renderFrame({ template, theme, preset: 'youtube', t });
      expect(paintedPixels(ctx, frame.pixelWidth, frame.pixelHeight), `t=${t}`).toBe(0);
    }
  });

  it.each(THEME_IDS)('stays inside the frame in vertical video with %s', (theme) => {
    const { bounds, frame } = renderFrame({
      template,
      theme,
      preset: 'vertical',
      t: template.duration / 2,
    });
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(frame.pixelWidth);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(frame.pixelHeight);
  });

  it.each(['youtube', 'vertical'] as const)(
    'keeps its pixel-theme size in a small %s preview',
    (preset) => {
      const t = template.duration / 2;
      const full = renderFrame({ template, theme: 'pixel', preset, t }).bounds;
      const small = renderFrame({ template, theme: 'pixel', preset, t, width: 480 });
      const k = small.frame.unit;
      // Within one grid cell (6 output pixels at 1080p) of the export, scaled down.
      for (const key of ['x', 'y', 'width', 'height'] as const)
        expect(Math.abs(small.bounds[key] / k - full[key]), key).toBeLessThanOrEqual(6);
    },
  );
});

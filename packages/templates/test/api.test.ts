import { createTranslator } from '@pixcue/i18n';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  coerceValue,
  type DefaultContext,
  defineTemplate,
  type FieldValues,
  field,
  resolveFields,
} from '../src/api.ts';
import { lowerThird } from '../src/lower-third.ts';

const ctx: DefaultContext = { t: createTranslator('en'), locale: 'en', platform: 'youtube' };

const fields = {
  title: field.text({ label: 'settings.language', default: 'Hello', maxLength: 5 }),
  count: field.number({ label: 'settings.language', min: 0, max: 10, default: 3 }),
  color: field.color({ label: 'settings.language', default: '#ffffff' }),
  on: field.boolean({
    label: 'settings.language',
    default: ({ platform }) => platform === 'youtube',
  }),
  side: field.select({
    label: 'settings.language',
    options: [
      { value: 'left', label: 'settings.language' },
      { value: 'right', label: 'settings.language' },
    ],
    default: 'right',
  }),
  rows: field.list({
    label: 'settings.language',
    item: {
      name: field.item.text('settings.language', 4),
      score: field.item.number('settings.language', 0, 10),
    },
    max: 2,
    default: [{ name: 'A', score: 1 }],
  }),
};

const sample = defineTemplate({
  id: 'sample-card',
  name: 'settings.language',
  duration: 4,
  minDuration: 2,
  position: 'mc',
  fields,
  render: lowerThird as never,
});

describe('field types', () => {
  it('infers value types from the schema', () => {
    expectTypeOf<FieldValues<typeof fields>>().toEqualTypeOf<{
      readonly title: string;
      readonly count: number;
      readonly color: string;
      readonly on: boolean;
      readonly side: 'left' | 'right';
      readonly rows: readonly { readonly name: string; readonly score: number }[];
    }>();
  });
});

describe('defineTemplate', () => {
  it('rejects ids that are not kebab-case', () => {
    expect(() => defineTemplate({ ...sample, id: 'Sample Card' })).toThrow(/kebab-case/);
  });

  it('rejects a minimum duration above the duration', () => {
    expect(() => defineTemplate({ ...sample, minDuration: 5 })).toThrow(/minDuration/);
  });
});

describe('resolveFields', () => {
  it('uses defaults, computed for the platform', () => {
    expect(resolveFields(sample, {}, ctx)).toEqual({
      title: 'Hello',
      count: 3,
      color: '#ffffff',
      on: true,
      side: 'right',
      rows: [{ name: 'A', score: 1 }],
    });
    expect(resolveFields(sample, {}, { ...ctx, platform: 'tiktok' }).on).toBe(false);
  });

  it('applies valid overrides and clamps them', () => {
    const v = resolveFields(sample, { title: 'Pixcue Studio', count: 99, side: 'left' }, ctx);
    expect(v).toMatchObject({ title: 'Pixcu', count: 10, side: 'left' });
  });

  it('falls back to defaults for invalid values from untrusted input', () => {
    const v = resolveFields(
      sample,
      {
        title: { toString: () => 'x' },
        count: Number.NaN,
        color: 'javascript:alert(1)',
        on: 'yes',
        side: 'up',
        rows: [{ name: 'B' }],
        __proto__: { polluted: true },
      },
      ctx,
    );
    expect(v).toEqual(resolveFields(sample, {}, ctx));
    expect(Object.hasOwn(v, 'polluted')).toBe(false);
  });

  it('validates list items and caps their number', () => {
    const rows = [
      { name: 'Long name', score: 20 },
      { name: 'B', score: -1 },
      { name: 'C', score: 5 },
    ];
    expect(coerceValue(fields.rows, rows)).toEqual([
      { name: 'Long', score: 10 },
      { name: 'B', score: 0 },
    ]);
  });
});

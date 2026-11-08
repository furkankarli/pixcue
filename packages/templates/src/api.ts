/**
 * The template API: a template declares its fields (the editor builds its form
 * from them), its timing, its default position and its drawing code.
 */
import type { Frame, Platform, Position, Scene, SoundCue } from '@pixcue/engine';
import type { LocaleCode, MessageKey, Translate } from '@pixcue/i18n';

/** What dynamic defaults can depend on. */
export interface DefaultContext {
  readonly t: Translate;
  readonly locale: LocaleCode;
  readonly platform: Platform;
}

/** A default value, or a function computing it from the locale and platform. */
export type Default<T> = T | ((ctx: DefaultContext) => T);

interface FieldBase<T> {
  readonly label: MessageKey;
  readonly help?: MessageKey | undefined;
  readonly default: Default<T>;
}

export interface TextField extends FieldBase<string> {
  readonly type: 'text';
  readonly maxLength: number;
}

export interface LongTextField extends FieldBase<string> {
  readonly type: 'longText';
  readonly maxLength: number;
}

export interface NumberField extends FieldBase<number> {
  readonly type: 'number';
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface ColorField extends FieldBase<string> {
  readonly type: 'color';
}

export interface BooleanField extends FieldBase<boolean> {
  readonly type: 'boolean';
}

export interface SelectOption<V extends string> {
  readonly value: V;
  readonly label: MessageKey;
}

export interface SelectField<V extends string = string> extends FieldBase<V> {
  readonly type: 'select';
  readonly options: readonly SelectOption<V>[];
}

export interface TextItemField {
  readonly type: 'text';
  readonly label: MessageKey;
  readonly maxLength: number;
}

export interface NumberItemField {
  readonly type: 'number';
  readonly label: MessageKey;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** A column of a list item: short text or a number. */
export type ItemField = TextItemField | NumberItemField;

export type ItemSchema = Readonly<Record<string, ItemField>>;

export type ItemValues<I extends ItemSchema> = {
  readonly [K in keyof I]: I[K] extends { readonly type: 'number' } ? number : string;
};

export interface ListField<I extends ItemSchema = ItemSchema>
  extends FieldBase<readonly ItemValues<I>[]> {
  readonly type: 'list';
  readonly item: I;
  readonly min: number;
  readonly max: number;
}

export type Field =
  | TextField
  | LongTextField
  | NumberField
  | ColorField
  | BooleanField
  | SelectField
  | ListField;

export type FieldSchema = Readonly<Record<string, Field>>;

export type FieldValue<F extends Field> =
  F extends ListField<infer I>
    ? readonly ItemValues<I>[]
    : F extends SelectField<infer V>
      ? V
      : F extends NumberField
        ? number
        : F extends BooleanField
          ? boolean
          : string;

export type FieldValues<S extends FieldSchema> = { readonly [K in keyof S]: FieldValue<S[K]> };

type Options<F> = Omit<F, 'type'>;

/** Builders that fill in sensible limits, so templates only state what matters. */
export const field = {
  text: (o: Omit<Options<TextField>, 'maxLength'> & { maxLength?: number }): TextField => ({
    maxLength: 80,
    ...o,
    type: 'text',
  }),
  longText: (
    o: Omit<Options<LongTextField>, 'maxLength'> & { maxLength?: number },
  ): LongTextField => ({
    maxLength: 400,
    ...o,
    type: 'longText',
  }),
  number: (o: Omit<Options<NumberField>, 'step'> & { step?: number }): NumberField => ({
    step: 1,
    ...o,
    type: 'number',
  }),
  color: (o: Options<ColorField>): ColorField => ({ ...o, type: 'color' }),
  boolean: (o: Options<BooleanField>): BooleanField => ({ ...o, type: 'boolean' }),
  select: <const V extends string>(o: {
    label: MessageKey;
    help?: MessageKey;
    options: readonly SelectOption<V>[];
    default: Default<NoInfer<V>>;
  }): SelectField<V> => ({ ...o, type: 'select' }),
  list: <const I extends ItemSchema>(o: {
    label: MessageKey;
    help?: MessageKey;
    item: I;
    min?: number;
    max?: number;
    default: Default<readonly ItemValues<NoInfer<I>>[]>;
  }): ListField<I> => ({ min: 0, max: 8, ...o, type: 'list' }),
  /** Column builders for list items. */
  item: {
    text: (label: MessageKey, maxLength = 60): TextItemField => ({
      type: 'text',
      label,
      maxLength,
    }),
    number: (label: MessageKey, min: number, max: number, step = 1): NumberItemField => ({
      type: 'number',
      label,
      min,
      max,
      step,
    }),
  },
} as const;

export interface TemplateDefinition<S extends FieldSchema> {
  /** Stable, kebab-case id; used in URLs and saved presets. */
  readonly id: string;
  readonly name: MessageKey;
  /** Default clip length in seconds. */
  readonly duration: number;
  /** Shortest length the animation still works at. */
  readonly minDuration: number;
  /** Default anchor; may depend on the frame (e.g. centered in vertical video). */
  readonly position: Position | ((frame: Frame) => Position);
  readonly fields: S;
  readonly render: Scene<FieldValues<S>>;
  /** Sound effects in time with the animation (played only when sound is on). */
  // Method syntax, like `render`, so a template still fits `Template` with its own fields.
  sounds?(args: SoundArgs<FieldValues<S>>): readonly SoundCue[];
}

/** What a template's sound cues may depend on. */
export interface SoundArgs<F> {
  readonly fields: F;
  readonly duration: number;
  readonly frame: Frame;
  /** The pixel theme types its text in; the others reveal it. */
  readonly pixel: boolean;
}

export type Template<S extends FieldSchema = FieldSchema> = TemplateDefinition<S>;

/** Declares a template. Checks the timing so mistakes fail at import time. */
export function defineTemplate<const S extends FieldSchema>(
  definition: TemplateDefinition<S>,
): Template<S> {
  const { id, duration, minDuration } = definition;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))
    throw new Error(`Template id "${id}" must be kebab-case`);
  if (!(minDuration > 0 && minDuration <= duration)) {
    throw new Error(`Template "${id}": need 0 < minDuration <= duration`);
  }
  return definition;
}

/** The default anchor of a template in a given frame. */
export function defaultPosition(template: Template, frame: Frame): Position {
  return typeof template.position === 'function' ? template.position(frame) : template.position;
}

export function defaultValue<F extends Field>(f: F, ctx: DefaultContext): FieldValue<F> {
  const d = f.default as Default<FieldValue<F>>;
  return (
    typeof d === 'function' ? (d as (c: DefaultContext) => FieldValue<F>)(ctx) : d
  ) as FieldValue<F>;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function coerceNumber(v: unknown, f: { min: number; max: number }): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  return Math.min(f.max, Math.max(f.min, v));
}

function coerceItem(v: unknown, schema: ItemSchema): Record<string, string | number> | undefined {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined;
  const out: Record<string, string | number> = {};
  for (const [key, col] of Object.entries(schema)) {
    const raw = (v as Record<string, unknown>)[key];
    if (col.type === 'number') {
      const n = coerceNumber(raw, col);
      if (n === undefined) return undefined;
      out[key] = n;
    } else {
      if (typeof raw !== 'string') return undefined;
      out[key] = raw.slice(0, col.maxLength);
    }
  }
  return out;
}

/** Validates one value against its field; `undefined` means "invalid, use the default". */
export function coerceValue(f: Field, v: unknown): unknown {
  switch (f.type) {
    case 'text':
    case 'longText':
      return typeof v === 'string' ? v.slice(0, f.maxLength) : undefined;
    case 'number':
      return coerceNumber(v, f);
    case 'color':
      return typeof v === 'string' && HEX_COLOR.test(v) ? v : undefined;
    case 'boolean':
      return typeof v === 'boolean' ? v : undefined;
    case 'select':
      return f.options.some((o) => o.value === v) ? v : undefined;
    case 'list': {
      if (!Array.isArray(v) || v.length < f.min) return undefined;
      const items = v.slice(0, f.max).map((item) => coerceItem(item, f.item));
      return items.every((i) => i !== undefined) ? items : undefined;
    }
  }
}

/**
 * The values a template renders with: defaults for the locale and platform,
 * overridden by what the user changed. Every override is validated, so values
 * from a shared link or old saved preset can never break rendering.
 */
export function resolveFields<S extends FieldSchema>(
  template: Template<S>,
  overrides: Readonly<Record<string, unknown>>,
  ctx: DefaultContext,
): FieldValues<S> {
  const out: Record<string, unknown> = {};
  for (const [key, f] of Object.entries(template.fields)) {
    const override = Object.hasOwn(overrides, key) ? coerceValue(f, overrides[key]) : undefined;
    out[key] = override === undefined ? defaultValue(f, ctx) : override;
  }
  return out as FieldValues<S>;
}

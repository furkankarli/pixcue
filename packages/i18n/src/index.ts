/**
 * @pixcue/i18n
 *
 * Framework-free i18n shared by the studio UI and by templates (platform-aware
 * copy such as "Subscribe" / "Follow"). One file per language in `locales/`.
 *
 * Has no @pixcue dependencies.
 */
import { type LocaleCode, locales } from './locales/index.ts';
import type { MessageKey, MessageParams, MessageTree } from './types.ts';

export { defineLocale } from './define.ts';
export { type LocaleCode, locales } from './locales/index.ts';
export type { Locale, MessageKey, MessageParams, Messages } from './types.ts';

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const localeCodes = Object.keys(locales) as LocaleCode[];

export function isLocaleCode(value: string): value is LocaleCode {
  return Object.hasOwn(locales, value);
}

/**
 * Picks the best available locale for a list of preferred language tags,
 * e.g. `navigator.languages`. Exact matches win, then the base language
 * (`tr-TR` → `tr`). Falls back to English.
 */
export function detectLocale(preferred: readonly string[]): LocaleCode {
  const byLower = new Map(localeCodes.map((code) => [code.toLowerCase(), code]));
  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    const match = byLower.get(lower) ?? byLower.get(lower.split('-')[0] ?? '');
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

/** Replaces `{name}` placeholders. Unknown placeholders are left as is. */
export function interpolate(message: string, params?: MessageParams): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : whole,
  );
}

function lookup(tree: MessageTree, key: string): string | undefined {
  let node: string | MessageTree | undefined = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export type Translate = (key: MessageKey, params?: MessageParams) => string;

/**
 * Returns a translate function for one locale. Falls back to English, then to
 * the key itself, so a missing string never breaks rendering.
 */
export function createTranslator(code: LocaleCode): Translate {
  const messages: MessageTree = locales[code].messages;
  const fallback: MessageTree = locales[DEFAULT_LOCALE].messages;
  return (key, params) =>
    interpolate(lookup(messages, key) ?? lookup(fallback, key) ?? key, params);
}

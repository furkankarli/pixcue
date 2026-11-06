import type { Locale } from '../types.ts';
import en from './en.ts';
import tr from './tr.ts';

/**
 * Every available locale, keyed by its code.
 * To add a language: create `locales/<code>.ts` and register it here.
 */
export const locales = {
  en,
  tr,
} as const satisfies Record<string, Locale>;

export type LocaleCode = keyof typeof locales;

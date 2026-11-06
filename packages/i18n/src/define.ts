import type { Locale } from './types.ts';

/**
 * Declares a translation. Type-checks the messages against the English source,
 * so missing or misspelled keys fail `pnpm typecheck`.
 */
export function defineLocale(locale: Locale): Locale {
  return locale;
}

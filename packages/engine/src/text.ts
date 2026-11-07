const TURKISH_LETTERS = /[çğıöşüÇĞİÖŞÜ]/;

/**
 * Uppercases text for display. With a `locale`, uses that language's rules.
 * Without one, guesses: text containing Turkish letters uses Turkish rules, so
 * "istanbul'da" becomes "İSTANBUL'DA" while "pixcue" becomes "PIXCUE".
 */
export function upper(text: string, locale?: string): string {
  const s = String(text ?? '');
  if (locale) return s.toLocaleUpperCase(locale);
  return TURKISH_LETTERS.test(s) ? s.toLocaleUpperCase('tr-TR') : s.toUpperCase();
}

/** Splits multi-line input into trimmed, non-empty lines. */
export function lines(text: string): string[] {
  return String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Splits lines of `label | value` into pairs. Lines without `|` get an empty value. */
export function pairs(text: string): [label: string, value: string][] {
  return lines(text).map((l) => {
    const i = l.indexOf('|');
    return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  });
}

/** Parses a number typed by a user, accepting a decimal comma ("8,5"). */
export function parseNumber(text: string | number | null | undefined, fallback: number): number {
  const v = Number.parseFloat(String(text ?? '').replace(',', '.'));
  return Number.isFinite(v) ? v : fallback;
}

/**
 * Formats `value` like the user typed `raw`: same number of decimals and the
 * same decimal separator. `formatLike("8,5", 7.25)` gives `"7,3"`.
 */
export function formatLike(raw: string, value: number): string {
  const s = String(raw ?? '');
  const decimals = (s.split(/[.,]/)[1] ?? '').length;
  const separator = s.includes(',') ? ',' : '.';
  return value.toFixed(decimals).replace('.', separator);
}

/** Number of decimals in `value` as written, e.g. 2 for 8.25 and 0 for 10. */
export function decimalsOf(value: number): number {
  return (String(value).split('.')[1] ?? '').length;
}

/** Formats a number with fixed decimals in the locale's style ("8,5" in Turkish). */
export function formatNumber(value: number, decimals: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  }).format(value);
}

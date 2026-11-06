import {
  createTranslator,
  detectLocale,
  isLocaleCode,
  type LocaleCode,
  localeCodes,
  type MessageKey,
  type MessageParams,
  type Translate,
} from '@pixcue/i18n';
import { createSignal } from 'solid-js';

const STORAGE_KEY = 'pixcue.locale';

function initialLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLocaleCode(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
  return detectLocale(navigator.languages);
}

const translators = Object.fromEntries(
  localeCodes.map((code) => [code, createTranslator(code)]),
) as Record<LocaleCode, Translate>;

const [locale, setLocaleSignal] = createSignal<LocaleCode>(initialLocale());

export { locale };

export function setLocale(code: LocaleCode): void {
  setLocaleSignal(code);
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not persisted; the choice still applies for this session.
  }
}

/** Reactive translate: re-runs wherever it is read when the locale changes. */
export function t(key: MessageKey, params?: MessageParams): string {
  return translators[locale()](key, params);
}

import { isLocaleCode, localeCodes, locales } from '@pixcue/i18n';
import { For } from 'solid-js';
import { locale, setLocale, t } from '../i18n.ts';

export function LanguagePicker() {
  return (
    <label class="language-picker">
      <span class="visually-hidden">{t('settings.language')}</span>
      <select
        value={locale()}
        onChange={(e) => {
          const v = e.currentTarget.value;
          if (isLocaleCode(v)) setLocale(v);
        }}
      >
        <For each={localeCodes}>{(code) => <option value={code}>{locales[code].name}</option>}</For>
      </select>
    </label>
  );
}

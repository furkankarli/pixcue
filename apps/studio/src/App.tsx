import { type LocaleCode, localeCodes, locales } from '@pixcue/i18n';
import { createEffect, For } from 'solid-js';
import { locale, setLocale, t } from './i18n.ts';

export function App() {
  createEffect(() => {
    document.documentElement.lang = locale();
  });

  return (
    <main class="shell">
      <h1 class="wordmark">Pixcue</h1>
      <p class="tagline">{t('app.tagline')}</p>
      <p class="status">{t('app.comingSoon')}</p>

      <label class="language">
        <span>{t('settings.language')}</span>
        <select
          value={locale()}
          onChange={(event) => setLocale(event.currentTarget.value as LocaleCode)}
        >
          <For each={localeCodes}>
            {(code) => <option value={code}>{locales[code].name}</option>}
          </For>
        </select>
      </label>
    </main>
  );
}

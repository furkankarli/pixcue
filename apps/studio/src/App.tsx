import { createEffect } from 'solid-js';
import { FormatPicker } from './components/FormatPicker.tsx';
import { LanguagePicker } from './components/LanguagePicker.tsx';
import { Stage } from './components/Stage.tsx';
import { Transport } from './components/Transport.tsx';
import { locale, t } from './i18n.ts';

export function App() {
  createEffect(() => {
    document.documentElement.lang = locale();
  });

  return (
    <div class="app">
      <header class="topbar">
        <span class="brand">Pixcue</span>
        <FormatPicker />
        <div class="topbar-actions">
          <LanguagePicker />
        </div>
      </header>
      <main class="workspace">
        <section class="stage-column" aria-label={t('editor.stage.label')}>
          <Stage />
          <Transport />
          <p class="hint">{t('editor.stage.dragHint')}</p>
        </section>
      </main>
    </div>
  );
}

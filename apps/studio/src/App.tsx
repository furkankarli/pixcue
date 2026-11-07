import { createEffect, Show } from 'solid-js';
import { FormatPicker } from './components/FormatPicker.tsx';
import { Inspector } from './components/Inspector.tsx';
import { LanguagePicker } from './components/LanguagePicker.tsx';
import { Library } from './components/Library.tsx';
import { Stage } from './components/Stage.tsx';
import { Transport } from './components/Transport.tsx';
import { locale, t } from './i18n.ts';
import { wide } from './media.ts';

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
        <Show when={wide()}>
          <aside class="side-panel library-panel" aria-label={t('editor.tabs.templates')}>
            <h2 class="panel-title">{t('editor.tabs.templates')}</h2>
            <Library />
          </aside>
        </Show>
        <section class="stage-column" aria-label={t('editor.stage.label')}>
          <Stage />
          <Transport />
          <p class="hint">{t('editor.stage.dragHint')}</p>
        </section>
        <aside class="side-panel inspector-panel">
          <Inspector
            tabs={
              wide() ? ['content', 'style', 'layout'] : ['templates', 'content', 'style', 'layout']
            }
          />
        </aside>
      </main>
    </div>
  );
}

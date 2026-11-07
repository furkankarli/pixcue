import { createEffect, createSignal, Show } from 'solid-js';
import { ExportDialog } from './components/ExportDialog.tsx';
import { FormatPicker } from './components/FormatPicker.tsx';
import { Inspector } from './components/Inspector.tsx';
import { LanguagePicker } from './components/LanguagePicker.tsx';
import { Library } from './components/Library.tsx';
import { Stage } from './components/Stage.tsx';
import { Transport } from './components/Transport.tsx';
import { locale, t } from './i18n.ts';
import { wide } from './media.ts';
import { DownloadIcon } from './ui/icons.tsx';

export function App() {
  const [exporting, setExporting] = createSignal(false);
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
          <button type="button" class="button primary" onClick={() => setExporting(true)}>
            <DownloadIcon />
            {t('editor.topbar.export')}
          </button>
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
      <ExportDialog open={exporting()} onClose={() => setExporting(false)} />
    </div>
  );
}

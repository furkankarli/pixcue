/**
 * The editor shell: a top bar, the template library, the stage with its
 * toolbar, the inspector, the timeline, and a status bar along the bottom. On narrow
 * screens the panels stack and the library becomes an inspector tab.
 */
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { ExportDialog } from './components/ExportDialog.tsx';
import { Inspector } from './components/Inspector.tsx';
import { Library } from './components/Library.tsx';
import { PresetsDialog } from './components/PresetsDialog.tsx';
import { ShareButton } from './components/ShareButton.tsx';
import { Stage } from './components/Stage.tsx';
import { StageToolbar } from './components/StageToolbar.tsx';
import { StatusBar } from './components/StatusBar.tsx';
import { Timeline } from './components/Timeline.tsx';
import { Transport } from './components/Transport.tsx';
import { locale, t } from './i18n.ts';
import { wide } from './media.ts';
import { togglePlay } from './playback.ts';
import { BookmarkIcon, DownloadIcon } from './ui/icons.tsx';
import { PixelWordmark } from './ui/PixelWordmark.tsx';

/** Whether a key press belongs to a control that uses the key itself. */
const ownsKeys = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest('input, textarea, select, button, [role="slider"], [role="tab"], dialog') !==
      null);

export function App() {
  const [exporting, setExporting] = createSignal(false);
  const [presetsOpen, setPresetsOpen] = createSignal(false);
  createEffect(() => {
    document.documentElement.lang = locale();
  });

  // Space plays and pauses, as in every video editor.
  const onKey = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || e.repeat || ownsKeys(e.target)) return;
    if (exporting() || presetsOpen()) return;
    e.preventDefault();
    togglePlay();
  };
  document.addEventListener('keydown', onKey);
  onCleanup(() => document.removeEventListener('keydown', onKey));

  return (
    <div class="app">
      <header class="topbar">
        <h1 class="brand">
          <PixelWordmark />
        </h1>
        <div class="topbar-actions">
          <ShareButton />
          <button
            type="button"
            class="button ghost responsive"
            onClick={() => setPresetsOpen(true)}
            aria-label={t('editor.topbar.presets')}
          >
            <BookmarkIcon />
            <span class="button-label">{t('editor.topbar.presets')}</span>
          </button>
          <button type="button" class="button primary" onClick={() => setExporting(true)}>
            <DownloadIcon />
            {t('editor.topbar.export')}
          </button>
        </div>
      </header>

      <main class="workspace">
        <Show when={wide()}>
          <aside class="panel library-panel" aria-labelledby="library-title">
            <h2 class="panel-title" id="library-title">
              {t('editor.tabs.templates')}
            </h2>
            <div class="panel-scroll">
              <Library />
            </div>
          </aside>
        </Show>

        <section class="stage-column" aria-label={t('editor.stage.label')}>
          <StageToolbar />
          <Stage hintId="stage-hint" />
          <Transport hintId="stage-hint" />
        </section>

        <Timeline />

        <aside class="panel inspector-panel">
          <Inspector
            tabs={
              wide() ? ['content', 'style', 'layout'] : ['templates', 'content', 'style', 'layout']
            }
          />
        </aside>
      </main>

      <StatusBar />
      <ExportDialog open={exporting()} onClose={() => setExporting(false)} />
      <PresetsDialog open={presetsOpen()} onClose={() => setPresetsOpen(false)} />
    </div>
  );
}

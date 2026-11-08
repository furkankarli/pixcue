/**
 * The editor shell. Wide screens: the template library, the stage and the
 * inspector side by side, with the timeline below. Phones: the stage fills
 * the screen and a bar of tools along the bottom opens one panel at a time.
 * Both share the top bar: format, name, menu and Export.
 */
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { ExportDialog } from './components/ExportDialog.tsx';
import { Inspector } from './components/Inspector.tsx';
import { Library } from './components/Library.tsx';
import { MobileTools } from './components/MobileTools.tsx';
import { PresetsDialog } from './components/PresetsDialog.tsx';
import { Stage } from './components/Stage.tsx';
import { Timeline } from './components/Timeline.tsx';
import { TopBar } from './components/TopBar.tsx';
import { Transport } from './components/Transport.tsx';
import { locale, t } from './i18n.ts';
import { wide } from './media.ts';
import { togglePlay } from './playback.ts';
import { Toast } from './ui/toast.tsx';

/** Whether a key press belongs to a control that uses the key itself. */
const ownsKeys = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest(
      'input, textarea, select, button, [role="slider"], [role="tab"], [role="application"], dialog, [popover]',
    ) !== null);

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

  const stage = (
    <section class="stage-column" aria-label={t('editor.stage.label')}>
      <Stage hintId="stage-hint" />
      <Transport hintId="stage-hint" />
    </section>
  );

  return (
    <div class="app" classList={{ phone: !wide() }}>
      <TopBar onExport={() => setExporting(true)} onPresets={() => setPresetsOpen(true)} />

      <Show
        when={wide()}
        fallback={
          <main class="workspace phone">
            {stage}
            <MobileTools />
          </main>
        }
      >
        <main class="workspace">
          <aside class="panel library-panel" aria-labelledby="library-title">
            <h2 class="panel-title" id="library-title">
              {t('editor.tabs.templates')}
            </h2>
            <div class="panel-scroll">
              <Library />
            </div>
          </aside>
          {stage}
          <Timeline />
          <aside class="panel inspector-panel">
            <Inspector tabs={['content', 'style', 'layout']} />
          </aside>
        </main>
      </Show>

      <Toast />
      <ExportDialog open={exporting()} onClose={() => setExporting(false)} />
      <PresetsDialog open={presetsOpen()} onClose={() => setPresetsOpen(false)} />
    </div>
  );
}

/**
 * Export: asks which editor the user has, recommends the format that imports
 * cleanly there, explains in two lines how to use it, then renders the file.
 */
import {
  EDITOR_IDS,
  EDITORS,
  type EditorId,
  type ExportFormat,
  KEY_COLORS,
  type KeyColor,
  needsVideoEncoder,
  RENDER_SHARE,
} from '@pixcue/export';
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { canShareFile, download, shareFile } from '../files.ts';
import { t } from '../i18n.ts';
import { touchDevice } from '../idle.ts';
import { keyConflict } from '../key-conflict.ts';
import { FRAME_RATES } from '../state/editor-state.ts';
import { actions, duration, state } from '../store.ts';
import { Segmented, Switch } from '../ui/controls.tsx';
import { CloseIcon, DownloadIcon, ShareIcon } from '../ui/icons.tsx';

const EDITOR_KEY = 'pixcue.editor.v1';
const hasVideoEncoder = typeof window !== 'undefined' && 'VideoEncoder' in window;

/** Key colors to try, in order, when picking one the graphic does not use. */
const KEY_ORDER: readonly KeyColor[] = ['green', 'blue', 'magenta'];

function savedEditor(): EditorId {
  try {
    const v = localStorage.getItem(EDITOR_KEY);
    if (v && (EDITOR_IDS as string[]).includes(v)) return v as EditorId;
  } catch {
    // Use the default below.
  }
  // On a phone the file is for a phone editor.
  return touchDevice ? 'capcut-mobile' : 'davinci';
}

type Status =
  | { kind: 'idle' }
  | { kind: 'running'; progress: number }
  | { kind: 'done'; file: File }
  | { kind: 'error'; message: string };

export function ExportDialog(props: { open: boolean; onClose: () => void }) {
  let dialog!: HTMLDialogElement;
  const [editor, setEditor] = createSignal<EditorId>(savedEditor());
  const [format, setFormat] = createSignal<ExportFormat>(EDITORS[savedEditor()].formats[0]);
  const [keyColor, setKeyColor] = createSignal<KeyColor>('green');
  // Until someone picks a key color, use the first one the graphic leaves free.
  const [keyPicked, setKeyPicked] = createSignal(false);
  const [chromaKey, setChromaKey] = createSignal(true);
  const [status, setStatus] = createSignal<Status>({ kind: 'idle' });
  let controller: AbortController | null = null;

  createEffect(() => {
    if (props.open && !dialog.open) dialog.showModal();
    if (!props.open && dialog.open) dialog.close();
  });
  onCleanup(() => controller?.abort());

  const chooseEditor = (id: EditorId) => {
    setEditor(id);
    setFormat(EDITORS[id].formats[0]);
    setStatus({ kind: 'idle' });
    try {
      localStorage.setItem(EDITOR_KEY, id);
    } catch {
      // Remembering the choice is optional.
    }
  };

  const available = (f: ExportFormat) => hasVideoEncoder || !needsVideoEncoder(f);
  const frames = () => Math.max(1, Math.round(duration() * state.fps));
  const running = () => status().kind === 'running';
  const mobile = () => EDITORS[editor()].mobile;
  // Only checked while the chroma key MP4 is chosen; re-runs when the graphic changes.
  createEffect(() => {
    if (!props.open || format() !== 'mp4-key' || keyPicked()) return;
    setKeyColor(KEY_ORDER.find((k) => !keyConflict(k)) ?? 'green');
  });
  const conflict = createMemo(
    () => props.open && format() === 'mp4-key' && keyConflict(keyColor()),
  );

  async function start() {
    controller = new AbortController();
    setStatus({ kind: 'running', progress: 0 });
    try {
      // The pipeline (renderer loop, encoders, muxers) loads on first use.
      const { runExport } = await import('../export-job.ts');
      const file = await runExport({
        format: format(),
        keyColor: keyColor(),
        chromaKey: chromaKey(),
        signal: controller.signal,
        onProgress: (progress) => setStatus({ kind: 'running', progress }),
      });
      setStatus({ kind: 'done', file });
      // Desktop: save right away. Phones and tablets: the share sheet (with
      // "Save Video" for the gallery) needs a tap, see below.
      if (!(touchDevice && canShareFile(file))) download(file, file.name);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus({ kind: 'error', message: t('editor.export.cancelled') });
      } else {
        console.error(error);
        const message =
          // By name: importing the class would pull the encoders into the
          // first download.
          error instanceof Error && error.name === 'ExportUnsupportedError'
            ? t('editor.export.unsupported')
            : t('editor.export.failed');
        setStatus({ kind: 'error', message });
      }
    } finally {
      controller = null;
    }
  }

  const close = () => {
    controller?.abort();
    props.onClose();
  };

  const progressText = () => {
    const s = status();
    if (s.kind !== 'running') return '';
    if (s.progress >= RENDER_SHARE) return t('editor.export.packaging');
    const current = Math.min(frames(), Math.ceil((s.progress / RENDER_SHARE) * frames()));
    return t('editor.export.rendering', { current, total: frames() });
  };

  return (
    <dialog
      ref={dialog}
      class="dialog dialog-export"
      aria-labelledby="export-title"
      onClose={close}
      onCancel={(e) => running() && e.preventDefault()}
    >
      <header class="dialog-header">
        <h2 id="export-title">{t('editor.export.title')}</h2>
        <button
          type="button"
          class="icon-button ghost"
          onClick={close}
          aria-label={t('editor.export.close')}
        >
          <CloseIcon />
        </button>
      </header>

      <div class="dialog-body">
        <fieldset class="group" disabled={running()}>
          <legend class="field-label">{t('editor.export.editorQuestion')}</legend>
          <div class="choice-grid">
            <For each={EDITOR_IDS}>
              {(id) => (
                <label class="choice">
                  <input
                    type="radio"
                    name="editor"
                    checked={editor() === id}
                    onChange={() => chooseEditor(id)}
                  />
                  <span>{t(`editor.export.editors.${id}`)}</span>
                </label>
              )}
            </For>
          </div>
        </fieldset>

        <aside class="how-to">
          <p>{t(`editor.export.howTo.${editor()}.import`)}</p>
          <p>{t(`editor.export.howTo.${editor()}.use`)}</p>
        </aside>

        <fieldset class="group" disabled={running()}>
          <legend class="field-label">{t('editor.export.format')}</legend>
          <div class="format-list">
            <For each={EDITORS[editor()].formats}>
              {(f, i) => (
                <label class="format-option" classList={{ unavailable: !available(f) }}>
                  <input
                    type="radio"
                    name="format"
                    checked={format() === f}
                    disabled={!available(f)}
                    onChange={() => setFormat(f)}
                  />
                  <span class="format-text">
                    <strong>
                      {t(`editor.export.formats.${f}.name`)}
                      <Show when={i() === 0}>
                        <span class="badge">{t('editor.export.recommended')}</span>
                      </Show>
                    </strong>
                    <span>
                      {available(f)
                        ? t(`editor.export.formats.${f}.description`)
                        : t('editor.export.unsupported')}
                    </span>
                  </span>
                </label>
              )}
            </For>
          </div>
          <Show when={format() !== 'mp4-key' && !mobile()}>
            <p class="field-help">{t('editor.export.phoneHint')}</p>
          </Show>
        </fieldset>

        <Show when={format() === 'mp4-key'}>
          <div class="group">
            <span class="field-label">{t('editor.export.keyColor')}</span>
            <Segmented
              label={t('editor.export.keyColor')}
              value={keyColor()}
              onChange={(k) => {
                setKeyPicked(true);
                setKeyColor(k);
              }}
              options={(Object.keys(KEY_COLORS) as KeyColor[]).map((k) => ({
                value: k,
                label: t(`editor.export.keyColors.${k}`),
              }))}
            />
            <Show when={conflict()}>
              <p class="warning" role="status">
                {t('editor.export.keyConflict')}
              </p>
            </Show>
            <Switch
              label={t('editor.export.chromaMode')}
              checked={chromaKey()}
              onChange={setChromaKey}
            />
            <p class="field-help">{t('editor.export.chromaModeHelp')}</p>
          </div>
        </Show>

        <div class="group">
          <span class="field-label">{t('editor.export.frameRate')}</span>
          <Segmented
            label={t('editor.export.frameRate')}
            value={state.fps}
            onChange={actions.setFps}
            options={FRAME_RATES.map((fps) => ({
              value: fps,
              label: t('editor.export.fps', { fps }),
            }))}
          />
        </div>
      </div>

      <footer class="dialog-footer">
        <div class="export-status" role="status" aria-live="polite">
          <Show when={status().kind === 'running'}>
            <progress max={1} value={(status() as { progress: number }).progress} />
            <span>{progressText()}</span>
          </Show>
          <Show when={status().kind === 'done' && (status() as { file: File }).file}>
            {(file) => (
              <span>
                {t('editor.export.done', { file: file().name })}
                <Show when={touchDevice && canShareFile(file())}>
                  {' '}
                  {t('editor.export.shareHint')}
                </Show>
              </span>
            )}
          </Show>
          <Show when={status().kind === 'error'}>
            <span class="error">{(status() as { message: string }).message}</span>
          </Show>
        </div>
        <div class="dialog-actions">
          <Show
            when={running()}
            fallback={
              <Show
                when={status().kind === 'done' && (status() as { file: File }).file}
                fallback={
                  <button
                    type="button"
                    class="button primary"
                    disabled={!available(format())}
                    onClick={start}
                  >
                    <DownloadIcon />
                    {t('editor.export.start')}
                  </button>
                }
              >
                {(file) => (
                  <>
                    <Show when={touchDevice && canShareFile(file())}>
                      <button
                        type="button"
                        class="button primary"
                        onClick={async () => {
                          if (!(await shareFile(file()))) download(file(), file().name);
                        }}
                      >
                        <ShareIcon />
                        {t('editor.export.share')}
                      </button>
                    </Show>
                    <button
                      type="button"
                      class="button"
                      onClick={() => download(file(), file().name)}
                    >
                      <DownloadIcon />
                      {touchDevice ? t('editor.export.saveToFiles') : t('editor.export.download')}
                    </button>
                  </>
                )}
              </Show>
            }
          >
            <button type="button" class="button" onClick={() => controller?.abort()}>
              {t('editor.export.cancel')}
            </button>
          </Show>
        </div>
      </footer>
    </dialog>
  );
}

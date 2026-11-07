/** Saved setups: name the current graphic and bring it back later (this browser only). */
import { createEffect, createSignal, createUniqueId, For, Show } from 'solid-js';
import { locale, t } from '../i18n.ts';
import {
  deletePreset,
  loadPresets,
  presetState,
  type SavedPreset,
  savePreset,
} from '../state/presets.ts';
import { loadState, state, template } from '../store.ts';
import { CloseIcon, TrashIcon } from '../ui/icons.tsx';

export function PresetsDialog(props: { open: boolean; onClose: () => void }) {
  let dialog!: HTMLDialogElement;
  const nameId = createUniqueId();
  const [presets, setPresets] = createSignal<SavedPreset[]>([]);
  const [name, setName] = createSignal('');
  const [note, setNote] = createSignal('');

  createEffect(() => {
    if (props.open && !dialog.open) {
      setPresets(loadPresets());
      setNote('');
      dialog.showModal();
    }
    if (!props.open && dialog.open) dialog.close();
  });

  const save = (e: SubmitEvent) => {
    e.preventDefault();
    const label = name().trim() || t(template().name);
    const before = loadPresets().length;
    const next = savePreset(label, state);
    setPresets(next);
    setName('');
    setNote(
      loadPresets().length > before ? t('editor.presets.saved') : t('editor.presets.unavailable'),
    );
  };

  const date = (ms: number) =>
    new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(ms);

  return (
    <dialog
      ref={dialog}
      class="dialog dialog-small"
      aria-labelledby="presets-title"
      onClose={props.onClose}
    >
      <header class="dialog-header">
        <h2 id="presets-title">{t('editor.presets.title')}</h2>
        <button
          type="button"
          class="icon-button ghost"
          onClick={props.onClose}
          aria-label={t('editor.export.close')}
        >
          <CloseIcon />
        </button>
      </header>
      <div class="dialog-body">
        <form class="preset-form" onSubmit={save}>
          <label class="visually-hidden" for={nameId}>
            {t('editor.presets.name')}
          </label>
          <input
            id={nameId}
            class="input"
            maxLength={60}
            placeholder={t('editor.presets.namePlaceholder')}
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <button type="submit" class="button primary">
            {t('editor.presets.save')}
          </button>
        </form>
        <p class="field-help" role="status" aria-live="polite">
          {note()}
        </p>
        <Show
          when={presets().length}
          fallback={<p class="field-help">{t('editor.presets.empty')}</p>}
        >
          <ul class="preset-list">
            <For each={presets()}>
              {(p) => (
                <li>
                  <button
                    type="button"
                    class="preset-load"
                    aria-label={t('editor.presets.load', { name: p.name })}
                    onClick={() => {
                      loadState(presetState(p));
                      props.onClose();
                    }}
                  >
                    <strong>{p.name}</strong>
                    <span>{date(p.savedAt)}</span>
                  </button>
                  <button
                    type="button"
                    class="icon-button ghost small"
                    aria-label={t('editor.presets.delete', { name: p.name })}
                    onClick={() => setPresets(deletePreset(p.id))}
                  >
                    <TrashIcon />
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </dialog>
  );
}

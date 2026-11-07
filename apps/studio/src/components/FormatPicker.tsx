import { createFrame, type FramePresetId, isFramePresetId } from '@pixcue/engine';
import { createEffect, createUniqueId, For } from 'solid-js';
import { t } from '../i18n.ts';
import { actions, state } from '../store.ts';

const GROUPS: readonly { key: 'horizontal' | 'vertical' | 'feed'; presets: FramePresetId[] }[] = [
  { key: 'horizontal', presets: ['youtube', 'youtube-4k'] },
  { key: 'vertical', presets: ['shorts', 'tiktok', 'reels', 'vertical'] },
  { key: 'feed', presets: ['instagram-post', 'square'] },
];

/** Video format: a native select, which is the most usable control on phones. */
export function FormatPicker() {
  return (
    <label class="format-picker">
      <span class="visually-hidden">{t('editor.topbar.format')}</span>
      <select
        value={state.preset}
        onChange={(e) => {
          const v = e.currentTarget.value;
          if (isFramePresetId(v)) actions.setPreset(v);
        }}
      >
        <For each={GROUPS}>
          {(group) => (
            <optgroup label={t(`editor.formats.groups.${group.key}`)}>
              <For each={group.presets}>
                {(p) => <option value={p}>{t(`editor.formats.${p}`)}</option>}
              </For>
            </optgroup>
          )}
        </For>
      </select>
    </label>
  );
}

/**
 * Video format as a row of chips, for phones: every platform is one tap away
 * and the row scrolls sideways. Each chip shows the frame's shape.
 */
export function FormatChips() {
  const name = createUniqueId();
  let row!: HTMLFieldSetElement;
  // Bring the chosen chip into view, including after a link sets the format.
  createEffect(() => {
    state.preset;
    row.querySelector('input:checked')?.closest('label')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  });
  return (
    <fieldset class="format-chips" ref={row}>
      <legend class="visually-hidden">{t('editor.topbar.format')}</legend>
      <For each={GROUPS.flatMap((g) => g.presets)}>
        {(p) => {
          const f = createFrame(p);
          const long = 14;
          const ratio = f.width / f.height;
          const w = ratio >= 1 ? long : Math.round(long * ratio);
          const h = ratio >= 1 ? Math.round(long / ratio) : long;
          return (
            <label class="format-chip">
              <input
                type="radio"
                name={name}
                checked={state.preset === p}
                onChange={() => actions.setPreset(p)}
              />
              <span class="format-shape" style={{ width: `${w}px`, height: `${h}px` }} />
              {t(`editor.formats.${p}`)}
            </label>
          );
        }}
      </For>
    </fieldset>
  );
}

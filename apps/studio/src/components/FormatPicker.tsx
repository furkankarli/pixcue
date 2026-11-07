import { type FramePresetId, isFramePresetId } from '@pixcue/engine';
import { For } from 'solid-js';
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

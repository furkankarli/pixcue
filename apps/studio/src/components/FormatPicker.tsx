/**
 * The video format, chosen from a list where each option shows its frame's
 * shape. Wide screens open it as a menu by the preview; phones as a tool.
 */
import { createFrame, type FramePresetId } from '@pixcue/engine';
import { createUniqueId, For } from 'solid-js';
import { t } from '../i18n.ts';
import { actions, state } from '../store.ts';
import { ChevronDownIcon } from '../ui/icons.tsx';
import { Menu, useCloseMenu } from '../ui/Menu.tsx';

const GROUPS: readonly { key: 'horizontal' | 'vertical' | 'feed'; presets: FramePresetId[] }[] = [
  { key: 'horizontal', presets: ['youtube', 'youtube-4k'] },
  { key: 'vertical', presets: ['shorts', 'tiktok', 'reels', 'vertical'] },
  { key: 'feed', presets: ['instagram-post', 'square'] },
];

/** A small outline with the frame's proportions, `long` pixels on its long side. */
export function FrameShape(props: { preset: FramePresetId; long?: number }) {
  const size = () => {
    const f = createFrame(props.preset);
    const long = props.long ?? 14;
    const ratio = f.width / f.height;
    return ratio >= 1
      ? { w: long, h: Math.round(long / ratio) }
      : { w: Math.round(long * ratio), h: long };
  };
  return (
    <span
      class="format-shape"
      style={{ width: `${size().w}px`, height: `${size().h}px` }}
      aria-hidden="true"
    />
  );
}

/** Every format as a radio list, grouped by orientation. */
export function FormatOptions() {
  const name = createUniqueId();
  const close = useCloseMenu();
  return (
    <div class="format-options">
      <For each={GROUPS}>
        {(group) => (
          <fieldset class="format-group">
            <legend class="format-group-title">{t(`editor.formats.groups.${group.key}`)}</legend>
            <For each={group.presets}>
              {(p) => (
                <label class="format-choice">
                  <input
                    type="radio"
                    name={name}
                    checked={state.preset === p}
                    onChange={() => {
                      actions.setPreset(p);
                      close();
                    }}
                  />
                  <span class="format-choice-shape">
                    <FrameShape preset={p} long={16} />
                  </span>
                  {t(`editor.formats.${p}`)}
                </label>
              )}
            </For>
          </fieldset>
        )}
      </For>
    </div>
  );
}

/** The format as a dropdown, for wide screens. */
export function FormatMenu(props: { up?: boolean }) {
  return (
    <Menu
      // The visible name comes first, so speech and voice control match it.
      label={`${t(`editor.formats.${state.preset}`)} – ${t('editor.topbar.format')}`}
      class="button ghost format-button"
      align="end"
      up={props.up}
      trigger={
        <>
          <FrameShape preset={state.preset} />
          <span>{t(`editor.formats.${state.preset}`)}</span>
          <ChevronDownIcon />
        </>
      }
    >
      <FormatOptions />
    </Menu>
  );
}

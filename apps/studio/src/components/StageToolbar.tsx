/**
 * The bar above the stage: the video format on the left, preview aids on the
 * right (safe area, app buttons, stage background). Preview aids are browser
 * preferences and never change the export.
 */
import { createUniqueId, For, type JSX, Show } from 'solid-js';
import { t } from '../i18n.ts';
import { wide } from '../media.ts';
import { CheckerIcon, DarkIcon, LightIcon, PhoneIcon, SafeAreaIcon } from '../ui/icons.tsx';
import {
  platformUi,
  type StageBackground,
  safeArea,
  setPlatformUi,
  setSafeArea,
  setStageBackground,
  stageBackground,
} from '../view.ts';
import { FormatChips, FormatPicker } from './FormatPicker.tsx';

function Toggle(props: {
  label: string;
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  children: JSX.Element;
}) {
  return (
    <button
      type="button"
      class="tool-button"
      aria-pressed={props.pressed}
      title={props.label}
      onClick={() => props.onChange(!props.pressed)}
    >
      {props.children}
      <span class="tool-label">{props.label}</span>
    </button>
  );
}

const BACKGROUNDS: readonly {
  value: StageBackground;
  icon: (props: { size?: number }) => JSX.Element;
}[] = [
  { value: 'checker', icon: CheckerIcon },
  { value: 'dark', icon: DarkIcon },
  { value: 'light', icon: LightIcon },
];

/** Preview aids: safe area, app buttons and the stage background. */
export function StageTools() {
  const name = createUniqueId();
  return (
    <div class="stage-tools">
      <Toggle label={t('editor.stage.safeArea')} pressed={safeArea()} onChange={setSafeArea}>
        <SafeAreaIcon />
      </Toggle>
      <Toggle label={t('editor.stage.platformUi')} pressed={platformUi()} onChange={setPlatformUi}>
        <PhoneIcon />
      </Toggle>
      <fieldset class="icon-segmented">
        <legend class="visually-hidden">{t('editor.stage.background')}</legend>
        <For each={BACKGROUNDS}>
          {(b) => (
            <label class="icon-segment" title={t(`editor.stage.backgrounds.${b.value}`)}>
              <input
                type="radio"
                name={name}
                checked={stageBackground() === b.value}
                onChange={() => setStageBackground(b.value)}
              />
              <b.icon />
              <span class="visually-hidden">{t(`editor.stage.backgrounds.${b.value}`)}</span>
            </label>
          )}
        </For>
      </fieldset>
    </div>
  );
}

/**
 * The bar above the stage. Wide screens: the format menu and the preview
 * aids. Phones: the formats as chips; the aids move to the transport bar.
 */
export function StageToolbar() {
  return (
    <Show
      when={wide()}
      fallback={
        <div class="stage-toolbar compact">
          <FormatChips />
        </div>
      }
    >
      <div class="stage-toolbar">
        <FormatPicker />
        <StageTools />
      </div>
    </Show>
  );
}

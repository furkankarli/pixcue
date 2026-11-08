/**
 * Preview aids in one dropdown: the safe area, a mock of the app's buttons
 * and the stage background. They are browser preferences and never change
 * the export.
 */
import { createUniqueId, For, type JSX } from 'solid-js';
import { t } from '../i18n.ts';
import { Switch } from '../ui/controls.tsx';
import { CheckerIcon, DarkIcon, EyeIcon, LightIcon } from '../ui/icons.tsx';
import { Menu } from '../ui/Menu.tsx';
import {
  platformUi,
  type StageBackground,
  safeArea,
  setPlatformUi,
  setSafeArea,
  setStageBackground,
  stageBackground,
} from '../view.ts';

const BACKGROUNDS: readonly {
  value: StageBackground;
  icon: (props: { size?: number }) => JSX.Element;
}[] = [
  { value: 'checker', icon: CheckerIcon },
  { value: 'dark', icon: DarkIcon },
  { value: 'light', icon: LightIcon },
];

export function ViewMenu(props: { up?: boolean }) {
  const name = createUniqueId();
  return (
    <Menu
      label={t('editor.topbar.view')}
      class="button ghost view-button"
      align="end"
      up={props.up}
      trigger={
        <>
          <EyeIcon />
          <span class="button-label">{t('editor.topbar.view')}</span>
        </>
      }
    >
      <div class="menu-list">
        <div class="menu-row">
          <Switch label={t('editor.stage.safeArea')} checked={safeArea()} onChange={setSafeArea} />
        </div>
        <div class="menu-row">
          <Switch
            label={t('editor.stage.platformUi')}
            checked={platformUi()}
            onChange={setPlatformUi}
          />
        </div>
        <hr class="menu-divider" />
        <fieldset class="menu-row background-choice">
          <legend class="menu-legend">{t('editor.stage.background')}</legend>
          <div class="icon-segmented">
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
          </div>
        </fieldset>
      </div>
    </Menu>
  );
}

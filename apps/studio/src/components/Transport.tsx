import { createMemo } from 'solid-js';
import { locale, t } from '../i18n.ts';
import { displayTime, playing, seek, togglePlay } from '../playback.ts';
import { duration } from '../store.ts';
import { Segmented, Switch } from '../ui/controls.tsx';
import { PauseIcon, PlayIcon } from '../ui/icons.tsx';
import {
  platformUi,
  safeArea,
  setPlatformUi,
  setSafeArea,
  setStageBackground,
  stageBackground,
} from '../view.ts';

export function Transport() {
  const seconds = createMemo(
    () => new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  );
  return (
    <div class="transport">
      <div class="transport-main">
        <button
          type="button"
          class="icon-button primary"
          onClick={togglePlay}
          aria-label={playing() ? t('editor.stage.pause') : t('editor.stage.play')}
        >
          {playing() ? <PauseIcon /> : <PlayIcon />}
        </button>
        <input
          class="timeline"
          type="range"
          min={0}
          max={duration()}
          step={0.01}
          value={displayTime()}
          onInput={(e) => seek(Number(e.currentTarget.value))}
          aria-label={t('editor.stage.seek')}
        />
        <span class="time" aria-live="off">
          {t('editor.stage.time', {
            current: seconds().format(displayTime()),
            total: seconds().format(duration()),
          })}
        </span>
      </div>
      <div class="view-options">
        <Switch label={t('editor.stage.safeArea')} checked={safeArea()} onChange={setSafeArea} />
        <Switch
          label={t('editor.stage.platformUi')}
          checked={platformUi()}
          onChange={setPlatformUi}
        />
        <Segmented
          small
          label={t('editor.stage.background')}
          value={stageBackground()}
          onChange={setStageBackground}
          options={[
            { value: 'checker', label: t('editor.stage.backgrounds.checker') },
            { value: 'dark', label: t('editor.stage.backgrounds.dark') },
            { value: 'light', label: t('editor.stage.backgrounds.light') },
          ]}
        />
      </div>
    </div>
  );
}

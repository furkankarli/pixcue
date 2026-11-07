/**
 * The transport bar under the stage: the time on the left, play controls in
 * the middle, and a hint on the right, as in a video editor's monitor.
 */
import { createMemo, Show } from 'solid-js';
import { locale, t } from '../i18n.ts';
import { wide } from '../media.ts';
import { displayTime, playing, seek, togglePlay } from '../playback.ts';
import { duration } from '../store.ts';
import { PauseIcon, PlayIcon, SkipBackIcon } from '../ui/icons.tsx';
import { StageTools } from './StageToolbar.tsx';

export function Transport(props: { hintId: string }) {
  // On phones the preview aids take the hint's place; the hint stays for
  // screen readers, since it describes the stage.
  const number = createMemo(
    () => new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
  const playLabel = () => (playing() ? t('editor.stage.pause') : t('editor.stage.play'));
  return (
    <div class="transport">
      <p class="timecode" aria-live="off">
        <span class="timecode-now">{number().format(displayTime())}</span>
        <span class="timecode-total">/ {number().format(duration())}</span>
      </p>
      <div class="transport-buttons">
        <button
          type="button"
          class="icon-button ghost"
          onClick={() => seek(0)}
          aria-label={t('editor.timeline.toStart')}
          title={t('editor.timeline.toStart')}
        >
          <SkipBackIcon />
        </button>
        <button
          type="button"
          class="icon-button play"
          onClick={togglePlay}
          aria-label={playLabel()}
          aria-keyshortcuts="Space"
          title={`${playLabel()} (Space)`}
        >
          <Show when={playing()} fallback={<PlayIcon />}>
            <PauseIcon />
          </Show>
        </button>
      </div>
      <p class="transport-hint" classList={{ 'visually-hidden': !wide() }} id={props.hintId}>
        {t('editor.stage.dragHint')}
      </p>
      <Show when={!wide()}>
        <StageTools />
      </Show>
    </div>
  );
}

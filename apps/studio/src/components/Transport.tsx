/**
 * The transport bar under the stage. Wide screens: the time, play controls,
 * and the format and view menus. Phones: play, a scrubber, the time and the view menu,
 * like a video player, since the full timeline does not fit.
 */
import { createMemo, Show } from 'solid-js';
import { locale, t } from '../i18n.ts';
import { wide } from '../media.ts';
import { displayTime, playing, seek, togglePlay } from '../playback.ts';
import { duration } from '../store.ts';
import { PauseIcon, PlayIcon, SkipBackIcon } from '../ui/icons.tsx';
import { FormatMenu } from './FormatPicker.tsx';
import { ViewMenu } from './ViewMenu.tsx';

export function Transport(props: { hintId: string }) {
  const number = createMemo(
    () => new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
  const playLabel = () => (playing() ? t('editor.stage.pause') : t('editor.stage.play'));
  const time = () => (
    <p class="timecode" aria-live="off">
      <span class="timecode-now">{number().format(displayTime())}</span>
      <span class="timecode-total">/ {number().format(duration())}</span>
    </p>
  );
  const play = () => (
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
  );

  return (
    <div class="transport" classList={{ compact: !wide() }}>
      {/* Describes the stage for screen readers; the stage carries a tooltip. */}
      <p class="visually-hidden" id={props.hintId}>
        {t('editor.stage.dragHint')}
      </p>
      <Show
        when={wide()}
        fallback={
          <>
            {play()}
            <input
              class="scrubber"
              type="range"
              min={0}
              max={duration()}
              step={0.01}
              value={displayTime()}
              style={{ '--fill': `${(displayTime() / Math.max(0.01, duration())) * 100}%` }}
              aria-label={t('editor.stage.seek')}
              onInput={(e) => seek(Number(e.currentTarget.value))}
            />
            {time()}
            <ViewMenu up />
          </>
        }
      >
        {time()}
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
          {play()}
        </div>
        <div class="transport-end">
          <FormatMenu up />
          <ViewMenu up />
        </div>
      </Show>
    </div>
  );
}

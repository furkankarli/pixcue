import { POSITIONS } from '@pixcue/engine';
import { createMemo, For } from 'solid-js';
import { locale, t } from '../i18n.ts';
import { MAX_DURATION, SCALE_RANGE } from '../state/editor-state.ts';
import { actions, duration, edits, position, template } from '../store.ts';
import { Slider } from '../ui/controls.tsx';
import { ResetIcon } from '../ui/icons.tsx';

export function LayoutPanel() {
  const seconds = createMemo(() => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }));
  const percent = createMemo(() => new Intl.NumberFormat(locale(), { style: 'percent' }));
  return (
    <div class="panel-stack">
      <fieldset class="group">
        <legend class="field-label">{t('editor.layout.position')}</legend>
        <div class="position-grid">
          <For each={POSITIONS}>
            {(p) => (
              <label class="position-cell" title={t(`editor.layout.positions.${p}`)}>
                <input
                  type="radio"
                  name="position"
                  checked={position() === p}
                  onChange={() => actions.setPosition(p)}
                />
                <span class="visually-hidden">{t(`editor.layout.positions.${p}`)}</span>
              </label>
            )}
          </For>
        </div>
        <button
          type="button"
          class="button ghost"
          disabled={!edits().offset.x && !edits().offset.y}
          onClick={() => actions.resetOffset()}
        >
          <ResetIcon />
          {t('editor.layout.resetPosition')}
        </button>
        <p class="field-help">{t('editor.layout.resetHelp')}</p>
      </fieldset>

      <Slider
        label={t('editor.layout.size')}
        min={SCALE_RANGE.min}
        max={SCALE_RANGE.max}
        step={0.05}
        value={edits().scale}
        display={percent().format(edits().scale)}
        onInput={actions.setScale}
      />
      <Slider
        label={t('editor.layout.duration')}
        min={template().minDuration}
        max={MAX_DURATION}
        step={0.5}
        value={duration()}
        display={t('editor.layout.seconds', { value: seconds().format(duration()) })}
        onInput={actions.setDuration}
      />
    </div>
  );
}

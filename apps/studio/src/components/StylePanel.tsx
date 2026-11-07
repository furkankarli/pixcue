import { THEME_IDS, THEMES, type ThemeId } from '@pixcue/engine';
import { createUniqueId, For, Show } from 'solid-js';
import { FONTS } from '../fonts.ts';
import { t } from '../i18n.ts';
import { actions, state, theme } from '../store.ts';

/** Quick accent choices; any color can be picked too. */
const SWATCHES = [
  '#00E5FF',
  '#E8100E',
  '#FFD21F',
  '#3D5AFE',
  '#22C55E',
  '#FF4FA3',
  '#FF7A00',
  '#FFFFFF',
];

export function StylePanel() {
  const fontId = createUniqueId();
  const accentOverride = () => state.accents[state.theme];
  return (
    <div class="panel-stack">
      <fieldset class="group">
        <legend class="field-label">{t('editor.style.theme')}</legend>
        <div class="theme-grid">
          <For each={THEME_IDS}>
            {(id: ThemeId) => (
              <label class={`theme-option theme-${id}`}>
                <input
                  type="radio"
                  name="theme"
                  checked={state.theme === id}
                  onChange={() => actions.setTheme(id)}
                />
                <span
                  class="theme-swatch"
                  style={{ '--swatch': THEMES[id].accent }}
                  aria-hidden="true"
                />
                <span>{t(`editor.style.themes.${id}`)}</span>
              </label>
            )}
          </For>
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="field-label">{t('editor.style.accent')}</legend>
        <div class="swatches">
          <For each={SWATCHES}>
            {(color) => (
              <label class="swatch" style={{ '--swatch': color }} title={color}>
                <input
                  type="radio"
                  name="accent"
                  checked={theme().accent.toUpperCase() === color}
                  onChange={() => actions.setAccent(color)}
                />
                <span class="visually-hidden">{color}</span>
              </label>
            )}
          </For>
          <label class="swatch custom" title={t('editor.style.customColor')}>
            <input
              type="color"
              value={theme().accent.toLowerCase()}
              onInput={(e) => actions.setAccent(e.currentTarget.value)}
            />
            <span class="visually-hidden">{t('editor.style.customColor')}</span>
          </label>
        </div>
        <Show when={accentOverride()}>
          <button type="button" class="link-button" onClick={() => actions.setAccent(null)}>
            {t('editor.style.resetColor')}
          </button>
        </Show>
      </fieldset>

      <div class="field">
        <label class="field-label" for={fontId}>
          {t('editor.style.font')}
        </label>
        <select
          id={fontId}
          class="select"
          disabled={state.theme === 'pixel'}
          value={state.font ?? ''}
          onChange={(e) => actions.setFont(e.currentTarget.value || null)}
        >
          <option value="">{t('editor.style.themeFont')}</option>
          <For each={FONTS}>
            {(f) => (
              <option value={f.id} style={{ 'font-family': `"${f.family}"` }}>
                {f.family}
              </option>
            )}
          </For>
        </select>
        <Show when={state.theme === 'pixel'}>
          <p class="field-help">{t('editor.style.pixelFontNote')}</p>
        </Show>
      </div>
    </div>
  );
}

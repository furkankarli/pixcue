/** Preview-only preferences (not part of a shared graphic), kept per browser. */
import { createEffect, createRoot, createSignal } from 'solid-js';

export type StageBackground = 'checker' | 'dark' | 'light';

interface ViewPrefs {
  safeArea: boolean;
  platformUi: boolean;
  background: StageBackground;
}

const KEY = 'pixcue.view.v1';
const defaults: ViewPrefs = { safeArea: true, platformUi: false, background: 'checker' };

function load(): ViewPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      safeArea: typeof raw.safeArea === 'boolean' ? raw.safeArea : defaults.safeArea,
      platformUi: typeof raw.platformUi === 'boolean' ? raw.platformUi : defaults.platformUi,
      background: ['checker', 'dark', 'light'].includes(raw.background)
        ? raw.background
        : defaults.background,
    };
  } catch {
    return defaults;
  }
}

const initial = typeof localStorage === 'undefined' ? defaults : load();
export const [safeArea, setSafeArea] = createSignal(initial.safeArea);
export const [platformUi, setPlatformUi] = createSignal(initial.platformUi);
export const [stageBackground, setStageBackground] = createSignal<StageBackground>(
  initial.background,
);

createRoot(() => {
  createEffect(() => {
    const prefs: ViewPrefs = {
      safeArea: safeArea(),
      platformUi: platformUi(),
      background: stageBackground(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      // Not persisted; the choice still applies for this session.
    }
  });
});

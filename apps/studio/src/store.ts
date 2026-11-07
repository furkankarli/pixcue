/**
 * The editor store: the serializable state (see state/editor-state.ts) made
 * reactive, plus what is derived from it for rendering. The URL fragment
 * always mirrors the current graphic, so the address bar is a share link.
 */
import {
  createFrame,
  type Frame,
  type FramePresetId,
  type Point,
  type Position,
  type RenderState,
  resolveTheme,
  type ThemeId,
} from '@pixcue/engine';
import { createTranslator } from '@pixcue/i18n';
import { defaultPosition, findTemplate, resolveFields } from '@pixcue/templates';
import { batch, createEffect, createMemo, createRoot, createSignal } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { findFont, loadFont, themeFontsReady } from './fonts.ts';
import { locale } from './i18n.ts';
import {
  currentTemplate,
  type EditorState,
  editsFor,
  type FrameRate,
  initialState,
  MAX_DURATION,
  SCALE_RANGE,
  type TemplateEdits,
} from './state/editor-state.ts';
import { decodeHash, encodeHash } from './state/share.ts';

/** The store's own, writable view of the state (the public type stays read-only). */
type Writable<T> = { -readonly [K in keyof T]: T[K] extends object ? Writable<T[K]> : T[K] };

const startState = (typeof location !== 'undefined' && decodeHash(location.hash)) || initialState();
const [store, setState] = createStore<Writable<EditorState>>(startState as Writable<EditorState>);

/** Current editor state (read-only; change it through `actions`). */
export const state: EditorState = store;

/** Bumped whenever fonts finish loading, so canvases redraw with them. */
const [fontsVersion, bumpFonts] = createSignal(0);

export { fontsVersion };

const derived = createRoot(() => {
  const frame = createMemo(() => createFrame(state.preset));
  const template = createMemo(() => currentTemplate(state));
  const edits = createMemo(() => editsFor(state));
  const font = createMemo(() => findFont(state.font));
  const theme = createMemo(() => {
    const f = font();
    return resolveTheme(state.theme, {
      accent: state.accents[state.theme],
      displayFont: f ? { family: f.family, weight: f.weight } : undefined,
    });
  });
  const translator = createMemo(() => createTranslator(locale()));
  const fields = createMemo(() =>
    resolveFields(template(), edits().fields, {
      t: translator(),
      locale: locale(),
      platform: frame().platform,
    }),
  );
  const duration = createMemo(() => edits().duration ?? template().duration);
  const position = createMemo<Position>(
    () => edits().position ?? defaultPosition(template(), frame()),
  );

  // Keep the address bar in sync (debounced, without adding history entries).
  let timer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const hash = encodeHash(state);
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }, 300);
  });

  // Load the chosen display font, then redraw.
  createEffect(() => {
    const f = font();
    if (f) void loadFont(f).then(() => bumpFonts((v) => v + 1));
  });

  return { frame, template, edits, font, theme, fields, duration, position };
});

export const { frame, template, edits, font, theme, fields, duration, position } = derived;

if (typeof document !== 'undefined') {
  void themeFontsReady().then(() => bumpFonts((v) => v + 1));
  // A link pasted into this tab's address bar.
  window.addEventListener('hashchange', () => {
    const next = decodeHash(location.hash);
    if (next) loadState(next);
  });
}

/** Render state for any template (the library previews), with that template's own edits. */
export function renderStateFor(
  templateId: string,
  outputFrame: Frame,
): RenderState<unknown> | null {
  const t = findTemplate(templateId);
  if (!t) return null;
  const e = editsFor(state, templateId);
  const f = frame();
  return {
    frame: outputFrame,
    theme: theme(),
    scene: t.render as RenderState<unknown>['scene'],
    fields: resolveFields(t, e.fields, {
      t: createTranslator(locale()),
      locale: locale(),
      platform: f.platform,
    }),
    duration: e.duration ?? t.duration,
    locale: locale(),
    layout: { position: e.position ?? defaultPosition(t, f), offset: e.offset, scale: e.scale },
  };
}

/** What the engine needs to draw the current graphic into `outputFrame`. */
export function renderState(outputFrame: Frame = frame()): RenderState<unknown> {
  return {
    frame: outputFrame,
    theme: theme(),
    scene: template().render as RenderState<unknown>['scene'],
    fields: fields(),
    duration: duration(),
    locale: locale(),
    layout: { position: position(), offset: edits().offset, scale: edits().scale },
  };
}

function updateEdits(change: (e: TemplateEdits) => TemplateEdits): void {
  setState('edits', state.template, change(editsFor(state)) as Writable<TemplateEdits>);
}

export const actions = {
  loadState(next: EditorState) {
    setState(reconcile(next as Writable<EditorState>));
  },
  setPreset(preset: FramePresetId) {
    setState('preset', preset);
  },
  setTemplate(id: string) {
    if (findTemplate(id)) setState('template', id);
  },
  setTheme(id: ThemeId) {
    setState('theme', id);
  },
  setAccent(color: string | null) {
    setState('accents', state.theme, color ?? undefined);
  },
  setFont(id: string | null) {
    setState('font', findFont(id) ? id : null);
  },
  setFps(fps: FrameRate) {
    setState('fps', fps);
  },
  setField(key: string, value: unknown) {
    updateEdits((e) => ({ ...e, fields: { ...e.fields, [key]: value } }));
  },
  resetField(key: string) {
    updateEdits((e) => {
      const { [key]: _removed, ...rest } = e.fields;
      return { ...e, fields: rest };
    });
  },
  setPosition(position: Position) {
    updateEdits((e) => ({ ...e, position, offset: { x: 0, y: 0 } }));
  },
  setOffset(offset: Point) {
    updateEdits((e) => ({ ...e, offset: { x: Math.round(offset.x), y: Math.round(offset.y) } }));
  },
  resetOffset() {
    updateEdits((e) => ({ ...e, offset: { x: 0, y: 0 } }));
  },
  setScale(scale: number) {
    updateEdits((e) => ({
      ...e,
      scale: Math.min(SCALE_RANGE.max, Math.max(SCALE_RANGE.min, scale)),
    }));
  },
  setDuration(seconds: number) {
    const min = template().minDuration;
    updateEdits((e) => ({ ...e, duration: Math.min(MAX_DURATION, Math.max(min, seconds)) }));
  },
};

export const loadState = (next: EditorState) => batch(() => actions.loadState(next));

/**
 * The editor's state: everything needed to reproduce a graphic. Pure data and
 * pure functions, so it can be shared as a link, saved as a preset and tested
 * without a browser.
 */
import {
  createFrame,
  type FramePresetId,
  isFramePresetId,
  isPosition,
  isThemeId,
  type Point,
  type Position,
  type ThemeId,
} from '@pixcue/engine';
import { coerceValue, type Field, findTemplate, TEMPLATES, type Template } from '@pixcue/templates';
import { findFont } from '../fonts.ts';

export const FRAME_RATES = [24, 25, 30, 60] as const;
export type FrameRate = (typeof FRAME_RATES)[number];

/** What the user changed for one template; unset values follow the defaults. */
export interface TemplateEdits {
  /** Field values the user typed; others follow the locale and platform defaults. */
  readonly fields: Readonly<Record<string, unknown>>;
  readonly position: Position | null;
  /** Drag offset in design units. */
  readonly offset: Point;
  readonly scale: number;
  /** Clip length in seconds; `null` uses the template's default. */
  readonly duration: number | null;
}

export interface EditorState {
  readonly preset: FramePresetId;
  readonly template: string;
  readonly theme: ThemeId;
  /** Accent override per theme. */
  readonly accents: Readonly<Partial<Record<ThemeId, string>>>;
  /** Curated display font id, or `null` for the theme's font. */
  readonly font: string | null;
  readonly fps: FrameRate;
  /** Edits per template, so switching templates keeps what was typed. */
  readonly edits: Readonly<Record<string, TemplateEdits>>;
  /** Sound effects: off by default; `volume` from 0 to 1. */
  readonly sound: SoundSettings;
}

export interface SoundSettings {
  readonly on: boolean;
  readonly volume: number;
}

export const DEFAULT_SOUND: SoundSettings = { on: false, volume: 0.8 };

export const EMPTY_EDITS: TemplateEdits = {
  fields: {},
  position: null,
  offset: { x: 0, y: 0 },
  scale: 1,
  duration: null,
};

export const SCALE_RANGE = { min: 0.5, max: 2 } as const;
export const MAX_DURATION = 30;
/** Drag offsets beyond this would push the graphic far off any frame. */
const MAX_OFFSET = 3000;

export function initialState(): EditorState {
  return {
    preset: 'youtube',
    template: TEMPLATES[0]?.id ?? 'lower-third',
    theme: 'tech',
    accents: {},
    font: null,
    fps: 30,
    edits: {},
    sound: DEFAULT_SOUND,
  };
}

export function editsFor(state: EditorState, templateId = state.template): TemplateEdits {
  return state.edits[templateId] ?? EMPTY_EDITS;
}

export function currentTemplate(state: EditorState): Template {
  const t = findTemplate(state.template) ?? TEMPLATES[0];
  if (!t) throw new Error('No templates are registered');
  return t;
}

/** Clip length in seconds for the current template. */
export function durationOf(state: EditorState): number {
  const t = currentTemplate(state);
  return editsFor(state).duration ?? t.duration;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clampTo = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const HEX = /^#[0-9a-f]{6}$/i;

/** Keeps only valid overrides for a template's fields. */
export function cleanFields(template: Template, raw: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [key, f] of Object.entries(template.fields) as [string, Field][]) {
    if (!Object.hasOwn(raw, key)) continue;
    const value = coerceValue(f, (raw as Record<string, unknown>)[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/** Validates edits from untrusted input (a link or old preset). */
export function cleanEdits(template: Template, raw: unknown): TemplateEdits {
  if (typeof raw !== 'object' || raw === null) return EMPTY_EDITS;
  const r = raw as Record<string, unknown>;
  const offset = r.offset as Record<string, unknown> | undefined;
  return {
    fields: cleanFields(template, r.fields),
    position: typeof r.position === 'string' && isPosition(r.position) ? r.position : null,
    offset: {
      x: finite(offset?.x) ? clampTo(Math.round(offset.x), -MAX_OFFSET, MAX_OFFSET) : 0,
      y: finite(offset?.y) ? clampTo(Math.round(offset.y), -MAX_OFFSET, MAX_OFFSET) : 0,
    },
    scale: finite(r.scale) ? clampTo(r.scale, SCALE_RANGE.min, SCALE_RANGE.max) : 1,
    duration: finite(r.duration) ? clampTo(r.duration, template.minDuration, MAX_DURATION) : null,
  };
}

/** Validates sound settings from untrusted input. */
export function cleanSound(raw: unknown): SoundSettings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SOUND;
  const r = raw as Record<string, unknown>;
  return {
    on: r.on === true,
    volume: finite(r.volume) ? clampTo(r.volume, 0, 1) : DEFAULT_SOUND.volume,
  };
}

/** Builds a valid state from untrusted input; anything invalid falls back to the defaults. */
export function cleanState(raw: unknown): EditorState {
  const base = initialState();
  if (typeof raw !== 'object' || raw === null) return base;
  const r = raw as Record<string, unknown>;
  const template =
    typeof r.template === 'string' && findTemplate(r.template) ? r.template : base.template;
  const accents: Partial<Record<ThemeId, string>> = {};
  if (typeof r.accents === 'object' && r.accents !== null) {
    for (const [k, v] of Object.entries(r.accents))
      if (isThemeId(k) && typeof v === 'string' && HEX.test(v)) accents[k] = v;
  }
  const edits: Record<string, TemplateEdits> = {};
  if (typeof r.edits === 'object' && r.edits !== null) {
    for (const [id, e] of Object.entries(r.edits)) {
      const t = findTemplate(id);
      if (t) edits[id] = cleanEdits(t, e);
    }
  }
  return {
    preset: typeof r.preset === 'string' && isFramePresetId(r.preset) ? r.preset : base.preset,
    template,
    theme: typeof r.theme === 'string' && isThemeId(r.theme) ? r.theme : base.theme,
    accents,
    font: typeof r.font === 'string' && findFont(r.font) ? r.font : null,
    fps: (FRAME_RATES as readonly unknown[]).includes(r.fps) ? (r.fps as FrameRate) : base.fps,
    edits,
    sound: cleanSound(r.sound),
  };
}

/** The frame of the current preset. */
export const frameOf = (state: EditorState) => createFrame(state.preset);

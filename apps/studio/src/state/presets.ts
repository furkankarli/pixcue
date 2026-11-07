/**
 * Saved presets: named setups kept in this browser (localStorage). They use
 * the same compact form as shared links, so a preset is a link with a name.
 */
import type { EditorState } from './editor-state.ts';
import { deserialize, serialize } from './share.ts';

export interface SavedPreset {
  readonly id: string;
  readonly name: string;
  readonly savedAt: number;
  readonly data: Record<string, unknown>;
}

const KEY = 'pixcue.presets.v1';
const LIMIT = 50;

/** Storage with the parts of `localStorage` presets need (injectable for tests). */
export type PresetStorage = Pick<Storage, 'getItem' | 'setItem'>;

function storage(): PresetStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadPresets(store = storage()): SavedPreset[] {
  try {
    const raw = JSON.parse(store?.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (p): p is SavedPreset =>
        typeof p?.id === 'string' &&
        typeof p?.name === 'string' &&
        typeof p?.savedAt === 'number' &&
        typeof p?.data === 'object',
    );
  } catch {
    return [];
  }
}

function write(presets: readonly SavedPreset[], store: PresetStorage | null): boolean {
  try {
    store?.setItem(KEY, JSON.stringify(presets.slice(0, LIMIT)));
    return store !== null;
  } catch {
    return false;
  }
}

/** Saves the state under a name, newest first. Returns whether it was stored. */
export function savePreset(
  name: string,
  state: EditorState,
  store = storage(),
  now = Date.now(),
): SavedPreset[] {
  const preset: SavedPreset = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim().slice(0, 60),
    savedAt: now,
    data: serialize(state),
  };
  const next = [preset, ...loadPresets(store)];
  write(next, store);
  return next;
}

export function deletePreset(id: string, store = storage()): SavedPreset[] {
  const next = loadPresets(store).filter((p) => p.id !== id);
  write(next, store);
  return next;
}

/** The state a preset restores (validated like a shared link). */
export function presetState(preset: SavedPreset): EditorState {
  return deserialize(preset.data);
}

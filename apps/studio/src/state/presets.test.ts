import { describe, expect, it } from 'vitest';
import { initialState } from './editor-state.ts';
import {
  deletePreset,
  loadPresets,
  type PresetStorage,
  presetState,
  savePreset,
} from './presets.ts';

function memory(): PresetStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('saved presets', () => {
  it('saves newest first and restores the state', () => {
    const store = memory();
    savePreset('İlk', initialState(), store, 1);
    const state = { ...initialState(), template: 'score-card', theme: 'pixel' as const };
    const list = savePreset('  Puan kartı – pixel  ', state, store, 2);
    expect(list.map((p) => p.name)).toEqual(['Puan kartı – pixel', 'İlk']);
    const [newest] = loadPresets(store);
    if (!newest) throw new Error('preset was not stored');
    expect(presetState(newest)).toMatchObject({ template: 'score-card', theme: 'pixel' });
  });

  it('deletes by id', () => {
    const store = memory();
    const [p] = savePreset('A', initialState(), store);
    expect(deletePreset(p?.id ?? '', store)).toEqual([]);
  });

  it('survives corrupt or missing storage', () => {
    const store = memory();
    store.data.set('pixcue.presets.v1', '{not json');
    expect(loadPresets(store)).toEqual([]);
    expect(loadPresets(null)).toEqual([]);
    store.data.set(
      'pixcue.presets.v1',
      JSON.stringify([{ id: 1 }, { id: 'x', name: 'ok', savedAt: 1, data: {} }]),
    );
    expect(loadPresets(store).map((p) => p.name)).toEqual(['ok']);
  });
});

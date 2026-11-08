import { describe, expect, it } from 'vitest';
import { cleanState, type EditorState, initialState } from './editor-state.ts';
import { decodeHash, deserialize, encodeHash, serialize } from './share.ts';

const edited: EditorState = {
  ...initialState(),
  preset: 'tiktok',
  template: 'subscribe',
  theme: 'pop',
  accents: { pop: '#FF4FA3', tech: '#00E5FF' },
  font: 'bebas-neue',
  fps: 60,
  sound: { on: true, volume: 0.5 },
  edits: {
    subscribe: {
      fields: { button: 'Katıl', bell: true },
      position: 'tr',
      offset: { x: 12, y: -8 },
      scale: 1.2,
      duration: 6,
    },
    'lower-third': {
      fields: { title: 'Başka şablon' },
      position: null,
      offset: { x: 0, y: 0 },
      scale: 1,
      duration: null,
    },
  },
};

describe('share links', () => {
  it('round-trips the current graphic', () => {
    const back = decodeHash(encodeHash(edited));
    expect(back).toEqual({
      ...edited,
      // Only the current template and the current theme's accent travel in a link.
      accents: { pop: '#FF4FA3' },
      edits: { subscribe: edited.edits.subscribe },
    });
  });

  it('keeps links short by leaving out defaults', () => {
    expect(serialize(initialState())).toEqual({ v: 1, t: initialState().template });
    expect(encodeHash(initialState()).length).toBeLessThan(40);
  });

  it('carries sound only when it is on, with its volume', () => {
    expect(serialize({ ...initialState(), sound: { on: false, volume: 0.3 } }).sn).toBeUndefined();
    expect(serialize({ ...initialState(), sound: { on: true, volume: 0.3 } }).sn).toBe(0.3);
    expect(deserialize({ v: 1, t: 'callout', sn: 7 }).sound).toEqual({ on: true, volume: 1 });
    expect(deserialize({ v: 1, t: 'callout', sn: 'loud' }).sound.on).toBe(false);
  });

  it('keeps Turkish text intact', () => {
    expect(decodeHash(encodeHash(edited))?.edits.subscribe?.fields.button).toBe('Katıl');
  });

  it('ignores fragments without a graphic and broken data', () => {
    expect(decodeHash('')).toBeNull();
    expect(decodeHash('#section')).toBeNull();
    expect(decodeHash('#g=***')).toBeNull();
    expect(decodeHash('#g=bm90IGpzb24')).toBeNull(); // "not json"
  });

  it('drops invalid and unknown values from untrusted links', () => {
    const state = deserialize({
      v: 1,
      t: 'subscribe',
      p: 'cinema',
      th: 'neon',
      a: 'red; background:url(x)',
      f: 'comic-sans',
      fps: 1000,
      d: { button: 42, done: 'Tamam', __proto__: { x: 1 }, unknown: 'x' },
      pos: 'center',
      o: [1e9, 'x'],
      s: 99,
      du: -5,
    });
    expect(state).toMatchObject({
      preset: 'youtube',
      template: 'subscribe',
      theme: 'tech',
      font: null,
      fps: 30,
      accents: {},
    });
    expect(state.edits.subscribe).toEqual({
      fields: { done: 'Tamam' },
      position: null,
      offset: { x: 3000, y: 0 },
      scale: 2,
      duration: 5, // clamped to the template's minimum
    });
  });

  it('falls back to defaults for other link versions and unknown templates', () => {
    expect(deserialize({ v: 99, t: 'subscribe' })).toEqual(initialState());
    expect(deserialize({ v: 1, t: 'no-such-template' }).template).toBe(initialState().template);
  });
});

describe('cleanState', () => {
  it('accepts its own output unchanged', () => {
    expect(cleanState(edited)).toEqual(edited);
  });
});

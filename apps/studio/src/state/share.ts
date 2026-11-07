/**
 * Shareable links: the current graphic is stored in the URL fragment
 * (`#g=…`), which browsers never send to a server. Only the current template
 * and the values that differ from the defaults are included, so links stay
 * short and untouched copy keeps following the viewer's language.
 */
import {
  cleanState,
  type EditorState,
  EMPTY_EDITS,
  editsFor,
  initialState,
} from './editor-state.ts';

const PARAM = 'g';
/** Bumped when the link format changes; old versions are migrated or ignored. */
const VERSION = 1;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(data: string): string {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** The compact, link-friendly form of a state (also used by saved presets). */
export function serialize(state: EditorState): Record<string, unknown> {
  const base = initialState();
  const edits = editsFor(state);
  const out: Record<string, unknown> = { v: VERSION, t: state.template };
  if (state.preset !== base.preset) out.p = state.preset;
  if (state.theme !== base.theme) out.th = state.theme;
  const accent = state.accents[state.theme];
  if (accent) out.a = accent;
  if (state.font) out.f = state.font;
  if (state.fps !== base.fps) out.fps = state.fps;
  if (Object.keys(edits.fields).length) out.d = edits.fields;
  if (edits.position) out.pos = edits.position;
  if (edits.offset.x || edits.offset.y) out.o = [edits.offset.x, edits.offset.y];
  if (edits.scale !== EMPTY_EDITS.scale) out.s = edits.scale;
  if (edits.duration !== null) out.du = edits.duration;
  return out;
}

/** Reads the compact form back, validating every value. */
export function deserialize(data: unknown): EditorState {
  if (typeof data !== 'object' || data === null) return initialState();
  const d = data as Record<string, unknown>;
  if (d.v !== VERSION) return initialState();
  const offset = Array.isArray(d.o) ? { x: d.o[0], y: d.o[1] } : undefined;
  return cleanState({
    preset: d.p,
    template: d.t,
    theme: d.th,
    accents: { [typeof d.th === 'string' ? d.th : initialState().theme]: d.a },
    font: d.f,
    fps: d.fps,
    edits:
      typeof d.t === 'string'
        ? { [d.t]: { fields: d.d, position: d.pos, offset, scale: d.s, duration: d.du } }
        : {},
  });
}

export function encodeHash(state: EditorState): string {
  return `#${PARAM}=${toBase64Url(JSON.stringify(serialize(state)))}`;
}

/** The state in a URL fragment, or `null` when the fragment has none (or is broken). */
export function decodeHash(hash: string): EditorState | null {
  const match = hash.match(new RegExp(`[#&]${PARAM}=([A-Za-z0-9_-]+)`));
  if (!match?.[1]) return null;
  try {
    return deserialize(JSON.parse(fromBase64Url(match[1])));
  } catch {
    return null;
  }
}

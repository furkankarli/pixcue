import type { Frame } from './frame.ts';

/** Anchor on a 3×3 grid: row (t, m, b) then column (l, c, r). */
export const POSITIONS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'] as const;
export type Position = (typeof POSITIONS)[number];

export interface Size {
  readonly w: number;
  readonly h: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Where the user put a graphic and how big it is. */
export interface Layout {
  readonly position: Position;
  /** Nudge from the anchored position, in design units (drag to reposition). */
  readonly offset: Point;
  /** Size multiplier chosen by the user; 1 is the template's natural size. */
  readonly scale: number;
}

export const DEFAULT_LAYOUT: Layout = { position: 'bl', offset: { x: 0, y: 0 }, scale: 1 };

export function isPosition(value: string): value is Position {
  return (POSITIONS as readonly string[]).includes(value);
}

/**
 * The scale to draw at: the user's scale, reduced if needed so that a graphic
 * of natural size `size` fits inside the frame's safe area.
 */
export function fitScale(size: Size, frame: Frame, scale: number): number {
  const { width, height } = frame.safeArea;
  return Math.min(scale, width / Math.max(1, size.w), height / Math.max(1, size.h));
}

/**
 * Top-left corner, in design units, for a graphic of the given (already
 * scaled) size anchored at `layout.position` inside the safe area.
 */
export function place(
  size: Size,
  frame: Frame,
  layout: Pick<Layout, 'position' | 'offset'>,
): Point {
  const i = POSITIONS.indexOf(layout.position);
  const col = i % 3;
  const row = Math.floor(i / 3);
  const r = frame.safeArea;
  const x = col === 0 ? r.x : col === 1 ? r.x + (r.width - size.w) / 2 : r.x + r.width - size.w;
  const y = row === 0 ? r.y : row === 1 ? r.y + (r.height - size.h) / 2 : r.y + r.height - size.h;
  return { x: x + layout.offset.x, y: y + layout.offset.y };
}

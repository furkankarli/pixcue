import { describe, expect, it } from 'vitest';
import {
  ERASE_MAX,
  eraseDuration,
  POP_OUT,
  popScale,
  typedCount,
  typedEnd,
  typedVisible,
} from '../src/pixel/timing.ts';

const step = 1 / 30;
const at = (start: number, i: number) => start + i * step + 0.001;

describe('pop', () => {
  it('grows in whole steps, overshoots and settles', () => {
    const seen = Array.from({ length: 12 }, (_, i) => popScale(at(1, i), 1, null, 6));
    expect(seen.every((k) => Number.isInteger(k) && k >= 1)).toBe(true);
    expect(Math.max(...seen)).toBe(7);
    expect(seen.slice(-3)).toEqual([6, 6, 6]);
  });

  it('is hidden before it starts', () => {
    expect(popScale(0.5, 1, null, 4)).toBe(0);
  });

  it('swells, then shrinks away', () => {
    const seen = Array.from({ length: 15 }, (_, i) => popScale(at(3, i), 1, 3, 6));
    expect(seen[0]).toBe(6);
    expect(Math.max(...seen)).toBe(7);
    expect(seen.slice(-2)).toEqual([0, 0]);
    expect(popScale(3 + POP_OUT + 0.001, 1, 3, 6)).toBe(0);
    expect(popScale(3 + POP_OUT - 0.01, 1, 3, 6)).toBeGreaterThan(0);
  });

  it('takes the same time at every output size', () => {
    const visible = (px: number) =>
      Array.from({ length: 30 }, (_, i) => popScale(at(3, i), 1, 3, px)).filter((k) => k > 0)
        .length;
    expect(visible(2)).toBe(visible(6));
    expect(visible(6)).toBe(visible(12));
  });
});

describe('typewriter', () => {
  it('types 32 characters per second', () => {
    expect(typedCount(1, 1, 10)).toBe(0);
    expect(typedCount(1.25, 1, 10)).toBe(8);
    expect(typedCount(5, 1, 10)).toBe(10);
    expect(typedEnd(1, 16)).toBe(1.5);
  });

  it('erases at a steady pace', () => {
    expect(typedVisible(3, 0, 10, 3)).toBe(10);
    expect(typedVisible(3.1, 0, 10, 3)).toBe(6);
    expect(typedVisible(3.26, 0, 10, 3)).toBe(0);
  });

  it('erases long text within a fixed time', () => {
    expect(eraseDuration(80)).toBe(ERASE_MAX);
    expect(typedVisible(3 + ERASE_MAX, 0, 80, 3)).toBe(0);
    expect(typedVisible(3 + ERASE_MAX / 2, 0, 80, 3)).toBe(40);
  });
});

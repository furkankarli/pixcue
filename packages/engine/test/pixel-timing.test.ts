import { describe, expect, it } from 'vitest';
import { popScale, popSequence, typedCount, typedEnd, typedVisible } from '../src/pixel/timing.ts';

const step = 1 / 30;

describe('pop', () => {
  it('grows one step per frame, overshoots by one and settles', () => {
    expect(popSequence(4)).toEqual([1, 2, 3, 4, 5, 4]);
    const seen = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => popScale(1 + i * step + 0.001, 1, null, 4));
    expect(seen).toEqual([1, 2, 3, 4, 5, 4, 4, 4]);
  });

  it('is hidden before it starts', () => {
    expect(popScale(0.5, 1, null, 4)).toBe(0);
  });

  it('bumps then shrinks away when popping out', () => {
    const seen = [0, 1, 2, 3, 4, 5, 6].map((i) => popScale(3 + i * step + 0.001, 1, 3, 4));
    expect(seen).toEqual([4, 5, 3, 2, 1, 0, 0]);
  });
});

describe('typewriter', () => {
  it('types 32 characters per second', () => {
    expect(typedCount(1, 1, 10)).toBe(0);
    expect(typedCount(1.25, 1, 10)).toBe(8);
    expect(typedCount(5, 1, 10)).toBe(10);
    expect(typedEnd(1, 16)).toBe(1.5);
  });

  it('deletes faster than it types', () => {
    expect(typedVisible(3, 0, 10, 3)).toBe(10);
    expect(typedVisible(3.1, 0, 10, 3)).toBe(3);
    expect(typedVisible(3.2, 0, 10, 3)).toBe(0);
  });
});

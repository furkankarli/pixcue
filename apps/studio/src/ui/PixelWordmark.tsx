/**
 * The Pixcue wordmark on a small LED matrix: lit pixels spell the name, and
 * the unlit ones stay faintly visible, like a dot-matrix screen. It powers on
 * column by column, and a light runs across it on hover (both skipped when
 * reduced motion is requested).
 */
import { createSignal, For } from 'solid-js';

/** 5×7 letters (I is 3 wide), one clear column apart. */
const LETTERS: readonly (readonly string[])[] = [
  ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
];

/** Unlit border around the letters, in cells. */
const PAD = 1;
/** One cell in CSS pixels: a 3 px LED and a 1 px gap, so it stays crisp. */
const PITCH = 4;
const LED = 3;
const ROWS = 7 + PAD * 2;

interface Cell {
  readonly x: number;
  readonly y: number;
  readonly lit: boolean;
}

const { cells, cols } = (() => {
  const lit = new Set<string>();
  let x = PAD;
  for (const letter of LETTERS) {
    letter.forEach((row, y) => {
      [...row].forEach((c, dx) => {
        if (c === '#') lit.add(`${x + dx},${y + PAD}`);
      });
    });
    x += (letter[0]?.length ?? 0) + 1;
  }
  const cols = x - 1 + PAD;
  const cells: Cell[] = [];
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < cols; cx++) cells.push({ x: cx, y: cy, lit: lit.has(`${cx},${cy}`) });
  }
  return { cells, cols };
})();

export function PixelWordmark() {
  // Restart the glint on every hover by toggling the class off and on.
  const [glint, setGlint] = createSignal(0);
  return (
    <span
      class="wordmark"
      classList={{ glint: glint() % 2 === 1, 'glint-b': glint() > 0 && glint() % 2 === 0 }}
      onPointerEnter={() => setGlint((g) => g + 1)}
      role="img"
      aria-label="Pixcue"
    >
      <svg
        viewBox={`0 0 ${cols * PITCH} ${ROWS * PITCH}`}
        width={cols * PITCH}
        height={ROWS * PITCH}
        shape-rendering="crispEdges"
        aria-hidden="true"
      >
        <For each={cells}>
          {(c) => (
            <rect
              class={c.lit ? 'px on' : 'px'}
              x={c.x * PITCH}
              y={c.y * PITCH}
              width={LED}
              height={LED}
              style={{ '--col': c.x }}
            />
          )}
        </For>
      </svg>
    </span>
  );
}

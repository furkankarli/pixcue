/**
 * The Pixcue wordmark on a small LED matrix: lit pixels spell the name, and
 * the unlit ones stay faintly visible, like a dot-matrix screen. It powers on
 * column by column, and a light runs across it on hover (both skipped when
 * reduced motion is requested).
 */
import { createSignal, For } from 'solid-js';
import { WORDMARK } from '../brand/wordmark.ts';

/** One cell in CSS pixels: a 3 px LED and a 1 px gap, so it stays crisp. */
const PITCH = 4;
const LED = 3;
const { cells, cols, rows: ROWS } = WORDMARK;

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

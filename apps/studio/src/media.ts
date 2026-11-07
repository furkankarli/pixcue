import { createSignal } from 'solid-js';

/** Whether the screen is wide enough for the three-column editor. */
const query = typeof matchMedia === 'undefined' ? null : matchMedia('(min-width: 1100px)');
const [wide, setWide] = createSignal(query?.matches ?? true);
query?.addEventListener('change', (e) => setWide(e.matches));

export { wide };

/** A short status message at the bottom of the screen, announced politely. */
import { createSignal, Show } from 'solid-js';

const [message, setMessage] = createSignal('');
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string) {
  setMessage(text);
  clearTimeout(timer);
  timer = setTimeout(() => setMessage(''), 2500);
}

export function Toast() {
  return (
    <span class="toast" role="status" aria-live="polite">
      <Show when={message()}>{message()}</Show>
    </span>
  );
}

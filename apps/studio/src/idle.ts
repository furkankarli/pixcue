/**
 * Runs background drawing (thumbnails, the filmstrip) when the browser is
 * idle, so typing and playback keep their frames on slow phones.
 */
export function whenIdle(task: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(task, { timeout: 500 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(task, 16);
  return () => clearTimeout(id);
}

/** Touch-first devices: phones and tablets, where the preview saves power. */
export const touchDevice =
  typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

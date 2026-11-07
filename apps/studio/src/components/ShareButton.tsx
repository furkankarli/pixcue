import { createSignal, Show } from 'solid-js';
import { t } from '../i18n.ts';
import { encodeHash } from '../state/share.ts';
import { state } from '../store.ts';
import { LinkIcon } from '../ui/icons.tsx';

const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

/** Copies a link to the current graphic (or opens the share sheet on touch devices). */
export function ShareButton() {
  const [message, setMessage] = createSignal('');
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flash = (text: string) => {
    setMessage(text);
    clearTimeout(timer);
    timer = setTimeout(() => setMessage(''), 2500);
  };

  async function share() {
    const url = `${location.origin}${location.pathname}${encodeHash(state)}`;
    try {
      if (touch && typeof navigator.share === 'function') {
        await navigator.share({ url, title: 'Pixcue' });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash(t('editor.topbar.shareCopied'));
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        flash(t('editor.topbar.shareFailed'));
    }
  }

  return (
    <>
      <button
        type="button"
        class="button responsive"
        onClick={share}
        aria-label={t('editor.topbar.share')}
      >
        <LinkIcon />
        <span class="button-label">{t('editor.topbar.share')}</span>
      </button>
      <span class="toast" role="status" aria-live="polite">
        <Show when={message()}>{message()}</Show>
      </span>
    </>
  );
}

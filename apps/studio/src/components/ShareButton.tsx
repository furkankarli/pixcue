/** Copies a link to the current graphic, or opens the share sheet on touch devices. */
import { t } from '../i18n.ts';
import { touchDevice } from '../idle.ts';
import { encodeHash } from '../state/share.ts';
import { state } from '../store.ts';
import { showToast } from '../ui/toast.tsx';

export async function shareLink(): Promise<void> {
  const url = `${location.origin}${location.pathname}${encodeHash(state)}`;
  try {
    if (touchDevice && typeof navigator.share === 'function') {
      await navigator.share({ url, title: 'Pixcue' });
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast(t('editor.topbar.shareCopied'));
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError'))
      showToast(t('editor.topbar.shareFailed'));
  }
}

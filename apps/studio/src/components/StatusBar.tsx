/**
 * The status bar along the bottom of the window: where Pixcue comes from,
 * the interface language, and who made it.
 */
import { t } from '../i18n.ts';
import { ExternalIcon } from '../ui/icons.tsx';
import { LanguagePicker } from './LanguagePicker.tsx';

export const REPOSITORY = 'https://github.com/furkankarli/pixcue';
export const AUTHOR_SITE = 'https://furkankarli.com';

export function StatusBar() {
  return (
    <footer class="statusbar">
      <a class="status-link" href={REPOSITORY} target="_blank" rel="noopener">
        <span class="status-dot" aria-hidden="true" />
        {t('editor.status.openSource')}
        <ExternalIcon size={12} />
      </a>
      <span class="status-note">{t('editor.status.local')}</span>
      <div class="status-end">
        <LanguagePicker />
        <a class="status-link mono" href={AUTHOR_SITE} target="_blank" rel="noopener">
          furkankarli.com
          <ExternalIcon size={12} />
        </a>
      </div>
    </footer>
  );
}

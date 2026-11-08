/**
 * The top bar: a menu for everything occasional (link, saved setups,
 * language, where Pixcue comes from) on the left, the name in the middle,
 * and the one primary action, Export, on the right.
 */
import { t } from '../i18n.ts';
import { BookmarkIcon, DownloadIcon, ExternalIcon, LinkIcon, MoreIcon } from '../ui/icons.tsx';
import { Menu, useCloseMenu } from '../ui/Menu.tsx';
import { PixelWordmark } from '../ui/PixelWordmark.tsx';
import { LanguagePicker } from './LanguagePicker.tsx';
import { shareLink } from './ShareButton.tsx';

export const REPOSITORY = 'https://github.com/furkankarli/pixcue';
export const AUTHOR_SITE = 'https://furkankarli.com';

function MoreItems(props: { onPresets: () => void }) {
  const close = useCloseMenu();
  return (
    <div class="menu-list">
      <button
        type="button"
        class="menu-item"
        onClick={() => {
          close();
          void shareLink();
        }}
      >
        <LinkIcon />
        {t('editor.topbar.share')}
      </button>
      <button
        type="button"
        class="menu-item"
        onClick={() => {
          close();
          props.onPresets();
        }}
      >
        <BookmarkIcon />
        {t('editor.topbar.presets')}
      </button>
      <div class="menu-row">
        <span>{t('settings.language')}</span>
        <LanguagePicker />
      </div>
      <hr class="menu-divider" />
      <a class="menu-item" href={REPOSITORY} target="_blank" rel="noopener">
        <span class="status-dot" aria-hidden="true" />
        {t('editor.status.openSource')}
        <ExternalIcon size={12} />
        <span class="visually-hidden">{t('editor.status.newTab')}</span>
      </a>
      <a class="menu-item mono" href={AUTHOR_SITE} target="_blank" rel="noopener">
        <span class="menu-credit">{t('editor.status.madeBy')}</span>
        furkankarli.com
        <ExternalIcon size={12} />
        <span class="visually-hidden">{t('editor.status.newTab')}</span>
      </a>
      <p class="menu-note">{t('editor.status.local')}</p>
    </div>
  );
}

export function TopBar(props: { onExport: () => void; onPresets: () => void }) {
  return (
    <header class="topbar">
      <div class="topbar-start">
        <Menu label={t('editor.topbar.menu')} class="icon-button ghost" trigger={<MoreIcon />}>
          <MoreItems onPresets={props.onPresets} />
        </Menu>
      </div>
      <h1 class="brand">
        <PixelWordmark />
      </h1>
      <div class="topbar-end">
        <button type="button" class="button primary" onClick={props.onExport}>
          <DownloadIcon />
          <span class="button-label">{t('editor.topbar.export')}</span>
        </button>
      </div>
    </header>
  );
}

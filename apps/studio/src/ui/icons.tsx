/** Small inline icons (24×24, currentColor). Decorative: pair them with text or an aria-label. */
import type { JSX } from 'solid-js';

const Icon = (props: { children: JSX.Element; size?: number }) => (
  <svg
    width={props.size ?? 18}
    height={props.size ?? 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {props.children}
  </svg>
);

export const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </Icon>
);
export const PauseIcon = () => (
  <Icon>
    <path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" stroke="none" />
  </Icon>
);
export const LinkIcon = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </Icon>
);
export const BookmarkIcon = () => (
  <Icon>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </Icon>
);
export const DownloadIcon = () => (
  <Icon>
    <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
  </Icon>
);
export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const ChevronUpIcon = () => (
  <Icon>
    <path d="M6 15l6-6 6 6" />
  </Icon>
);
export const ChevronDownIcon = () => (
  <Icon>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);
export const ResetIcon = () => (
  <Icon>
    <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
  </Icon>
);

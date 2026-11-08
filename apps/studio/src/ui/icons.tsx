/**
 * Icons from Lucide (ISC license), one stroke weight throughout. Decorative:
 * pair them with visible text or an aria-label.
 */
import type { LucideProps } from 'lucide-solid';
import ArrowUpRight from 'lucide-solid/icons/arrow-up-right';
import Bookmark from 'lucide-solid/icons/bookmark';
import ChevronDown from 'lucide-solid/icons/chevron-down';
import ChevronUp from 'lucide-solid/icons/chevron-up';
import Download from 'lucide-solid/icons/download';
import Ellipsis from 'lucide-solid/icons/ellipsis';
import Eye from 'lucide-solid/icons/eye';
import Grid2x2 from 'lucide-solid/icons/grid-2x2';
import LayoutTemplate from 'lucide-solid/icons/layout-template';
import Link from 'lucide-solid/icons/link';
import Moon from 'lucide-solid/icons/moon';
import Move from 'lucide-solid/icons/move';
import Palette from 'lucide-solid/icons/palette';
import Pause from 'lucide-solid/icons/pause';
import Play from 'lucide-solid/icons/play';
import Plus from 'lucide-solid/icons/plus';
import Proportions from 'lucide-solid/icons/proportions';
import RotateCcw from 'lucide-solid/icons/rotate-ccw';
import Scan from 'lucide-solid/icons/scan';
import Share from 'lucide-solid/icons/share';
import SkipBack from 'lucide-solid/icons/skip-back';
import Smartphone from 'lucide-solid/icons/smartphone';
import Sun from 'lucide-solid/icons/sun';
import Trash from 'lucide-solid/icons/trash';
import Type from 'lucide-solid/icons/type';
import X from 'lucide-solid/icons/x';
import type { Component } from 'solid-js';

const icon =
  (Glyph: Component<LucideProps>, filled = false) =>
  (props: { size?: number }) => (
    <Glyph
      size={props.size ?? 16}
      stroke-width={1.75}
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden="true"
    />
  );

export const PlayIcon = icon(Play, true);
export const PauseIcon = icon(Pause, true);
export const SkipBackIcon = icon(SkipBack, true);
export const LinkIcon = icon(Link);
export const BookmarkIcon = icon(Bookmark);
export const DownloadIcon = icon(Download);
export const CloseIcon = icon(X);
export const PlusIcon = icon(Plus);
export const TrashIcon = icon(Trash);
export const ChevronUpIcon = icon(ChevronUp);
export const ChevronDownIcon = icon(ChevronDown);
export const ResetIcon = icon(RotateCcw);
export const SafeAreaIcon = icon(Scan);
export const PhoneIcon = icon(Smartphone);
export const CheckerIcon = icon(Grid2x2);
export const DarkIcon = icon(Moon);
export const LightIcon = icon(Sun);
export const ExternalIcon = icon(ArrowUpRight);
export const MoreIcon = icon(Ellipsis);
export const EyeIcon = icon(Eye);
export const TemplatesIcon = icon(LayoutTemplate);
export const TextIcon = icon(Type);
export const StyleIcon = icon(Palette);
export const LayoutIcon = icon(Move);
export const ShareIcon = icon(Share);
export const FormatIcon = icon(Proportions);

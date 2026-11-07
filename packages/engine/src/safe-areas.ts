/**
 * Safe-area insets for every format preset, in design units (the short side of
 * every frame is 1080 units; see frame.ts). Graphics are placed inside these
 * insets so platform UI never covers them.
 *
 * This is the one place to tune them. Vertical values keep clear of:
 * - top:    tabs and search ("Following / For You", "Reels", …)
 * - bottom: the caption, sound and channel rows plus the navigation bar
 * - right:  the column of like / comment / share buttons
 *
 * The values are deliberately conservative approximations of each app's
 * layout on common phones; platforms change their UI, so revisit them when they
 * do.
 */

export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Title-safe margins for 16:9 video (about 5 % horizontally, 6.7 % vertically). */
const HORIZONTAL: Insets = { top: 72, right: 96, bottom: 72, left: 96 };

/** Feed posts and squares have no overlaid UI: a plain 5 % margin. */
const FEED: Insets = { top: 54, right: 54, bottom: 54, left: 54 };

const SHORTS: Insets = { top: 180, right: 170, bottom: 380, left: 60 };
const TIKTOK: Insets = { top: 160, right: 150, bottom: 440, left: 60 };
const REELS: Insets = { top: 220, right: 140, bottom: 450, left: 60 };

/** The strictest inset of each side, for videos posted to every platform. */
function union(...all: Insets[]): Insets {
  return {
    top: Math.max(...all.map((i) => i.top)),
    right: Math.max(...all.map((i) => i.right)),
    bottom: Math.max(...all.map((i) => i.bottom)),
    left: Math.max(...all.map((i) => i.left)),
  };
}

export const SAFE_AREA_INSETS = {
  youtube: HORIZONTAL,
  'youtube-4k': HORIZONTAL,
  shorts: SHORTS,
  tiktok: TIKTOK,
  reels: REELS,
  vertical: union(SHORTS, TIKTOK, REELS),
  'instagram-post': FEED,
  square: FEED,
} as const satisfies Record<string, Insets>;

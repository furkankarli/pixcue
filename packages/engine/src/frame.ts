import { type Insets, SAFE_AREA_INSETS } from './safe-areas.ts';

export type Orientation = 'horizontal' | 'vertical' | 'square';

/** The platform a format is made for; decides copy such as "Subscribe" vs "Follow". */
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'any';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FramePreset {
  /** Output size in pixels. */
  readonly width: number;
  readonly height: number;
  readonly platform: Platform;
}

export const FRAME_PRESETS = {
  youtube: { width: 1920, height: 1080, platform: 'youtube' },
  'youtube-4k': { width: 3840, height: 2160, platform: 'youtube' },
  shorts: { width: 1080, height: 1920, platform: 'youtube' },
  tiktok: { width: 1080, height: 1920, platform: 'tiktok' },
  reels: { width: 1080, height: 1920, platform: 'instagram' },
  vertical: { width: 1080, height: 1920, platform: 'any' },
  'instagram-post': { width: 1080, height: 1350, platform: 'instagram' },
  square: { width: 1080, height: 1080, platform: 'any' },
} as const satisfies Record<keyof typeof SAFE_AREA_INSETS, FramePreset>;

export type FramePresetId = keyof typeof FRAME_PRESETS;

/** Length of the short side of every frame, in design units. */
export const DESIGN_SHORT_SIDE = 1080;

/**
 * What a template renders into. Templates work in design units, where the
 * short side of the frame is always 1080, so the same template looks the same
 * at 1080p and 4K. `unit` converts design units to output pixels.
 */
export interface Frame {
  readonly preset: FramePresetId;
  readonly platform: Platform;
  /** Size in design units. */
  readonly width: number;
  readonly height: number;
  readonly orientation: Orientation;
  /** Where graphics may go, in design units. */
  readonly safeArea: Rect;
  /** Output size in pixels. */
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  /** Output pixels per design unit. */
  readonly unit: number;
}

export function orientationOf(width: number, height: number): Orientation {
  if (width === height) return 'square';
  return width > height ? 'horizontal' : 'vertical';
}

function insetRect(width: number, height: number, insets: Insets): Rect {
  return {
    x: insets.left,
    y: insets.top,
    width: width - insets.left - insets.right,
    height: height - insets.top - insets.bottom,
  };
}

export function isFramePresetId(value: string): value is FramePresetId {
  return Object.hasOwn(FRAME_PRESETS, value);
}

/** Builds the frame for a format preset. */
export function createFrame(preset: FramePresetId): Frame {
  const { width: pixelWidth, height: pixelHeight, platform } = FRAME_PRESETS[preset];
  const unit = Math.min(pixelWidth, pixelHeight) / DESIGN_SHORT_SIDE;
  const width = pixelWidth / unit;
  const height = pixelHeight / unit;
  return {
    preset,
    platform,
    width,
    height,
    orientation: orientationOf(width, height),
    safeArea: insetRect(width, height, SAFE_AREA_INSETS[preset]),
    pixelWidth,
    pixelHeight,
    unit,
  };
}

/**
 * The same frame rendered at a different output width (for previews and
 * thumbnails). Layout is unchanged; only the output pixel size and `unit`
 * scale, so a preview looks exactly like the export.
 */
export function scaleFrame(frame: Frame, pixelWidth: number): Frame {
  const factor = pixelWidth / frame.pixelWidth;
  return {
    ...frame,
    pixelWidth: Math.round(frame.pixelWidth * factor),
    pixelHeight: Math.round(frame.pixelHeight * factor),
    unit: frame.unit * factor,
  };
}

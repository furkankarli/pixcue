/** The export formats Pixcue offers. */
export const EXPORT_FORMATS = ['mov', 'mp4-key', 'webm', 'png-sequence'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface EditorProfile {
  /** Formats that import cleanly, best first. */
  readonly formats: readonly ExportFormat[];
  /** A phone app: offer the share sheet so the file lands in the gallery or the app. */
  readonly mobile: boolean;
}

/**
 * Which format to export for each video editor. MOV keeps a real alpha
 * channel; apps without reliable alpha import get a chroma-key MP4. Every
 * editor also offers the MP4, the one file phones and messaging apps open.
 */
export const EDITORS = {
  davinci: { formats: ['mov', 'png-sequence', 'mp4-key'], mobile: false },
  premiere: { formats: ['mov', 'png-sequence', 'mp4-key'], mobile: false },
  'final-cut': { formats: ['mov', 'png-sequence', 'mp4-key'], mobile: false },
  'capcut-desktop': { formats: ['mp4-key', 'mov'], mobile: false },
  'capcut-mobile': { formats: ['mp4-key'], mobile: true },
  edits: { formats: ['mp4-key'], mobile: true },
  other: { formats: ['webm', 'png-sequence', 'mov', 'mp4-key'], mobile: false },
} as const satisfies Record<string, EditorProfile>;

export type EditorId = keyof typeof EDITORS;

export const EDITOR_IDS = Object.keys(EDITORS) as EditorId[];

export function recommendedFormat(editor: EditorId): ExportFormat {
  return EDITORS[editor].formats[0];
}

/** Whether a format needs WebCodecs (and so may be unavailable in some browsers). */
export function needsVideoEncoder(format: ExportFormat): boolean {
  return format === 'mp4-key' || format === 'webm';
}

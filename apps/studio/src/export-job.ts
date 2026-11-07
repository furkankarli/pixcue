/**
 * Runs an export of the current graphic: snapshots the render state, waits for
 * fonts, renders every frame at full size and hands them to @pixcue/export.
 */
import { render, scaleFrame } from '@pixcue/engine';
import {
  conflictsWithKey,
  type ExportFormat,
  exportMov,
  exportMp4,
  exportPngSequence,
  exportWebm,
  type FrameSource,
  KEY_COLORS,
  type KeyColor,
} from '@pixcue/export';
import { fileName } from './files.ts';
import { loadFont, themeFontsReady } from './fonts.ts';
import { t } from './i18n.ts';
import { duration, fields, font, frame, renderState, state, template } from './store.ts';

export interface ExportRequest {
  readonly format: ExportFormat;
  readonly keyColor: KeyColor;
  readonly chromaKey: boolean;
  readonly onProgress: (progress: number) => void;
  readonly signal: AbortSignal;
}

const EXTENSIONS: Record<ExportFormat, string> = {
  mov: 'mov',
  'mp4-key': 'mp4',
  webm: 'webm',
  'png-sequence': 'zip',
};

/** A readable name: template, its first text and the format, e.g. alt-bant-kablosuz-kulaklik-youtube. */
export function exportName(format: ExportFormat): string {
  // Prefer the title; otherwise the first text the template has.
  const values = fields() as Record<string, unknown>;
  const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
  const text = isText(values.title) ? values.title : Object.values(values).find(isText);
  return fileName([t(template().name), text ?? '', state.preset], EXTENSIONS[format]);
}

export async function runExport(request: ExportRequest): Promise<File> {
  await themeFontsReady();
  const chosen = font();
  if (chosen) await loadFont(chosen);

  const output = frame();
  const snapshot = renderState(output);
  const fps = state.fps;
  const canvas = new OffscreenCanvas(output.pixelWidth, output.pixelHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const source: FrameSource = {
    width: output.pixelWidth,
    height: output.pixelHeight,
    fps,
    frameCount: Math.max(1, Math.round(duration() * fps)),
    render(index) {
      render(ctx, index / fps, snapshot);
      return canvas;
    },
  };

  const name = exportName(request.format);
  const options = { onProgress: request.onProgress, signal: request.signal };
  const blob = await {
    mov: () => exportMov(source, options),
    'png-sequence': () =>
      exportPngSequence(source, { ...options, name: name.replace(/\.zip$/, '') }),
    'mp4-key': () =>
      exportMp4(source, {
        ...options,
        background: { color: KEY_COLORS[request.keyColor], hardEdges: request.chromaKey },
      }),
    webm: () => exportWebm(source, options),
  }[request.format]();
  return new File([blob], name, { type: blob.type });
}

/** Share of the graphic's pixels a keyer would remove before we warn. */
const CONFLICT_SHARE = 0.005;

/**
 * Whether the key color would cut holes in the graphic: renders the mid-clip
 * frame small and counts opaque pixels close to the key. Works for any
 * template, theme and color.
 */
export function keyConflict(key: KeyColor): boolean {
  const output = scaleFrame(frame(), 480);
  const canvas = new OffscreenCanvas(output.pixelWidth, output.pixelHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  render(ctx, duration() / 2, renderState(output));
  const { data } = ctx.getImageData(0, 0, output.pixelWidth, output.pixelHeight);
  let graphic = 0;
  let close = 0;
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 180) continue;
    graphic++;
    const hex = `#${[data[i], data[i + 1], data[i + 2]].map((v) => (v ?? 0).toString(16).padStart(2, '0')).join('')}`;
    if (conflictsWithKey(hex, key)) close++;
  }
  return graphic > 0 && close / graphic > CONFLICT_SHARE;
}

/**
 * Runs an export of the current graphic: snapshots the render state, waits for
 * fonts, renders every frame at full size and hands them to @pixcue/export.
 */
import { render } from '@pixcue/engine';
import {
  type ExportFormat,
  exportMov,
  exportMp4,
  exportPngSequence,
  exportWebm,
  type FrameSource,
  KEY_COLORS,
  type KeyColor,
} from '@pixcue/export';
import { exportName } from './export-name.ts';
import { loadFont, themeFontsReady } from './fonts.ts';
import { duration, font, frame, renderState, soundtrack, state } from './store.ts';

export interface ExportRequest {
  readonly format: ExportFormat;
  readonly keyColor: KeyColor;
  readonly chromaKey: boolean;
  readonly onProgress: (progress: number) => void;
  readonly signal: AbortSignal;
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
  // The same samples the preview plays; WebM is exported without sound.
  const sound = soundtrack() ?? undefined;
  const options = { onProgress: request.onProgress, signal: request.signal, sound };
  const blob = await {
    mov: () => exportMov(source, options),
    'png-sequence': () =>
      exportPngSequence(source, { ...options, name: name.replace(/\.zip$/, '') }),
    'mp4-key': () =>
      exportMp4(source, {
        ...options,
        background: { color: KEY_COLORS[request.keyColor], hardEdges: request.chromaKey },
      }),
    webm: () => exportWebm(source, { ...options, sound: undefined }),
  }[request.format]();
  return new File([blob], name, { type: blob.type });
}

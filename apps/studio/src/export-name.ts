/** File names for exports, kept apart from the export pipeline so the dialog can use them. */
import type { ExportFormat } from '@pixcue/export';
import { fileName } from './files.ts';
import { t } from './i18n.ts';
import { fields, state, template } from './store.ts';

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

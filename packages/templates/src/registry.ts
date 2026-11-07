import type { Template } from './api.ts';
import { chapterTitle } from './chapter-title.ts';
import { lowerThird } from './lower-third.ts';

/** Every built-in template, in the order the editor lists them. */
export const TEMPLATES: readonly Template[] = [lowerThird, chapterTitle];

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

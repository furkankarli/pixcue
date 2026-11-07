import type { Template } from './api.ts';
import { lowerThird } from './lower-third.ts';

/** Every built-in template, in the order the editor lists them. */
export const TEMPLATES: readonly Template[] = [lowerThird];

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

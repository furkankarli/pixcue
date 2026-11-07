import type { Template } from './api.ts';
import { callout } from './callout.ts';
import { chapterTitle } from './chapter-title.ts';
import { lowerThird } from './lower-third.ts';
import { scoreCard } from './score-card.ts';
import { specCard } from './spec-card.ts';
import { subscribe } from './subscribe.ts';

/** Every built-in template, in the order the editor lists them. */
export const TEMPLATES: readonly Template[] = [
  lowerThird,
  chapterTitle,
  specCard,
  callout,
  subscribe,
  scoreCard,
];

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

import type { MessageTree } from '../types.ts';

/**
 * English: the source locale. Every other locale provides exactly these keys.
 * Use `{name}` placeholders for values filled in at runtime.
 */
export default {
  code: 'en',
  name: 'English',
  messages: {
    app: {
      tagline: 'Motion graphics for video creators, right in your browser.',
      comingSoon: 'The editor is on its way.',
    },
    settings: {
      language: 'Language',
    },
  },
} satisfies { code: string; name: string; messages: MessageTree };

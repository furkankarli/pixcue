import type { UserConfig } from '@commitlint/types';

/**
 * Conventional Commits, restricted to the types and scopes this repo uses.
 * The same rules check local commits (lefthook), PR commits and PR titles (CI).
 */
const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'test', 'build', 'ci', 'chore']],
    'scope-enum': [
      2,
      'always',
      ['engine', 'export', 'templates', 'studio', 'i18n', 'repo', 'deps', 'release'],
    ],
    'scope-empty': [2, 'never'],
  },
};

export default config;

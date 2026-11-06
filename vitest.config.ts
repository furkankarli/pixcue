import { defineConfig } from 'vitest/config';

const VISUAL = '**/*.visual.test.ts';

/**
 * Two projects across the whole workspace:
 * - unit:   fast logic tests (`*.test.ts`)
 * - visual: render chosen frames to PNG and compare with committed baselines
 *           (`*.visual.test.ts`)
 */
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/*/test/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
          exclude: [VISUAL, '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'visual',
          include: [`packages/*/test/${VISUAL}`],
        },
      },
    ],
  },
});

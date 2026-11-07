import { defineConfig } from 'vitest/config';

const VISUAL = '**/*.visual.test.ts';
const FORMATS = '**/*.format.test.ts';

// Points the engine at a Node.js canvas and registers the theme fonts.
const setupFiles = ['packages/engine/testing/setup.ts'];

// `vitest --update` (pnpm test:visual:update) rewrites visual baselines.
const updateVisualSnapshots = process.argv.includes('-u') || process.argv.includes('--update');

/**
 * Three projects across the whole workspace:
 * - unit:    fast logic tests (`*.test.ts`)
 * - visual:  render chosen frames to PNG and compare with committed baselines
 *            (`*.visual.test.ts`)
 * - formats: export short clips and validate them with ffprobe; needs ffmpeg
 *            on PATH (`*.format.test.ts`)
 */
export default defineConfig({
  test: {
    passWithNoTests: true,
    setupFiles,
    provide: { updateVisualSnapshots },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/*/test/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
          exclude: [VISUAL, FORMATS, '**/node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'visual',
          include: [`packages/*/test/${VISUAL}`],
        },
      },
      {
        extends: true,
        test: {
          name: 'formats',
          include: [`packages/*/test/${FORMATS}`],
          testTimeout: 60_000,
        },
      },
    ],
  },
});

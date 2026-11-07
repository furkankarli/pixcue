/**
 * Visual snapshot comparison: renders are compared pixel by pixel with
 * committed PNG baselines.
 *
 * - Missing baseline: written locally (and the test passes); fails in CI.
 * - `pnpm test:visual:update`: rewrites baselines that changed.
 * - Mismatch: writes `__actual__/` and `__diff__/` images next to the baseline
 *   (git-ignored, uploaded as a CI artifact) and fails.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import pixelmatch from 'pixelmatch';
import { inject } from 'vitest';
import type { DrawableSurface } from '../src/canvas.ts';

declare module 'vitest' {
  interface ProvidedContext {
    /** True when Vitest runs with `--update` (`pnpm test:visual:update`). */
    updateVisualSnapshots: boolean;
  }
}

export interface SnapshotOptions {
  /** Per-pixel color tolerance, 0–1 (pixelmatch `threshold`). */
  readonly threshold?: number;
  /** Share of pixels allowed to differ, 0–1. */
  readonly maxDiffRatio?: number;
}

interface NodeCanvasLike {
  encode(format: 'png'): Promise<Buffer>;
}

async function decode(
  png: Buffer,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const image = await loadImage(png);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  return {
    data: ctx.getImageData(0, 0, image.width, image.height).data,
    width: image.width,
    height: image.height,
  };
}

function write(path: string, data: Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

/**
 * Compares a rendered canvas with the baseline PNG at `baselinePath`. Throws
 * with a readable message when they differ.
 */
export async function expectToMatchSnapshot(
  surface: DrawableSurface,
  baselinePath: string,
  { threshold = 0.1, maxDiffRatio = 0.0001 }: SnapshotOptions = {},
): Promise<void> {
  const actualPng = await (surface as unknown as NodeCanvasLike).encode('png');
  const update = inject('updateVisualSnapshots');
  const name = basename(baselinePath);
  const dir = dirname(baselinePath);

  if (!existsSync(baselinePath)) {
    if (process.env.CI) {
      throw new Error(
        `Missing visual baseline ${name}. Run "pnpm test:visual:update" and commit it.`,
      );
    }
    write(baselinePath, actualPng);
    return;
  }

  const [expected, actual] = await Promise.all([
    decode(readFileSync(baselinePath)),
    decode(actualPng),
  ]);
  const sizeMatches = expected.width === actual.width && expected.height === actual.height;
  let differing = Number.POSITIVE_INFINITY;
  let diffPng: Buffer | undefined;
  if (sizeMatches) {
    const diff = createCanvas(actual.width, actual.height);
    const diffCtx = diff.getContext('2d');
    const out = diffCtx.createImageData(actual.width, actual.height);
    differing = pixelmatch(expected.data, actual.data, out.data, actual.width, actual.height, {
      threshold,
      includeAA: false,
    });
    diffCtx.putImageData(out, 0, 0);
    diffPng = await diff.encode('png');
  }

  const allowed = Math.floor(actual.width * actual.height * maxDiffRatio);
  if (differing <= allowed) return;
  if (update) {
    write(baselinePath, actualPng);
    return;
  }

  write(join(dir, '__actual__', name), actualPng);
  if (diffPng) write(join(dir, '__diff__', name), diffPng);
  throw new Error(
    sizeMatches
      ? `${name}: ${differing} pixels differ (allowed ${allowed}). See __snapshots__/__diff__/${name}. ` +
          'If the change is intended, run "pnpm test:visual:update".'
      : `${name}: size changed from ${expected.width}×${expected.height} to ${actual.width}×${actual.height}.`,
  );
}

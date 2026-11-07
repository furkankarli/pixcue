/**
 * Node.js test support for the engine: a canvas factory backed by
 * @napi-rs/canvas and the fonts the built-in themes use. Not part of the
 * browser bundle.
 */
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { type Ctx2D, configureCanvas, type DrawableSurface } from '../src/canvas.ts';

/** Static font files bundled for tests (SIL Open Font License, see fonts/OFL-*.txt). */
const FONTS: readonly [file: string, family: string][] = [
  ['Anton-Regular.ttf', 'Anton'],
  ['ChakraPetch-Bold.ttf', 'Chakra Petch'],
  ['Manrope-Medium.ttf', 'Manrope'],
  ['Manrope-Bold.ttf', 'Manrope'],
  ['Manrope-ExtraBold.ttf', 'Manrope'],
  ['JetBrainsMono-Bold.ttf', 'JetBrains Mono'],
];

let ready = false;

/** A Node.js canvas, typed as the browser surface the engine expects. */
export function createNodeSurface(width: number, height: number): DrawableSurface {
  return createCanvas(Math.max(1, width), Math.max(1, height)) as unknown as DrawableSurface;
}

/**
 * Points the engine at @napi-rs/canvas and registers the theme fonts.
 * Safe to call more than once.
 */
export function setupNodeCanvas(): void {
  if (ready) return;
  for (const [file, family] of FONTS) {
    const path = fileURLToPath(new URL(`./fonts/${file}`, import.meta.url));
    if (!GlobalFonts.registerFromPath(path, family)) throw new Error(`Could not load ${file}`);
  }
  configureCanvas(createNodeSurface);
  ready = true;
}

/** Creates a canvas and its 2D context for a test. */
export function createTestCanvas(
  width: number,
  height: number,
): { canvas: DrawableSurface; ctx: Ctx2D } {
  const canvas = createNodeSurface(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  return { canvas, ctx };
}

export { expectToMatchSnapshot, type SnapshotOptions } from './snapshot.ts';

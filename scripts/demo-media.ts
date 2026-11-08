/**
 * Renders the README's demo animations into docs/media: templates in every
 * theme, in horizontal and vertical frames, over a stand-in for video
 * footage. Needs ffmpeg on PATH. Run `pnpm demo-media` after a visible change
 * to these templates or themes, and commit the GIFs.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createFrame,
  type FramePresetId,
  render,
  resolveTheme,
  scaleFrame,
  type ThemeId,
} from '../packages/engine/src/index.ts';
import { createNodeSurface, setupNodeCanvas } from '../packages/engine/testing/index.ts';
import { createTranslator } from '../packages/i18n/src/index.ts';
import { defaultPosition, findTemplate, resolveFields } from '../packages/templates/src/index.ts';

setupNodeCanvas();
const media = new URL('../docs/media/', import.meta.url).pathname;
mkdirSync(media, { recursive: true });

/** Frames per second of the GIFs: smooth enough, and small files. */
const FPS = 20;

/** A dark, softly lit backdrop standing in for the creator's footage. */
function footage(width: number, height: number) {
  const surface = createNodeSurface(width, height);
  const c = surface.getContext('2d') as unknown as CanvasRenderingContext2D;
  const g = c.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, '#1d2433');
  g.addColorStop(0.55, '#2b2138');
  g.addColorStop(1, '#14171f');
  c.fillStyle = g;
  c.fillRect(0, 0, width, height);
  const glow = c.createRadialGradient(
    width * 0.7,
    height * 0.3,
    0,
    width * 0.7,
    height * 0.3,
    width * 0.6,
  );
  glow.addColorStop(0, 'rgba(255, 190, 140, 0.18)');
  glow.addColorStop(1, 'rgba(255, 190, 140, 0)');
  c.fillStyle = glow;
  c.fillRect(0, 0, width, height);
  return surface;
}

function demo(
  name: string,
  templateId: string,
  theme: ThemeId,
  preset: FramePresetId,
  width: number,
) {
  const template = findTemplate(templateId);
  if (!template) throw new Error(`No template ${templateId}`);
  const base = createFrame(preset);
  const frame = scaleFrame(base, width);
  const canvas = createNodeSurface(frame.pixelWidth, frame.pixelHeight);
  const ctx = canvas.getContext('2d');
  const backdrop = footage(frame.pixelWidth, frame.pixelHeight);
  const fields = resolveFields(
    template,
    {},
    {
      t: createTranslator('en'),
      locale: 'en',
      platform: base.platform,
    },
  );
  const state = {
    frame,
    theme: resolveTheme(theme),
    scene: template.render as never,
    fields,
    duration: template.duration,
    locale: 'en',
    layout: { position: defaultPosition(template, base), offset: { x: 0, y: 0 }, scale: 1 },
    background: {
      kind: 'image' as const,
      image: backdrop as never,
      width: frame.pixelWidth,
      height: frame.pixelHeight,
    },
  };
  const dir = mkdtempSync(join(tmpdir(), 'pixcue-demo-'));
  try {
    const count = Math.round(template.duration * FPS);
    for (let i = 0; i < count; i++) {
      render(ctx as never, i / FPS, state as never);
      // The Node.js test surface is an @napi-rs/canvas canvas underneath.
      const png = (canvas as unknown as { toBuffer(type: 'image/png'): Buffer }).toBuffer(
        'image/png',
      );
      writeFileSync(join(dir, `${String(i).padStart(4, '0')}.png`), png);
    }
    execFileSync('ffmpeg', [
      ...['-hide_banner', '-loglevel', 'error', '-y'],
      ...['-framerate', String(FPS), '-i', join(dir, '%04d.png')],
      ...['-vf', 'split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a'],
      join(media, `${name}.gif`),
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`docs/media/${name}.gif`);
}

// Horizontal frames, two per row in the README. At these widths a pixel-theme
// cell is exactly 2 pixels, so the pixel theme stays crisp.
demo('lower-third-tech', 'lower-third', 'tech', 'youtube', 640);
demo('chapter-title-sade', 'chapter-title', 'sade', 'youtube', 640);
demo('callout-pop', 'callout', 'pop', 'youtube', 640);
demo('score-card-pixel', 'score-card', 'pixel', 'youtube', 640);
// Vertical frames, three per row.
demo('subscribe-pop', 'subscribe', 'pop', 'shorts', 360);
demo('pros-cons-tech', 'pros-cons', 'tech', 'shorts', 360);
demo('spec-card-pixel', 'spec-card', 'pixel', 'shorts', 360);

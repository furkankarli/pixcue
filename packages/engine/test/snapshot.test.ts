import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestCanvas, expectToMatchSnapshot } from '../testing/index.ts';

const dir = mkdtempSync(join(tmpdir(), 'pixcue-snapshot-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function square(color: string) {
  const { canvas, ctx } = createTestCanvas(40, 40);
  ctx.fillStyle = color;
  ctx.fillRect(10, 10, 20, 20);
  return canvas;
}

async function withCI<T>(value: string | undefined, run: () => Promise<T>): Promise<T> {
  const previous = process.env.CI;
  if (value === undefined) delete process.env.CI;
  else process.env.CI = value;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.CI;
    else process.env.CI = previous;
  }
}

describe('expectToMatchSnapshot', () => {
  const baseline = join(dir, 'square.png');

  it('fails on a missing baseline in CI', async () => {
    await withCI('true', async () => {
      await expect(expectToMatchSnapshot(square('#f00'), baseline)).rejects.toThrow(
        /Missing visual baseline/,
      );
    });
  });

  it('writes a missing baseline locally', async () => {
    await withCI(undefined, () => expectToMatchSnapshot(square('#f00'), baseline));
    expect(existsSync(baseline)).toBe(true);
  });

  it('passes for an identical render', async () => {
    await expectToMatchSnapshot(square('#f00'), baseline);
  });

  it('fails and writes a diff when pixels change', async () => {
    await expect(expectToMatchSnapshot(square('#00f'), baseline)).rejects.toThrow(
      /400 pixels differ/,
    );
    expect(existsSync(join(dir, '__diff__', 'square.png'))).toBe(true);
    expect(existsSync(join(dir, '__actual__', 'square.png'))).toBe(true);
  });
});

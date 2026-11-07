import { describe, expect, it } from 'vitest';
import {
  accentTextColor,
  resolveTheme,
  THEME_IDS,
  THEMES,
  themeCase,
  themeFont,
  type VectorTheme,
} from '../src/theme.ts';
import { createTestCanvas } from '../testing/index.ts';

const vector = THEME_IDS.map((id) => THEMES[id]).filter(
  (t): t is VectorTheme => t.kind === 'vector',
);

describe('themes', () => {
  it('has the four built-in themes', () => {
    expect(THEME_IDS).toEqual(['tech', 'pixel', 'pop', 'sade']);
  });

  it.each(vector.map((t) => [t.id, t] as const))(
    '%s draws a panel, button and heading',
    (_, theme) => {
      const { ctx } = createTestCanvas(400, 200);
      theme.panel(ctx, 20, 20, 300, 120);
      theme.button(ctx, 40, 40, 120, 60, theme.accent);
      theme.heading(ctx, 'Ağ', 60, 120, themeFont(theme, 'display', 48), 'left');
      const data = ctx.getImageData(0, 0, 400, 200).data;
      let painted = 0;
      for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) painted++;
      expect(painted).toBeGreaterThan(300 * 120 * 0.5);
    },
  );

  it('builds font strings from roles', () => {
    expect(themeFont(THEMES.tech, 'display', 58)).toBe(
      '700 58px "Chakra Petch", Manrope, sans-serif',
    );
    expect(themeFont(THEMES.sade, 'body', 28, 700)).toBe('700 28px Manrope, sans-serif');
  });

  it('capitalizes headings only in uppercase themes, with Turkish rules', () => {
    expect(themeCase(THEMES.tech, 'kutu açılışı')).toBe('KUTU AÇILIŞI');
    expect(themeCase(THEMES.sade, 'kutu açılışı')).toBe('kutu açılışı');
  });

  it('keeps accent text readable on the pop theme', () => {
    expect(accentTextColor(THEMES.pop, '#FFD21F')).toBe('#111111');
    expect(accentTextColor(THEMES.tech, '#00E5FF')).toBe('#00E5FF');
  });
});

describe('resolveTheme', () => {
  it('uses the default accent unless overridden', () => {
    expect(resolveTheme('tech').accent).toBe('#00E5FF');
    expect(resolveTheme('pixel', { accent: '#22C55E' }).accent).toBe('#22C55E');
  });

  it('puts a custom display font first and keeps the fallbacks', () => {
    const t = resolveTheme('pop', { displayFont: 'Bebas Neue' });
    expect(t.kind === 'vector' && t.fonts.display.family).toBe(
      '"Bebas Neue", Anton, Impact, sans-serif',
    );
  });

  it('does not change the built-in theme objects', () => {
    resolveTheme('tech', { accent: '#000000', displayFont: 'Inter' });
    expect(THEMES.tech.accent).toBe('#00E5FF');
    expect(THEMES.tech.fonts.display.family).toBe('"Chakra Petch", Manrope, sans-serif');
  });
});

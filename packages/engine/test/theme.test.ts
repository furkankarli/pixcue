import { describe, expect, it } from 'vitest';
import {
  accentTextColor,
  labelText,
  labelWidth,
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
    expect(themeCase(THEMES.tech, 'pil', 'tr')).toBe('PİL');
  });

  it('keeps accent text readable on the pop theme', () => {
    expect(accentTextColor(THEMES.pop, '#FFD21F')).toBe('#111111');
    expect(accentTextColor(THEMES.tech, '#00E5FF')).toBe('#00E5FF');
  });
});

describe('semantic colors', () => {
  it('are available on every theme, including pixel', () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].semantic).toEqual({
        positive: '#22C55E',
        negative: '#EF4444',
        spark: '#FFD43B',
      });
    }
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

  it('uses the weight that comes with a custom font', () => {
    const t = resolveTheme('sade', { displayFont: { family: 'Bebas Neue', weight: 400 } });
    expect(t.kind === 'vector' && t.fonts.display).toEqual({
      family: '"Bebas Neue", Manrope, sans-serif',
      weight: 400,
    });
    const keep = resolveTheme('sade', { displayFont: 'Inter' });
    expect(keep.kind === 'vector' && keep.fonts.display.weight).toBe(800);
  });

  it('does not change the built-in theme objects', () => {
    resolveTheme('tech', { accent: '#000000', displayFont: 'Inter' });
    expect(THEMES.tech.accent).toBe('#00E5FF');
    expect(THEMES.tech.fonts.display.family).toBe('"Chakra Petch", Manrope, sans-serif');
  });
});

describe('theme kit', () => {
  const painted = (draw: (ctx: import('../src/canvas.ts').Ctx2D) => void) => {
    const { ctx } = createTestCanvas(400, 300);
    draw(ctx);
    const data = ctx.getImageData(0, 0, 400, 300).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) n++;
    return n;
  };
  const accent = '#FF4FA3';

  describe.each(vector.map((t) => [t.id, t] as const))('%s', (_, theme) => {
    it('draws every part visibly', () => {
      const parts: Record<string, (c: import('../src/canvas.ts').Ctx2D) => void> = {
        card: (c) => theme.card(c, 40, 40, 300, 180, accent),
        chip: (c) => theme.chip(c, 'İNCELEME', 40, 40, 20, accent),
        rule: (c) => theme.rule(c, 40, 40, 10, 150, accent),
        divider: (c) => theme.divider(c, 40, 100, 300, 1),
        meter: (c) => theme.meter(c, 40, 100, 300, 14, 0.7, accent),
        ring: (c) => theme.ring(c, 200, 150, 90, 0.6, accent),
        marker: (c) => {
          theme.marker(c, 100, 150, 24, 'dot', accent, 1);
          theme.marker(c, 200, 150, 24, 'plus', theme.semantic.positive, 1);
          theme.marker(c, 300, 150, 24, 'minus', theme.semantic.negative, 1);
        },
        leader: (c) =>
          theme.leader(
            c,
            [
              { x: 40, y: 260 },
              { x: 150, y: 120 },
              { x: 360, y: 120 },
            ],
            1,
            accent,
          ),
        burst: (c) => theme.burst(c, 200, 150, 0.3, accent, 1),
      };
      for (const [name, draw] of Object.entries(parts))
        expect(painted(draw), name).toBeGreaterThan(200);
    });

    it('measures chips the size it draws them', () => {
      const { ctx } = createTestCanvas(10, 10);
      const measured = theme.chip(ctx, 'BÖLÜM 01', 0, 0, 24, accent, false);
      expect(theme.chip(ctx, 'BÖLÜM 01', 0, 0, 24, accent)).toEqual(measured);
      expect(measured.w).toBeGreaterThan(measured.h);
    });

    it('reveals nothing at 0 and everything at 1', () => {
      const content = (c: import('../src/canvas.ts').Ctx2D) => () => {
        c.fillStyle = '#123456';
        c.fillRect(60, 60, 200, 60);
      };
      expect(painted((c) => theme.reveal(c, 0, 60, 60, 200, 60, accent, content(c)))).toBe(0);
      expect(
        painted((c) => theme.reveal(c, 1, 60, 60, 200, 60, accent, content(c))),
      ).toBeGreaterThanOrEqual(200 * 60);
    });

    it('draws no burst before or after it plays', () => {
      expect(painted((c) => theme.burst(c, 200, 150, 0, accent, 1))).toBe(0);
      expect(painted((c) => theme.burst(c, 200, 150, 1, accent, 1))).toBe(0);
    });

    it('draws labels in its label style', () => {
      const { ctx } = createTestCanvas(10, 10);
      expect(labelWidth(ctx, theme, 'pil', 20, 'tr')).toBeGreaterThan(0);
      expect(labelText(theme, 'pil', 'tr')).toBe(theme.label.uppercase ? 'PİL' : 'pil');
    });
  });

  it('gives each theme its own motion character', () => {
    // pop overshoots, tech and clean do not
    const overshoots = (t: VectorTheme) =>
      [0.5, 0.6, 0.7, 0.8].some((p) => t.motion.pop(p) > 1.001);
    expect(overshoots(THEMES.pop)).toBe(true);
    expect(overshoots(THEMES.tech)).toBe(false);
    expect(overshoots(THEMES.sade)).toBe(false);
  });
});

/** An RGBA color with channels in 0–255. */
export type Rgba = [r: number, g: number, b: number, a: number];

/** Parses `#rgb` / `#rrggbb` into RGB channels. Invalid input gives black. */
export function hexToRgb(hex: string): [number, number, number] {
  let h = String(hex).replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((x) => x + x)
      .join('');
  }
  const n = Number.parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Parses `#hex`, `rgb(…)` or `rgba(…)`. Unknown formats give opaque black. */
export function parseColor(color: string): Rgba {
  const c = String(color).trim();
  if (c[0] === '#') return [...hexToRgb(c), 255];
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m?.[1]) {
    const p = m[1].split(',').map((s) => Number.parseFloat(s));
    const [r = 0, g = 0, b = 0, a] = p;
    return [r | 0, g | 0, b | 0, a === undefined ? 255 : Math.round(a * 255)];
  }
  return [0, 0, 0, 255];
}

/** Formats a color as `#rrggbb`, dropping alpha. */
export function toHex(color: string): string {
  return `#${parseColor(color)
    .slice(0, 3)
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Linear blend from `a` to `b`: `t = 0` gives `a`, `t = 1` gives `b`. Returns `#rrggbb`. */
export function mix(a: string, b: string, t: number): string {
  const A = parseColor(a);
  const B = parseColor(b);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round((A[i] ?? 0) + ((B[i] ?? 0) - (A[i] ?? 0)) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** WCAG relative luminance in [0, 1]. */
export function luminance(color: string): number {
  const [r, g, b] = parseColor(color)
    .slice(0, 3)
    .map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable text color on top of `color`: near-black on light colors, white on dark ones. */
export function onColor(color: string): string {
  return luminance(color) > 0.42 ? '#111111' : '#FFFFFF';
}

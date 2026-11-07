/**
 * Hand-made bitmap fonts for the pixel theme. Each glyph is a list of rows
 * where 'X' is a lit pixel. Uppercase only: text is uppercased before drawing.
 *
 * Turkish letters reuse their base glyph plus a mark drawn in the ascent rows
 * (Ö Ü İ Ğ) or the descent rows (Ç Ş), so every font covers them.
 */

export interface BitmapFont {
  /** Rows above the cap height, used by accents. */
  readonly ascent: number;
  /** Cap height in rows. */
  readonly height: number;
  /** Rows below the baseline, used by the cedilla and commas. */
  readonly descent: number;
  /** Columns between glyphs. */
  readonly gap: number;
  /** Width of a space, in columns. */
  readonly space: number;
  /** Bottom rows drawn in the shade color when shading is on. */
  readonly shadeRows: number;
  readonly glyphs: Readonly<Record<string, readonly string[]>>;
  /** Marks above the cap height for accented capitals. */
  readonly accents: Readonly<Record<string, readonly string[]>>;
  /** The cedilla drawn below Ç and Ş. */
  readonly cedilla: readonly string[];
}

/** 6×7 bold font with shading, for titles. */
export const PIXEL_FONT_BOLD: BitmapFont = {
  ascent: 2,
  height: 7,
  descent: 2,
  gap: 1,
  space: 3,
  shadeRows: 2,
  glyphs: {
    '0': ['.XXXX.', 'XX..XX', 'XX.XXX', 'XXXXXX', 'XXX.XX', 'XX..XX', '.XXXX.'],
    '1': ['..XX..', '.XXX..', 'XXXX..', '..XX..', '..XX..', '..XX..', 'XXXXXX'],
    '2': ['.XXXX.', 'XX..XX', '....XX', '...XX.', '..XX..', '.XX...', 'XXXXXX'],
    '3': ['XXXXX.', '....XX', '....XX', '.XXXX.', '....XX', '....XX', 'XXXXX.'],
    '4': ['...XX.', '..XXX.', '.XXXX.', 'XX.XX.', 'XXXXXX', '...XX.', '...XX.'],
    '5': ['XXXXXX', 'XX....', 'XXXXX.', '....XX', '....XX', 'XX..XX', '.XXXX.'],
    '6': ['.XXXX.', 'XX....', 'XX....', 'XXXXX.', 'XX..XX', 'XX..XX', '.XXXX.'],
    '7': ['XXXXXX', '....XX', '...XX.', '..XX..', '..XX..', '..XX..', '..XX..'],
    '8': ['.XXXX.', 'XX..XX', 'XX..XX', '.XXXX.', 'XX..XX', 'XX..XX', '.XXXX.'],
    '9': ['.XXXX.', 'XX..XX', 'XX..XX', '.XXXXX', '....XX', '....XX', '.XXXX.'],
    A: ['.XXXX.', 'XX..XX', 'XX..XX', 'XXXXXX', 'XX..XX', 'XX..XX', 'XX..XX'],
    B: ['XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.'],
    C: ['.XXXX.', 'XX..XX', 'XX....', 'XX....', 'XX....', 'XX..XX', '.XXXX.'],
    D: ['XXXXX.', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XXXXX.'],
    E: ['XXXXXX', 'XX....', 'XX....', 'XXXXX.', 'XX....', 'XX....', 'XXXXXX'],
    F: ['XXXXXX', 'XX....', 'XX....', 'XXXXX.', 'XX....', 'XX....', 'XX....'],
    G: ['.XXXX.', 'XX..XX', 'XX....', 'XX.XXX', 'XX..XX', 'XX..XX', '.XXXXX'],
    H: ['XX..XX', 'XX..XX', 'XX..XX', 'XXXXXX', 'XX..XX', 'XX..XX', 'XX..XX'],
    I: ['XXXX', '.XX.', '.XX.', '.XX.', '.XX.', '.XX.', 'XXXX'],
    J: ['....XX', '....XX', '....XX', '....XX', 'XX..XX', 'XX..XX', '.XXXX.'],
    K: ['XX..XX', 'XX.XX.', 'XXXX..', 'XXX...', 'XXXX..', 'XX.XX.', 'XX..XX'],
    L: ['XX....', 'XX....', 'XX....', 'XX....', 'XX....', 'XX....', 'XXXXXX'],
    M: ['XX...XX', 'XXX.XXX', 'XXXXXXX', 'XX.X.XX', 'XX...XX', 'XX...XX', 'XX...XX'],
    N: ['XX..XX', 'XXX.XX', 'XXXXXX', 'XX.XXX', 'XX..XX', 'XX..XX', 'XX..XX'],
    O: ['.XXXX.', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXX.'],
    P: ['XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.', 'XX....', 'XX....', 'XX....'],
    Q: ['.XXXX.', 'XX..XX', 'XX..XX', 'XX..XX', 'XX.XXX', 'XX..XX', '.XXX.X'],
    R: ['XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.', 'XXXX..', 'XX.XX.', 'XX..XX'],
    S: ['.XXXXX', 'XX....', 'XX....', '.XXXX.', '....XX', '....XX', 'XXXXX.'],
    T: ['XXXXXX', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..'],
    U: ['XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXX.'],
    V: ['XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXX.', '..XX..'],
    W: ['XX...XX', 'XX...XX', 'XX...XX', 'XX.X.XX', 'XXXXXXX', 'XXX.XXX', 'XX...XX'],
    X: ['XX..XX', 'XX..XX', '.XXXX.', '..XX..', '.XXXX.', 'XX..XX', 'XX..XX'],
    Y: ['XX..XX', 'XX..XX', 'XX..XX', '.XXXX.', '..XX..', '..XX..', '..XX..'],
    Z: ['XXXXXX', '....XX', '...XX.', '..XX..', '.XX...', 'XX....', 'XXXXXX'],
    '.': ['..', '..', '..', '..', '..', 'XX', 'XX'],
    ',': ['..', '..', '..', '..', '..', 'XX', 'XX', 'X.'],
    ':': ['..', 'XX', 'XX', '..', 'XX', 'XX', '..'],
    '!': ['XX', 'XX', 'XX', 'XX', 'XX', '..', 'XX'],
    '?': ['.XXXX.', 'XX..XX', '....XX', '...XX.', '..XX..', '......', '..XX..'],
    '-': ['....', '....', '....', 'XXXX', '....', '....', '....'],
    '+': ['......', '..XX..', '..XX..', 'XXXXXX', '..XX..', '..XX..', '......'],
    '/': ['....XX', '....XX', '...XX.', '..XX..', '.XX...', 'XX....', 'XX....'],
    '%': ['XX..XX', 'XX.XX.', '...XX.', '..XX..', '.XX...', '.XX.XX', 'XX..XX'],
    '(': ['..XX', '.XX.', 'XX..', 'XX..', 'XX..', '.XX.', '..XX'],
    ')': ['XX..', '.XX.', '..XX', '..XX', '..XX', '.XX.', 'XX..'],
    "'": ['XX', 'XX', '..', '..', '..', '..', '..'],
    '"': ['XX.XX', 'XX.XX', '.....', '.....', '.....', '.....', '.....'],
    '·': ['..', '..', '..', 'XX', 'XX', '..', '..'],
    '&': ['.XX...', 'XX.XX.', 'XX.XX.', '.XXX..', 'XX.XXX', 'XX..XX', '.XXX.X'],
    '#': ['.X..X.', 'XXXXXX', '.X..X.', '.X..X.', '.X..X.', 'XXXXXX', '.X..X.'],
  },
  accents: {
    Ö: ['XX..XX'],
    Ü: ['XX..XX'],
    İ: ['.XX.'],
    Ğ: ['.XXXX.'],
  },
  cedilla: ['..XX..', '.XX...'],
};

/** 4×5 font for secondary text. */
export const PIXEL_FONT_SMALL: BitmapFont = {
  ascent: 2,
  height: 5,
  descent: 1,
  gap: 1,
  space: 2,
  shadeRows: 0,
  glyphs: {
    '0': ['.XX.', 'X.XX', 'XX.X', 'X..X', '.XX.'],
    '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
    '2': ['XXX.', '...X', '.XX.', 'X...', 'XXXX'],
    '3': ['XXX.', '...X', '.XX.', '...X', 'XXX.'],
    '4': ['X.X.', 'X.X.', 'XXXX', '..X.', '..X.'],
    '5': ['XXXX', 'X...', 'XXX.', '...X', 'XXX.'],
    '6': ['.XX.', 'X...', 'XXX.', 'X..X', '.XX.'],
    '7': ['XXXX', '...X', '..X.', '.X..', '.X..'],
    '8': ['.XX.', 'X..X', '.XX.', 'X..X', '.XX.'],
    '9': ['.XX.', 'X..X', '.XXX', '...X', '.XX.'],
    A: ['.XX.', 'X..X', 'XXXX', 'X..X', 'X..X'],
    B: ['XXX.', 'X..X', 'XXX.', 'X..X', 'XXX.'],
    C: ['.XXX', 'X...', 'X...', 'X...', '.XXX'],
    D: ['XXX.', 'X..X', 'X..X', 'X..X', 'XXX.'],
    E: ['XXXX', 'X...', 'XXX.', 'X...', 'XXXX'],
    F: ['XXXX', 'X...', 'XXX.', 'X...', 'X...'],
    G: ['.XXX', 'X...', 'X.XX', 'X..X', '.XXX'],
    H: ['X..X', 'X..X', 'XXXX', 'X..X', 'X..X'],
    I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
    J: ['...X', '...X', '...X', 'X..X', '.XX.'],
    K: ['X..X', 'X.X.', 'XX..', 'X.X.', 'X..X'],
    L: ['X...', 'X...', 'X...', 'X...', 'XXXX'],
    M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
    N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'],
    O: ['.XX.', 'X..X', 'X..X', 'X..X', '.XX.'],
    P: ['XXX.', 'X..X', 'XXX.', 'X...', 'X...'],
    Q: ['.XX.', 'X..X', 'X..X', 'X.X.', '.X.X'],
    R: ['XXX.', 'X..X', 'XXX.', 'X.X.', 'X..X'],
    S: ['.XXX', 'X...', '.XX.', '...X', 'XXX.'],
    T: ['XXX', '.X.', '.X.', '.X.', '.X.'],
    U: ['X..X', 'X..X', 'X..X', 'X..X', '.XX.'],
    V: ['X..X', 'X..X', 'X..X', '.XX.', '.XX.'],
    W: ['X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'],
    X: ['X..X', 'X..X', '.XX.', 'X..X', 'X..X'],
    Y: ['X.X', 'X.X', '.X.', '.X.', '.X.'],
    Z: ['XXXX', '...X', '.XX.', 'X...', 'XXXX'],
    '.': ['.', '.', '.', '.', 'X'],
    ',': ['.', '.', '.', '.', 'X', 'X'],
    ':': ['.', 'X', '.', 'X', '.'],
    '!': ['X', 'X', 'X', '.', 'X'],
    '?': ['XXX.', '...X', '.XX.', '....', '.X..'],
    '-': ['...', '...', 'XXX', '...', '...'],
    '+': ['...', '.X.', 'XXX', '.X.', '...'],
    '/': ['..X', '..X', '.X.', 'X..', 'X..'],
    '%': ['X..X', '...X', '.XX.', 'X...', 'X..X'],
    '(': ['.X', 'X.', 'X.', 'X.', '.X'],
    ')': ['X.', '.X', '.X', '.X', 'X.'],
    "'": ['X', 'X', '.', '.', '.'],
    '"': ['X.X', 'X.X', '...', '...', '...'],
    '·': ['.', '.', 'X', '.', '.'],
    '&': ['.X..', 'X.X.', '.X..', 'X.XX', '.XX.'],
    '#': ['.X.X', 'XXXX', '.X.X', 'XXXX', '.X.X'],
  },
  accents: {
    Ö: ['X..X'],
    Ü: ['X..X'],
    İ: ['.X.'],
    Ğ: ['.XX.'],
  },
  cedilla: ['.X..'],
};

/** Accented capitals drawn as base glyph + accent mark. */
const ACCENT_BASE: Readonly<Record<string, string>> = { Ö: 'O', Ü: 'U', İ: 'I', Ğ: 'G' };

/** Capitals drawn as base glyph + cedilla. */
const CEDILLA_BASE: Readonly<Record<string, string>> = { Ç: 'C', Ş: 'S' };

export interface Glyph {
  readonly rows: readonly string[];
  readonly accent?: readonly string[] | undefined;
  readonly cedilla?: readonly string[] | undefined;
}

/**
 * Finds the glyph for one (uppercase) character. Typographic quotes and dashes
 * map to their plain versions, accented letters without a mark of their own
 * fall back to the base letter, and anything unknown draws as "?".
 */
export function glyphFor(font: BitmapFont, char: string): Glyph {
  let ch = char;
  if (ch === '\u2019' || ch === '\u2018') ch = "'";
  if (ch === '\u201C' || ch === '\u201D') ch = '"';
  if (ch === '\u2013' || ch === '\u2014') ch = '-';
  const direct = font.glyphs[ch];
  if (direct) return { rows: direct };
  const accentBase = ACCENT_BASE[ch];
  const accentRows = font.accents[ch];
  const accentGlyph = accentBase ? font.glyphs[accentBase] : undefined;
  if (accentGlyph) return { rows: accentGlyph, accent: accentRows };
  const cedillaBase = CEDILLA_BASE[ch];
  const cedillaGlyph = cedillaBase ? font.glyphs[cedillaBase] : undefined;
  if (cedillaGlyph) return { rows: cedillaGlyph, cedilla: font.cedilla };
  const base = ch.normalize('NFD')[0];
  const baseGlyph = base && base !== ch ? font.glyphs[base] : undefined;
  if (baseGlyph) return { rows: baseGlyph };
  return { rows: font.glyphs['?'] ?? [] };
}

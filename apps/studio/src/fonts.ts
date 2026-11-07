/**
 * Fonts, self-hosted through Fontsource: no request leaves for Google, and the
 * editor works offline. Every font here has the latin-ext subset, which covers
 * Turkish (ğ, ı, İ, ş). The theme fonts are imported by the app entry; the
 * choices below load on demand.
 */
export interface FontChoice {
  readonly id: string;
  readonly family: string;
  /** Weight used for display text; single-weight fonts keep their only weight. */
  readonly weight: number;
  readonly load: () => Promise<unknown>;
}

/** Display fonts users can pick instead of the theme's. */
export const FONTS: readonly FontChoice[] = [
  { id: 'inter', family: 'Inter', weight: 800, load: () => import('@fontsource/inter/800.css') },
  {
    id: 'poppins',
    family: 'Poppins',
    weight: 700,
    load: () => import('@fontsource/poppins/700.css'),
  },
  {
    id: 'montserrat',
    family: 'Montserrat',
    weight: 800,
    load: () => import('@fontsource/montserrat/800.css'),
  },
  {
    id: 'bebas-neue',
    family: 'Bebas Neue',
    weight: 400,
    load: () => import('@fontsource/bebas-neue/400.css'),
  },
  { id: 'oswald', family: 'Oswald', weight: 700, load: () => import('@fontsource/oswald/700.css') },
  {
    id: 'barlow-condensed',
    family: 'Barlow Condensed',
    weight: 700,
    load: () => import('@fontsource/barlow-condensed/700.css'),
  },
  { id: 'rubik', family: 'Rubik', weight: 700, load: () => import('@fontsource/rubik/700.css') },
  {
    id: 'space-grotesk',
    family: 'Space Grotesk',
    weight: 700,
    load: () => import('@fontsource/space-grotesk/700.css'),
  },
  {
    id: 'archivo-black',
    family: 'Archivo Black',
    weight: 400,
    load: () => import('@fontsource/archivo-black/400.css'),
  },
  { id: 'nunito', family: 'Nunito', weight: 800, load: () => import('@fontsource/nunito/800.css') },
  {
    id: 'playfair-display',
    family: 'Playfair Display',
    weight: 700,
    load: () => import('@fontsource/playfair-display/700.css'),
  },
  {
    id: 'dm-serif-display',
    family: 'DM Serif Display',
    weight: 400,
    load: () => import('@fontsource/dm-serif-display/400.css'),
  },
];

export function findFont(id: string | null | undefined): FontChoice | undefined {
  return FONTS.find((f) => f.id === id);
}

/** Text that forces the Turkish (latin-ext) files to load too. */
const SAMPLE = 'AaĞğİıŞşÇçÖöÜü';

/** Theme fonts the canvas needs before the first render. */
const THEME_FACES = [
  '700 40px "Chakra Petch"',
  '400 40px Anton',
  '500 40px Manrope',
  '700 40px Manrope',
  '800 40px Manrope',
];

/** Resolves when the theme fonts are ready to draw on a canvas. */
export function themeFontsReady(): Promise<unknown> {
  return Promise.all(THEME_FACES.map((face) => document.fonts.load(face, SAMPLE)));
}

/** Loads a chosen font (CSS and files) and waits until the canvas can use it. */
export async function loadFont(font: FontChoice): Promise<void> {
  await font.load();
  await document.fonts.load(`${font.weight} 40px "${font.family}"`, SAMPLE);
}

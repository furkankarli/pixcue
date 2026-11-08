# Writing a template

A template is one TypeScript file in `packages/templates/src/`. It declares
the fields the user can edit (the editor builds its form from them), its timing
and default position, and how to draw one frame at a given time, once for the
vector themes (tech, pop, sade) and once for the pixel theme.

## Quick start

```sh
pnpm new-template quote-card
```

This creates `packages/templates/src/quote-card.ts` with a small working
template, adds its strings to every locale file and registers it. Then:

1. Design the template in the new file (the rest of this guide explains how).
2. Write its labels and sample text in `packages/i18n/src/locales/en.ts`, and
   translate the placeholders marked `TODO(i18n)` in the other locale files.
3. Run `pnpm test`. Every registered template is checked automatically: it is
   translated, its defaults are valid, it renders the whole clip in every theme,
   it starts and ends empty, and it fits vertical video.
4. Run `pnpm test:visual`. The first run writes the template's baselines to
   `packages/templates/test/__snapshots__/quote-card/`; look at them before you
   commit.

## Rules every template follows

1. **Frame-aware.** Never assume 1920×1080. Lay out from the frame you receive
   (`width`, `height`, `orientation`, `safeArea`), and design narrow frames on
   purpose instead of shrinking the horizontal layout.
2. **Inside the safe area.** In vertical formats, platform UI covers the top,
   the bottom caption area and the right-hand buttons. The engine anchors your
   graphic inside the safe area and shrinks it to fit; keep `measure` honest so
   it can.
3. **Theme only.** Fonts, colors, surfaces and motion come from the theme:
   `themeFont`, `theme.colors`, `theme.semantic` (positive, negative, spark),
   `theme.motion`, the accent, and the kit (`theme.card`, `chip`, `rule`,
   `divider`, `meter`, `ring`, `marker`, `leader`, `reveal`, `burst`,
   `button`, `heading`, and `drawLabel` for captions). See
   [themes.md](themes.md). Never hardcode a font family or a brand color.
4. **Deterministic.** The same inputs always produce the same pixels. Do not use
   `Date.now()`, `Math.random()` or state kept between frames; use `envelope`,
   the easings and `seededRandom`.
5. **Empty at both ends.** Nothing is drawn at `t = 0` or at `t = duration`, so
   the clip can be cut anywhere in an editor. Skip drawing while an element is
   hidden (shadows and outlines can leak through clips).
6. **Localized copy.** Built-in words such as "Subscribe" or "Follow" come from
   `@pixcue/i18n` and may depend on the platform. User text is drawn as typed;
   when you uppercase it, pass the copy `locale` (Turkish "i" becomes "İ").
7. **Generic icons.** No platform logos or trademarks.

## A complete example

This is exactly what `pnpm new-template title-card` generates (a test keeps the
two in sync). It is a centered card with a title that fades in and out in the
vector themes and pops in with typed text in the pixel theme.

<!-- example:title-card -->
```ts
/**
 * Title card: describe what it shows and where it sits.
 */
import {
  envelope,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelPanel,
  pixelTextStyles,
  popScale,
  textWidth,
  themeCase,
  themeFont,
  typedVisible,
  upper,
  type VectorScene,
  withAlpha,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from './api.ts';

// Fields become the editor form. Labels and sample text live in the locale files.
const fields = {
  title: field.text({
    label: 'templates.titleCard.fields.title',
    maxLength: 40,
    default: ({ t }) => t('templates.titleCard.sample.title'),
  }),
};

export type TitleCardFields = FieldValues<typeof fields>;

// Vector themes (tech, pop, sade), in design units: every frame's short side is 1080.
const vector: VectorScene<TitleCardFields> = {
  // The graphic's natural size; the engine anchors it and shrinks it to fit.
  measure(c, { fields, theme, locale }) {
    const width = textWidth(
      c,
      themeCase(theme, fields.title, locale),
      themeFont(theme, 'display', 64),
    );
    return { w: width + 120, h: 160 };
  },

  // One frame at time `t` (seconds), with the origin at the graphic's top-left.
  draw(c, t, { fields, theme, accent, locale, duration, box }) {
    // Fade in over 0–0.5 s, out over the last 0.4 s; nothing is drawn while hidden.
    const show = envelope(t, duration, 0, 0.5, 0.4, 0);
    if (show <= 0) return;
    withAlpha(c, show, () => {
      theme.card(c, 0, 0, box.w, box.h, accent);
      theme.rule(c, 0, box.h - 8, box.w * show, 8, accent);
      const font = themeFont(theme, 'display', 64);
      const title = themeCase(theme, fields.title, locale);
      theme.heading(
        c,
        title,
        box.w / 2,
        104 + (1 - show) * 20,
        font,
        'center',
        theme.colors.text,
        accent,
      );
    });
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly title: PixelText;
}

// The pixel theme, in grid cells (6 output pixels each at 1080p).
const pixel: PixelScene<TitleCardFields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const title = pixelTextStyles.title(upper(fields.title, locale), accent);
    // The panel sprite adds a 3-cell shadow below.
    return { w: title.w + 16, h: title.h + 8 + 3, title };
  },

  draw(P, t, { accent, duration, box }) {
    // Pop in from the second frame (so the first stays empty), pop out at the end.
    const k = popScale(t, 1 / 30, duration - 0.55, P.px);
    if (k === 0) return;
    const panel = pixelPanel(box.w, box.h - 3, PIXEL_PANEL_FILL);
    if (k !== P.px) {
      P.pop(panel, 0, 0, k);
      return;
    }
    P.img(panel, 0, 0);
    P.rect(4, 4, 2, box.h - 11, accent);
    P.text(box.title, 8, 3, typedVisible(t, 0.3, box.title.length, duration - 1.1));
  },
};

export const titleCard = defineTemplate({
  id: 'title-card',
  name: 'templates.titleCard.name',
  duration: 4,
  minDuration: 2,
  position: 'mc',
  fields,
  render: { vector, pixel },
});
```

Its strings in `packages/i18n/src/locales/en.ts`, inside `templates`:

```ts
titleCard: {
  name: 'Title card',
  fields: {
    title: 'Title',
  },
  sample: {
    title: 'Title card',
  },
},
```

## Fields

Declare fields with the `field` builders. The editor renders a control for each
one, and `resolveFields` validates every value before it reaches your code, so
values from shared links or old presets can never break rendering.

| Builder          | Value                    | Options                                                               |
| ---------------- | ------------------------ | --------------------------------------------------------------------- |
| `field.text`     | `string`                 | `maxLength` (default 80)                                              |
| `field.longText` | `string`                 | `maxLength` (default 400)                                             |
| `field.number`   | `number`                 | `min`, `max`, `step` (default 1)                                      |
| `field.color`    | `#rrggbb`                |                                                                       |
| `field.boolean`  | `boolean`                |                                                                       |
| `field.select`   | one of the option values | `options: [{ value, label }]`                                         |
| `field.list`     | array of items           | `item` columns (`field.item.text`, `field.item.number`), `min`, `max` |

Every field has a `label` (a message key), an optional `help` key and a
`default`. A default is either a value or a function of the locale and
platform, so copy follows the user's language and the chosen format:

```ts
button: field.text({
  label: 'templates.subscribe.fields.button',
  default: ({ t, platform }) =>
    t(platform === 'youtube' ? 'templates.subscribe.sample.subscribe' : 'templates.subscribe.sample.follow'),
}),
bell: field.boolean({ label: 'templates.subscribe.fields.bell', default: ({ platform }) => platform === 'youtube' }),
```

Values the user edits are kept; untouched fields keep following the defaults.
Use lists instead of "label | value" text: `field.list({ item: { label:
field.item.text(...), value: field.item.text(...) } })` gives `{ label, value }[]`.

## Drawing with vector themes

`vector.measure(c, args)` returns the graphic's natural size `{ w, h }` in design
units (every frame's short side is 1080 units, so 4K needs no special case). It
may return extra values that `draw` reuses through `args.box`.

`vector.draw(c, t, args)` paints one frame with the origin at the graphic's
top-left. `args` holds `fields`, `theme`, `accent`, `frame`, `locale`,
`duration` and `box`.

Useful helpers from `@pixcue/engine`:

- Timing: `envelope(t, duration, inStart, inEnd, outStart, outEnd)` for the
  in–hold–out life cycle (outro times count back from the end), the easings
  `easeOut`, `easeIn`, `easeInOut`, `easeOutBack`, `linear`, and `clamp`.
- Text: `themeFont(theme, 'display' | 'body', size, weight)`, `themeCase`,
  `upper`, `textWidth`, `fillTextAt`, `letterPositions` for per-letter motion,
  `formatNumber` for locale-aware numbers.
- Shapes and effects: `roundRectPath`, `withClip`, `withAlpha`, `blockReveal`,
  `drawIcon` with `thumbIcon`, `heartIcon`, `bellIcon`, and `drawCursor`.

## Drawing with the pixel theme

The pixel path draws on a low-resolution grid that is scaled up without
smoothing: one cell is 6 output pixels at 1080p. `pixel.measure(args)` returns
the size in cells; `pixel.draw(P, t, args)` paints with the `Painter`:

- `P.rect`, `P.img` (whole or part of a sprite), `P.text(text, x, y, n)` for the
  first `n` characters, `P.caret`, `P.line`, `P.spark`, `P.clip` / `P.unclip`.
- `P.pop(sprite, x, y, k)` draws a sprite magnified `k` times at full resolution;
  `popScale(t, start, outStart, P.px)` gives the classic pop-in/pop-out steps.
- `typedCount`, `typedVisible` and `typedEnd` time typewriter text.
- `P.origin` and `P.grid` tell where the graphic sits, for animating in from
  off-screen.

Text comes from `pixelTextStyles` (`title`, `big`, `small`, `accent`, `plain`),
shapes from `pixelPanel`, `pixelChip`, `pixelBox`, `bitmapSprite` and `SPRITES`.
For your own sprites use `customSprite(key, w, h, draw)`: it draws once per
key, so the key must include everything that changes the drawing, including
the text.

## Adapting to the frame

- `position` can be a function of the frame:
  `position: (frame) => (frame.orientation === 'horizontal' ? 'mr' : 'mc')`.
- `args.frame.safeArea` tells how much room there is. The pros and cons
  template, for example, stacks its two panels when they would not fit side by
  side.
- `args.frame.platform` (`youtube`, `tiktok`, `instagram` or `any`) can change
  details, like the heart instead of the thumbs-up outside YouTube.

## Translations

Template strings live in `packages/i18n/src/locales/<language>.ts` under
`templates.<camelCaseId>`: `name`, `fields` (labels and help) and `sample`
(default text). The English file is the source; `pnpm typecheck` and
`pnpm test` fail if another language is missing a key.

## Before you open a pull request

- [ ] `pnpm test` passes (translations, defaults, whole-clip render, empty ends, vertical fit)
- [ ] Baselines written with `pnpm test:visual` and checked by eye in every theme
- [ ] Works in horizontal and vertical formats
- [ ] Turkish text renders correctly (try `İıĞğÜüŞşÖöÇç`)
- [ ] A changeset (`pnpm changeset`) describing the new template

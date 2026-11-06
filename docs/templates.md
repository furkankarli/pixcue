# Writing a template

> [!NOTE]
> The template API lands in phase 2. This guide is an outline until then: the
> rules below already apply, while the API sketch and the step-by-step example
> are completed together with the API.

A template is one TypeScript file in `packages/templates/src/`. It declares
which fields the user can edit and how to draw one frame at a given time. The
editor builds the inspector form from the fields, and the exporters call the
renderer once per frame.

## Rules every template follows

1. **Frame-aware.** Never assume 1920×1080. Lay out from the frame you receive
   (`width`, `height`, `orientation`, `safeArea`), and design a vertical layout
   on purpose instead of shrinking the horizontal one.
2. **Inside the safe area.** In vertical formats, platform UI covers the top,
   the bottom caption area and the right-hand buttons. Keep text and key shapes
   inside `safeArea`.
3. **Theme only.** Fonts, colors, panels and buttons come from the theme. Never
   hardcode a font family or a color.
4. **Deterministic.** The same inputs always produce the same pixels. Do not use
   `Date.now()`, unseeded `Math.random()` or state kept between frames; use the
   engine's animation helpers and seeded randomness.
5. **Localized copy.** Built-in words such as "Subscribe" or "Follow" come from
   `@pixcue/i18n` and depend on the platform. User-entered text is drawn as typed.
6. **Turkish-safe.** Test with `İıĞğÜüŞşÖöÇç`. When changing case, use the
   locale-aware helpers, because Turkish dotted and dotless i differ from English.
7. **Generic icons.** No platform logos or trademarks.

## API sketch

The shape being implemented in phase 2:

```ts
import { defineTemplate } from '@pixcue/engine';

export default defineTemplate({
  id: 'lower-third',
  name: 'Lower third',
  duration: 5, // seconds, default length
  minDuration: 2, // the user can shorten it down to this
  fields: {
    title: { type: 'text', label: 'Name', default: 'Furkan Karlı' },
    subtitle: { type: 'text', label: 'Role', default: 'Video creator' },
  },
  render(ctx, t, { frame, theme, fields }) {
    // draw one frame at time t (seconds)
  },
});
```

Field types: `text`, `longText`, `number`, `color`, `boolean`, `select` and
`list`.

## Step by step

_Completed in phase 2:_

1. Scaffold with `pnpm new-template <id>`.
2. Declare the fields.
3. Animate in, hold and out with the animation helpers.
4. Adapt the layout to vertical frames.
5. Add visual snapshots and run `pnpm test:visual`.
6. Add a changeset and open a pull request.

## Complete minimal example

_Completed in phase 2, together with a template in the repository that matches
it exactly and is covered by the tests._

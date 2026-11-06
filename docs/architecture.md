# Architecture

Pixcue is a static web app. Everything runs in the browser: rendering, encoding
and muxing. There is no server and no account. This document describes how the
packages are split and how data flows from a template's fields to an exported
file.

> Interfaces named here are being built in phases 1–3 and may still change.
> This document is updated with them.

## Packages

```text
apps/studio ─┬─► templates ─┬─► engine
             │              └─► i18n
             ├─► engine
             ├─► i18n
             └─► export

engine, i18n and export depend on no other Pixcue package.
```

| Package             | Responsibility                                                                                                                         | May depend on           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `@pixcue/engine`    | Format presets, safe areas, layout, themes, animation and drawing helpers, the pixel engine and bitmap fonts, the `render` entry point | nothing                 |
| `@pixcue/i18n`      | Locale files, language detection, typed translator                                                                                     | nothing                 |
| `@pixcue/templates` | Built-in templates built with `defineTemplate`                                                                                         | engine, i18n            |
| `@pixcue/export`    | PNG sequence zip, MOV (PNG codec), MP4 (H.264), WebM (VP9 + alpha), the muxers and zip writer                                          | nothing                 |
| `@pixcue/studio`    | The editor: form generation, preview, timeline, URL state, presets, export screen                                                      | everything above, Solid |

Rules that keep this healthy:

- **Only the studio knows about Solid.** Engine, templates, export and i18n are
  plain TypeScript. They run in tests under Node and could later power other
  hosts, such as an OBS browser source.
- **Export knows nothing about templates.** It receives a frame source and
  returns a file. Muxers can therefore be tested with synthetic frames.
- **Library packages ship TypeScript source.** Their `exports` point at
  `src/index.ts`. Rsbuild and Vitest compile them directly, so there is no
  per-package build step.
- **Package sources are browser code.** They are typechecked without Node.js
  types; only tests may use Node APIs.

## Data flow

```text
 fields + theme + frame preset          (studio state, mirrored in the URL)
            │
            ▼
 Frame { width, height, orientation, safeArea }   ← engine presets + safe-areas config
 Theme { fonts, colors, panel, button }           ← engine themes + user accent/font
 Copy  { subscribe | follow … }                   ← i18n, by locale and platform
            │
            ▼
 template.render(ctx, t, state)                   ← deterministic: same input, same pixels
            │
            ├──► preview canvas (studio, requestAnimationFrame + scrubber)
            │
            └──► frame source: frame i → t = i / fps → render → canvas
                        │
                        ▼
                 export pipeline (one per format)
                   PNG zip : canvas → PNG → zip writer
                   MOV     : canvas → PNG → QuickTime muxer (png, depth 32)
                   MP4     : canvas → VideoEncoder (H.264) → MP4 muxer
                   WebM    : canvas → VideoEncoder (VP9 + alpha) → Matroska muxer
                        │
                        ▼
                 Blob → download, or Web Share API on phones
```

### Frames and safe areas

Templates never assume 1920×1080. Every render receives the frame: width,
height, orientation and a safe area. The presets are YouTube 1920×1080 and
3840×2160, Shorts/TikTok/Reels 1080×1920, Instagram post 1080×1350 and square
1080×1080. Vertical safe areas keep graphics away from platform UI (top tabs,
the bottom caption area and the right-hand action buttons). The exact insets
live in one config file in the engine so they can be tuned in one place.

### Determinism

`render(ctx, t, state)` is a pure function of its inputs: no `Date.now()`, no
unseeded randomness, no state kept between frames. This is what makes:

- export frame-exact: frame `i` is always rendered at `t = i / fps`
- visual snapshot tests stable: chosen frames are compared pixel by pixel
  against committed PNG baselines
- scrubbing reliable: any frame can be rendered in any order

### Themes

Templates take fonts and colors only from the theme. The tech, pop and sade
themes draw with vector Canvas 2D; the pixel theme uses the pixel engine with
hand-made bitmap fonts that include Turkish characters. Users can override the
accent color and choose from a curated list of Google Fonts with full Turkish
support. The pixel theme always keeps its bitmap fonts.

### State and sharing

The studio keeps its whole state (frame preset, template, field values, theme,
accent, font) serializable, and mirrors it in the URL so any setup can be shared
as a link. Named presets are stored in `localStorage`.

## Hosting

`apps/studio` builds to static files served by Cloudflare Workers static assets.
Cloudflare Workers Builds deploys `main` to production and uploads preview
versions for other branches. See the Deployment section of the
[README](../README.md#deployment) and
[ADR 0005](adr/0005-cloudflare-workers-static-assets.md).

## Decisions

The reasons behind the main choices are recorded as ADRs in [adr/](adr/).

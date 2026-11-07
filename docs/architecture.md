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
| `@pixcue/templates` | The template API (`defineTemplate`, typed fields, `resolveFields`) and the built-in templates                                          | engine, i18n            |
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
 Fields = defaults(locale, platform) + user edits ← templates: resolveFields (validated)
            │
            ▼
 render(ctx, t, state) → template scene          ← deterministic: same input, same pixels
            │
            ├──► preview canvas (studio, requestAnimationFrame + scrubber)
            │
            └──► frame source: frame i → t = i / fps → render → canvas
                        │
                        ▼
                 export pipeline (one per format)
                   PNG zip : canvas → PNG → zip writer
                   MOV     : canvas → PNG → QuickTime muxer (png, depth 32)
                   MP4     : canvas → key color (chroma-key) → VideoEncoder (H.264) → MP4 muxer
                   WebM    : canvas → VideoEncoder (VP9 + alpha) → Matroska muxer
                        │
                        ▼
                 Blob → download, or Web Share API on phones
```

### Frames and safe areas

Templates never assume 1920×1080. They draw in **design units**, where the short
side of every frame is 1080 units, and the engine scales to the output size: one
design unit is one pixel at 1080p and two pixels at 4K. A template therefore
looks the same in every resolution of the same shape.

Every render receives a `Frame`: size in design units, orientation
(`horizontal`, `vertical` or `square`), the safe area, the output size in pixels
and the platform. The presets are:

| Preset                      | Output               | Platform                               |
| --------------------------- | -------------------- | -------------------------------------- |
| `youtube`, `youtube-4k`     | 1920×1080, 3840×2160 | YouTube                                |
| `shorts`, `tiktok`, `reels` | 1080×1920            | YouTube, TikTok, Instagram             |
| `vertical`                  | 1080×1920            | any (strictest safe area of the three) |
| `instagram-post`            | 1080×1350            | Instagram                              |
| `square`                    | 1080×1080            | any                                    |

Vertical safe areas keep graphics away from platform UI (top tabs, the bottom
caption area and the right-hand action buttons). The exact insets live in one
file, [`packages/engine/src/safe-areas.ts`](../packages/engine/src/safe-areas.ts),
so they can be tuned in one place.

The user picks one of nine anchor positions, a drag offset and a scale. The
engine anchors the graphic inside the safe area and shrinks it if it would not
fit.

### Scenes and the two rendering paths

A template's drawing code is a `Scene` with two parts, one per rendering path:

- **Vector** (tech, pop, sade): `measure` returns the graphic's natural size in
  design units, then `draw` paints one frame with Canvas 2D, taking fonts,
  colors, panels, buttons and headings from the theme.
- **Pixel**: `measure` returns a size in grid cells, then `draw` paints with a
  `Painter` on a low-resolution grid that is scaled up without smoothing (6
  output pixels per cell at 1080p). Sprites that "pop" are drawn afterwards at
  full resolution in whole-number steps, which keeps them crisp.

`render(ctx, t, state)` clears the canvas, paints an optional background (a solid
color for green-screen exports, or an image for previews), picks the path from
the theme, places the graphic and returns its bounds in output pixels.

The engine creates its offscreen canvases through a factory: `OffscreenCanvas`
in browsers, and a Node.js canvas in tests (`@pixcue/engine/testing`).

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

### Export

`@pixcue/export` turns a `FrameSource` (size, frame rate, frame count and a
`render(i)` that returns a canvas) into a file. It never sees templates, so the
same exporters work for any drawing code.

| Format             | How                                               | Needs WebCodecs |
| ------------------ | ------------------------------------------------- | --------------- |
| PNG sequence (zip) | Canvas PNG encoding, stored zip                   | no              |
| Transparent MOV    | PNG frames in a QuickTime file (`png `, depth 32) | no              |
| Green-screen MP4   | Frames composited onto a key color, H.264         | yes             |
| Transparent WebM   | VP9 with the alpha plane in BlockAdditions        | yes             |

For chroma keying, frames are composited onto pure green, blue or magenta.
Chroma-key mode makes every pixel either fully graphic or fully background
(alpha below 70 % is dropped), which removes soft shadows and anti-aliased
fringes that keyers turn into halos.

`EDITORS` maps each video editor to the formats it imports well (MOV for
DaVinci Resolve, Premiere Pro and Final Cut Pro; chroma-key MP4 for CapCut and
Instagram Edits). Every muxer is validated against ffprobe and ffmpeg in the
`pnpm test:formats` suite: codec, pixel format including alpha, frame count,
and decoded frames compared with the source.

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

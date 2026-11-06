# Pixcue

**Free, open-source motion graphics for video creators: pick a template, type your text, drop the file into your editor.**

[![CI](https://github.com/furkankarli/pixcue/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/furkankarli/pixcue/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> [!NOTE]
> Pixcue is under active development and v0.1 has not been released yet. The
> features below describe what v0.1 will ship.

**Live:** _coming soon_ <!-- TODO: replace with the production URL -->

<!-- TODO: replace the placeholders with real recordings -->
| Horizontal (YouTube)   | Vertical (Shorts, TikTok, Reels) |
| ---------------------- | -------------------------------- |
| _demo GIF placeholder_ | _demo GIF placeholder_           |

## Features

- **Ready-made templates:** lower thirds, subscribe/follow buttons, chapter
  titles and more. Fill in the fields, preview, export.
- **Horizontal and vertical:** layouts adapt to YouTube (1920×1080, 4K),
  Shorts/TikTok/Reels (1080×1920), Instagram posts (1080×1350) and square
  (1080×1080). Vertical layouts stay clear of platform buttons and captions.
- **Themes:** tech, pop, sade and pixel (with hand-made bitmap fonts). Change
  the accent color and pick from fonts with full Turkish support.
- **Exports for your editor:** transparent MOV, green-screen MP4, transparent
  WebM or a PNG sequence. Pixcue asks which editor you use and picks the format.
- **Platform-aware copy:** "Subscribe" on YouTube, "Follow" on TikTok and
  Instagram, in English and Turkish.
- **Share a setup as a link:** the whole editor state lives in the URL.
- **Private by design:** everything runs in your browser. No uploads, no
  accounts, no server.

## Supported editors

| Editor             | Format Pixcue exports                    | Transparency  |
| ------------------ | ---------------------------------------- | ------------- |
| DaVinci Resolve    | MOV (PNG codec)                          | Alpha channel |
| Adobe Premiere Pro | MOV (PNG codec)                          | Alpha channel |
| Final Cut Pro      | MOV (PNG codec)                          | Alpha channel |
| CapCut (desktop)   | MP4 (H.264) on a green screen            | Chroma key    |
| CapCut (mobile)    | MP4 (H.264) on a green screen            | Chroma key    |
| Instagram Edits    | MP4 (H.264) on a green screen            | Chroma key    |
| Anything else      | WebM (VP9 + alpha) or PNG sequence (zip) | Alpha channel |

The green screen color (green, blue or magenta) is selectable, and a
chroma-key mode removes soft shadows and semi-transparent edges so keying stays
clean.

## Quick start for creators

1. Open Pixcue in your browser (desktop or phone).
2. Choose your video format, for example YouTube or Shorts.
3. Pick a template and a theme, then fill in the text.
4. Press **Export**, choose your editor and download the file.
5. Put the file on a track above your video in your editor.

On a phone, Pixcue offers to share the video straight to your gallery or to
CapCut.

## Quick start for contributors

You need [Node.js](https://nodejs.org) 24 (see [`.nvmrc`](.nvmrc)) and
[pnpm](https://pnpm.io), which Corepack provides:

```sh
git clone https://github.com/furkankarli/pixcue.git
cd pixcue
corepack enable
pnpm install   # also installs the git hooks
pnpm dev       # http://localhost:3000
```

Before opening a pull request:

```sh
pnpm check       # lint and format (Biome)
pnpm typecheck
pnpm test        # unit tests
pnpm test:visual # visual snapshot tests
pnpm build
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the commit convention, the PR flow
and how to write your own template. The code is organized as a pnpm monorepo:

| Path                                       | What it is                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [`packages/engine`](packages/engine)       | Framework-free rendering: frames, safe areas, themes, animation and drawing helpers, pixel engine |
| [`packages/templates`](packages/templates) | Built-in templates, one file each                                                                 |
| [`packages/export`](packages/export)       | Framework-free exporters and muxers: MOV, MP4, WebM, PNG zip                                      |
| [`packages/i18n`](packages/i18n)           | Shared translations, one file per language                                                        |
| [`apps/studio`](apps/studio)               | The editor UI (Solid + Rsbuild)                                                                   |

See [docs/architecture.md](docs/architecture.md) for how they fit together.

## Deployment

The studio is a static site served by
[Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/)
(no Worker script; see [`apps/studio/wrangler.jsonc`](apps/studio/wrangler.jsonc)).
Deploys run through
[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), the
Cloudflare Git integration, not through GitHub Actions.

To set it up once:

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a
   repository** and select `furkankarli/pixcue`.
2. Use these build settings:

   | Setting                              | Value                                                              |
   | ------------------------------------ | ------------------------------------------------------------------ |
   | Project (Worker) name                | `pixcue`. It must match `name` in `wrangler.jsonc`                 |
   | Production branch                    | `main`                                                             |
   | Root directory                       | `/` (repository root)                                              |
   | Build command                        | `pnpm --filter studio build`                                       |
   | Deploy command                       | `npx wrangler deploy --config apps/studio/wrangler.jsonc`          |
   | Non-production branch deploy command | `npx wrangler versions upload --config apps/studio/wrangler.jsonc` |

3. Enable **builds for non-production branches** so every other branch gets a
   preview URL.

Workers Builds reads the Node.js version from `.nvmrc` and the pnpm version from
the `packageManager` field in `package.json`, so no extra build variables are
needed. `wrangler` is a root dev dependency, so `npx wrangler` uses the locked
version.

To check the configuration locally:

```sh
pnpm build
npx wrangler deploy --config apps/studio/wrangler.jsonc --dry-run
```

## Roadmap

Not part of v0.1, planned for later:

- OBS mode (browser source for live streams)
- Sound effects
- Pixel effects (pixelfx)
- Visual template builder
- Publishing the engine and exporters as npm packages
- ProRes export
- Accounts and cloud sync: maybe never. Pixcue is meant to work without them.

Ideas and votes are welcome in
[Discussions](https://github.com/furkankarli/pixcue/discussions).

## License

[MIT](LICENSE) © Furkan Karlı and Pixcue contributors

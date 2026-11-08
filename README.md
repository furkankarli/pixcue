# Pixcue

**Free, open-source motion graphics for video creators: pick a template, type your text, drop the file into your editor.**

[![CI](https://github.com/furkankarli/pixcue/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/furkankarli/pixcue/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%99%A5-ea4aaa.svg)](https://github.com/sponsors/furkankarli)

> [!NOTE]
> Pixcue is under active development and v0.1 has not been released yet. The
> features below describe what v0.1 will ship.

**Live:** [pixcue.furkankarli.com](https://pixcue.furkankarli.com)

| Horizontal (YouTube)                                          | Vertical (Shorts, TikTok, Reels)                                |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| ![A lower third in the tech theme](docs/media/horizontal.gif) | ![A subscribe button in the pop theme](docs/media/vertical.gif) |

## Features

- **Ready-made templates:** lower thirds, subscribe/follow buttons, chapter
  titles and more. Fill in the fields, preview, export.
- **Horizontal and vertical:** layouts adapt to YouTube (1920×1080, 4K),
  Shorts/TikTok/Reels (1080×1920), Instagram posts (1080×1350) and square
  (1080×1080). Vertical layouts stay clear of platform buttons and captions.
- **Themes:** tech, pop, sade and pixel (with hand-made bitmap fonts). Change
  the accent color and pick from fonts with full Turkish support.
- **Exports for your editor:** transparent MOV, chroma-key MP4, transparent
  WebM or a PNG sequence. Pixcue asks which editor you use and picks the format.
- **Platform-aware copy:** "Subscribe" on YouTube, "Follow" on TikTok and
  Instagram, in English and Turkish.
- **Sound effects:** optional clicks, pops, whooshes and chimes in time with
  the animation, in a style that matches each theme. They play in the preview
  and go into the exported file.
- **Share a setup as a link:** the whole editor state lives in the URL.
- **Private by design:** everything runs in your browser. No uploads, no
  accounts, no server.

## Supported editors

| Editor             | Format Pixcue recommends                 | Transparency  |
| ------------------ | ---------------------------------------- | ------------- |
| DaVinci Resolve    | MOV (PNG codec)                          | Alpha channel |
| Adobe Premiere Pro | MOV (PNG codec)                          | Alpha channel |
| Final Cut Pro      | MOV (PNG codec)                          | Alpha channel |
| CapCut (desktop)   | MP4 (H.264) on a key color               | Chroma key    |
| CapCut (phone)     | MP4 (H.264) on a key color               | Chroma key    |
| Instagram Edits    | MP4 (H.264) on a key color               | Chroma key    |
| Anything else      | WebM (VP9 + alpha) or PNG sequence (zip) | Alpha channel |

Every editor can also get the MP4. It is the one file phones and messaging
apps open, so choose it whenever the graphic travels to a phone. With sound
effects on, the MOV and the PNG sequence always carry the sound; the MP4 does
where the browser can encode AAC, and the sound is also offered as a WAV. Pixcue picks
a key color (green, blue or magenta) that the graphic does not use, and a
chroma-key mode removes soft shadows and see-through edges so keying stays
clean.

## Using the file in your editor

Export at the frame rate of your project (30 fps unless you know otherwise),
then follow the steps for your editor.

### DaVinci Resolve

1. Import the MOV into the Media Pool and drag it onto a video track above
   your footage.
2. The background is already transparent; no keying is needed.
3. If you see a black box instead, right-click the clip in the Media Pool,
   open **Clip Attributes** and set **Alpha Mode** to **Straight**.

### Adobe Premiere Pro

1. Import the MOV and place it on a track above your clip (for example V2).
2. Premiere reads the alpha channel on its own.
3. If the background shows, right-click the clip in the Project panel and
   check the alpha settings under **Modify → Interpret Footage**.

### Final Cut Pro

1. Import the MOV and connect it above your clip in the timeline.
2. It keeps its transparency.

### CapCut (desktop)

1. Import the MP4 and drag it onto a track above your video.
2. In the clip's video settings, turn on **Chroma key**, pick the background
   color with the color picker and raise the strength until it disappears.
3. Keep Pixcue's chroma-key mode on for the cleanest edges.

### CapCut (phone)

1. Export on your phone and tap **Share** to save the video, or send the MP4
   from your computer. A MOV or WebM will not open on a phone.
2. In CapCut, add the video with **Overlay**, then open its background
   removal options, choose **Chroma key**, pick the background color and
   adjust the strength.

### Instagram Edits

1. Save the MP4 to your phone, as for CapCut.
2. Add it as an overlay and remove the background color with the chroma key
   tool.

### Other editors

1. Choose the transparent WebM if your editor reads VP9 with alpha; it gives
   small files.
2. Otherwise choose the PNG sequence, unzip it and import the frames as one
   image sequence clip at your project's frame rate.

### When something looks wrong

- **The file will not download on a phone, or a messaging app rejects it:**
  export the MP4. Phones cannot open transparent MOV, WebM or PNG files.
- **Playback stutters in a media player:** a transparent MOV is meant for
  editors, not players; at 60 fps and 1080p it is too heavy for most players.
  Check it in your editor instead.
- **Keying leaves holes in the graphic:** pick another key color. Pixcue warns
  you when the graphic uses the one you chose.
- **The graphic sits under platform buttons in a vertical video:** turn on
  **Safe area** and **App buttons** in the **View** menu under the preview,
  then move the graphic with the mouse, the arrow keys or the **Layout** tool.

## Quick start for creators

1. Open Pixcue in your browser (desktop or phone).
2. Choose your video format, for example YouTube or Shorts.
3. Pick a template and a theme, then fill in the text.
4. Press **Export**, choose your editor and download the file.
5. Put the file on a track above your video in your editor. The steps for
   each editor are under [Using the file in your editor](#using-the-file-in-your-editor).

On a phone, the finished video opens the share sheet: choose **Save Video**
on iPhone to put it in Photos, or send it straight to CapCut.

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
4. Under the Worker's **Settings → Domains & Routes**, add the custom domain
   `pixcue.furkankarli.com` (its zone must be on the same Cloudflare account).
   The social preview tags point there, so link previews need it.

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
- Pixel effects (pixelfx)
- Visual template builder
- Publishing the engine and exporters as npm packages
- ProRes export
- Accounts and cloud sync: maybe never. Pixcue is meant to work without them.

Ideas and votes are welcome in
[Discussions](https://github.com/furkankarli/pixcue/discussions).

## Support Pixcue

Pixcue is free and stays free, with no accounts and no ads. If it saves you
time, you can support its development through
[GitHub Sponsors](https://github.com/sponsors/furkankarli).

## License

[MIT](LICENSE) © Furkan Karlı and Pixcue contributors

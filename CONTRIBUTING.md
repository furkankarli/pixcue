# Contributing to Pixcue

Thanks for helping! Pixcue grows through outside contributions: new templates,
translations, bug fixes and editor support. This guide covers everything you
need to get a change merged.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
For security problems, follow [SECURITY.md](SECURITY.md) instead of opening an
issue.

## Ways to contribute

- **Report a bug:** use the bug report form. The editor, OS, browser and export
  format help us reproduce it.
- **Propose a template:** use the new template form before writing code, so we
  can agree on the design.
- **Translate:** add your language with a single file (see
  [Adding a language](#adding-a-language)).
- **Pick up an issue:** look for
  [`good first issue`](https://github.com/furkankarli/pixcue/labels/good%20first%20issue)
  and
  [`help wanted`](https://github.com/furkankarli/pixcue/labels/help%20wanted).
  Comment on it first so nobody else works on the same thing.
- **Ask a question or share an idea:** use
  [Discussions](https://github.com/furkankarli/pixcue/discussions).

## Development setup

Requirements:

- Node.js 24 (`nvm use` reads [`.nvmrc`](.nvmrc))
- pnpm, through Corepack: `corepack enable`. The version comes from
  `packageManager` in `package.json`.
- ffmpeg with libx264 and libvpx (most distributions' full builds), only to run
  the export format tests (`pnpm test:formats`)

```sh
git clone https://github.com/<you>/pixcue.git
cd pixcue
pnpm install   # installs dependencies and the git hooks (lefthook)
pnpm dev       # studio at http://localhost:3000
```

### Scripts

| Command                         | What it does                                                |
| ------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                      | Run the studio with hot reload                              |
| `pnpm build`                    | Production build of the studio into `apps/studio/dist`      |
| `pnpm check` / `pnpm check:fix` | Lint and format with Biome / apply fixes                    |
| `pnpm typecheck`                | TypeScript in every package                                 |
| `pnpm test` / `pnpm test:watch` | Unit tests                                                  |
| `pnpm test:visual`              | Visual snapshot tests                                       |
| `pnpm test:visual:update`       | Rewrite visual baselines (see below)                        |
| `pnpm test:formats`             | Export a short clip per format and validate it with ffprobe |
| `pnpm changeset`                | Add release notes for your change                           |
| `pnpm brand`                    | Regenerate the favicon, app icons and social preview        |
| `pnpm demo-media`               | Regenerate the README's demo GIFs (needs ffmpeg)            |

## Project structure

```text
apps/studio          Editor UI (Solid + Rsbuild). The only package using a UI framework.
packages/engine      Frames, safe areas, themes, animation/drawing helpers, pixel engine
packages/templates   Built-in templates, one file per template
packages/export      Exporters, muxers and zip writer
packages/i18n        Translations shared by the studio and templates
docs/                Architecture, ADRs, template guide
```

Dependency rules, so the packages stay reusable:

- `engine`, `export` and `i18n` depend on no other Pixcue package.
- `templates` depends only on `engine` and `i18n`.
- Only `studio` uses Solid, and it is the only place that wires everything
  together.
- Package code runs in the browser. Node.js APIs are allowed in tests only;
  `pnpm typecheck` enforces this.

The reasons behind these choices are in [docs/adr/](docs/adr/), and the data
flow is in [docs/architecture.md](docs/architecture.md).

## Code style

- TypeScript in strict mode everywhere. Code, comments and docs are in English.
- Biome formats and lints. The pre-commit hook fixes staged files, so you
  rarely need to think about it.
- Every string the user sees goes through `@pixcue/i18n`. Never hardcode UI text.

## Commit messages

Every commit follows [Conventional Commits](https://www.conventionalcommits.org)
with a required scope:

```text
<type>(<scope>): <summary in the imperative, lower case>
```

| Types                                       | Scopes                                      |
| ------------------------------------------- | ------------------------------------------- |
| `feat` new feature                          | `engine`                                    |
| `fix` bug fix                               | `export`                                    |
| `docs` documentation only                   | `templates`                                 |
| `refactor` no behavior change               | `studio`                                    |
| `test` tests only                           | `i18n`                                      |
| `build` tooling, dependencies, build config | `repo` (root config, docs, community files) |
| `ci` GitHub Actions                         | `deps` (dependency updates)                 |
| `chore` anything else                       | `release` (version bumps)                   |

Examples:

```text
feat(templates): add countdown template
fix(export): write correct duration for 25 fps MOV files
docs(repo): explain how to update visual snapshots
```

The `commit-msg` hook checks this locally, and CI checks it again on every pull
request.

Keep commits **small and atomic**: one logical change per commit, and every
commit builds and passes the tests. Never mix formatting churn with behavior
changes; if a file needs reformatting, do it in a separate commit.

## Branches and pull requests

`main` is always deployable. All work happens on branches and lands through
pull requests.

1. Fork the repository and create a branch from `main`, for example
   `feat/countdown-template` or `fix/mov-duration`.
2. Make your change with tests, and add a changeset if users will notice it
   (see below).
3. Run `pnpm check && pnpm typecheck && pnpm test && pnpm test:visual`.
4. Open a pull request and fill in the checklist.

### How pull requests are merged

- **Contributions from forks are squash-merged.** Your PR becomes one commit on
  `main`, and **the PR title becomes its commit message**. The title must
  therefore follow the commit convention above, and CI checks it (the
  "Conventional PR title" check). Commits inside your branch can be anything.
- **Maintainer branches in this repository are rebase-merged.** For example,
  the `phase/*` branches and Dependabot updates keep every commit on `main`, so
  each commit must follow the convention and pass the build on its own. CI
  checks every commit of these PRs (the "Conventional commits" check).

### Changesets

If your change affects users (a feature, a fix or a template), add a changeset:

```sh
pnpm changeset
```

Choose `patch` for fixes and `minor` for features, then write one or two
sentences for the changelog. All packages share one version. Docs, CI and pure
refactors need no changeset. See [.changeset/README.md](.changeset/README.md).

## Tests

- **Unit tests** live next to each package in `test/*.test.ts` and run with
  Vitest: `pnpm test`.
- **Visual snapshot tests** (`test/*.visual.test.ts`) render chosen frames of
  every template in every theme and format to PNG, then compare them pixel by
  pixel with the committed baselines in `test/__snapshots__/`. They run on a
  Node.js canvas with the theme fonts bundled in
  `packages/engine/testing/fonts/`, so no browser is needed.
- **Format tests** (`test/*.format.test.ts`) export short clips and validate the
  codec, pixel format (including alpha) and frame count with ffprobe. They need
  ffmpeg installed.

### Updating visual snapshots

When you change how something looks on purpose:

```sh
pnpm test:visual          # see which frames differ
pnpm test:visual:update   # rewrite the baselines
```

Open the changed PNGs and check them before committing. Commit the new
baselines together with the change that caused them, and say in the PR that the
snapshots changed on purpose. Never update baselines just to make a failing
test pass.

Good to know:

- A test with no baseline yet writes one when you run it locally. In CI a
  missing baseline is an error, so commit new baselines with your change.
- When a frame differs, the test writes `__snapshots__/__actual__/` and
  `__snapshots__/__diff__/` images next to the baseline (git-ignored). In CI
  they are uploaded as the `visual-diffs` artifact of the failed run.
- Baselines are rendered on Linux, as in CI. On macOS and Windows, text can
  rasterize slightly differently; if only anti-aliased text edges differ, rely
  on CI and do not commit baselines rendered on those systems.

## Before you open a PR

Templates and anything that draws must:

- work in **horizontal and vertical** formats and stay inside the safe areas
- render **Turkish characters** correctly (try `İıĞğÜüŞşÖöÇç`)
- take fonts and colors **from the theme**, never hardcoded
- use **generic icons only**, no platform logos

## Write your own template

Templates are single TypeScript files in `packages/templates`. Each one declares
its fields, and the editor builds the form from them. The full guide with a
complete example is in [docs/templates.md](docs/templates.md). In short:

1. Open a "New template" issue with a sketch or reference.
2. Scaffold it: `pnpm new-template quote-card`. This creates a working
   template, adds its strings to every locale and registers it.
3. Declare the fields (text, number, color, select, list…) and draw one frame
   at time `t`, once for the vector themes and once for the pixel theme.
4. Use the frame size and safe area you are given, and lay out differently
   for vertical frames.
5. Run `pnpm test` and `pnpm test:visual` (the first run writes your
   baselines), check the PNGs, add a changeset and open a PR.

## Adding a language

1. Copy `packages/i18n/src/locales/en.ts` to `packages/i18n/src/locales/<code>.ts`,
   where `<code>` is a BCP 47 tag such as `de` or `pt-BR`.
2. Wrap it in `defineLocale({ ... })` (see `tr.ts`), set `code` and `name`
   (the language's own name for itself), and translate every message. Keep
   `{placeholders}` as they are.
3. Register the file with one line in `packages/i18n/src/locales/index.ts`.
4. Run `pnpm typecheck && pnpm test`. These fail if a key is missing, extra or
   misspelled, or if the file is not registered.

## Labels

Maintainers triage issues with the labels described in
[docs/labels.md](docs/labels.md).

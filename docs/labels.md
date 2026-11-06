# Issue and pull request labels

| Label              | Color    | Use for                                                    |
| ------------------ | -------- | ---------------------------------------------------------- |
| `bug`              | `d73a4a` | Something renders, exports or behaves incorrectly          |
| `enhancement`      | `a2eeef` | New feature or improvement                                 |
| `template`         | `fbca04` | New templates and changes to existing ones                 |
| `engine`           | `5319e7` | Rendering engine, themes, pixel engine (`packages/engine`) |
| `export`           | `0e8a16` | Export formats and muxers (`packages/export`)              |
| `studio`           | `1d76db` | Editor UI (`apps/studio`)                                  |
| `i18n`             | `c5def5` | Translations and localized copy (`packages/i18n`)          |
| `good first issue` | `7057ff` | Small, well-described tasks for new contributors           |
| `help wanted`      | `008672` | Maintainers would welcome a contribution                   |
| `dependencies`     | `0366d6` | Dependency updates (applied by Dependabot)                 |

The issue forms apply `bug`, `enhancement` and `template` automatically. Add an
area label (`engine`, `export`, `studio`, `i18n`) when triaging.

## Creating the labels

With the [GitHub CLI](https://cli.github.com), from the repository root.
`--force` updates labels that already exist, such as GitHub's defaults:

```sh
gh label create "bug"              --color d73a4a --description "Something renders, exports or behaves incorrectly" --force
gh label create "enhancement"      --color a2eeef --description "New feature or improvement" --force
gh label create "template"         --color fbca04 --description "New templates and changes to existing ones" --force
gh label create "engine"           --color 5319e7 --description "Rendering engine, themes, pixel engine" --force
gh label create "export"           --color 0e8a16 --description "Export formats and muxers" --force
gh label create "studio"           --color 1d76db --description "Editor UI" --force
gh label create "i18n"             --color c5def5 --description "Translations and localized copy" --force
gh label create "good first issue" --color 7057ff --description "Small, well-described tasks for new contributors" --force
gh label create "help wanted"      --color 008672 --description "Maintainers would welcome a contribution" --force
gh label create "dependencies"     --color 0366d6 --description "Dependency updates" --force
```

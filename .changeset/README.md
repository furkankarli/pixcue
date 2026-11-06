# Changesets

This folder holds pending release notes. Every pull request that changes what
users get (a feature, a fix, a new template) adds one file here:

```sh
pnpm changeset
```

Pick the packages you touched, the bump type and write one or two sentences for
the changelog, written for users rather than developers.

- All `@pixcue/*` packages share one version (a fixed group), so pick the bump
  for the change as a whole: `patch` for fixes, `minor` for new features and
  templates. Pixcue is pre-1.0, so breaking changes are `minor` too.
- Docs, CI and refactors with no user-visible effect need no changeset.

Maintainers run `pnpm changeset version` when cutting a release; it bumps the
versions and writes the changelogs. See https://changesets.dev for details.

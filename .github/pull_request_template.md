## What and why

<!-- What does this change, and why? Link the issue: "Closes #123". -->

## How to check

<!-- Steps or a setup link a reviewer can open to see the change. -->

## Checklist

- [ ] The PR title follows Conventional Commits, e.g. `feat(templates): add countdown template`
- [ ] Tests pass locally (`pnpm check && pnpm typecheck && pnpm test && pnpm test:visual`)
- [ ] Visual snapshots are unchanged, or updated on purpose and checked by eye
- [ ] Works in horizontal **and** vertical formats
- [ ] Turkish characters render correctly (`İıĞğÜüŞşÖöÇç`)
- [ ] Changeset added (`pnpm changeset`), or not needed (docs, CI, refactor)

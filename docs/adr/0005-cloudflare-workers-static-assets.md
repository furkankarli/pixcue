# 0005. Cloudflare Workers static assets for hosting

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

The studio is a fully static single-page app: no server code, no database, no
accounts. It needs fast global hosting, preview deployments for branches, and a
setup that is simple to understand and costs nothing at this scale.

Cloudflare offers two products for this: Pages and Workers with static assets.
Cloudflare now steers new projects toward Workers static assets, which share
configuration, tooling (`wrangler`) and features with the rest of Workers.

## Decision

- Host `apps/studio` on **Cloudflare Workers static assets**, configured in
  `apps/studio/wrangler.jsonc` with `assets.directory` and no Worker script.
  Unknown paths serve `index.html` (`single-page-application` mode).
- Deploy with **Cloudflare Workers Builds** (the Git integration). Pushes to
  `main` deploy to production; other branches upload preview versions with
  their own URLs. There is no deploy workflow in GitHub Actions.

## Consequences

- No deployment secrets live in GitHub, and CI only verifies the build.
- Deploy settings (build and deploy commands) live in the Cloudflare dashboard
  and are documented in the README so they can be recreated.
- Preview builds also run for branches pushed to this repository. Pull requests
  from forks get no preview URL.
- If the app ever needs server logic (for example short links), it can be added
  as a Worker script in the same project without changing hosts.

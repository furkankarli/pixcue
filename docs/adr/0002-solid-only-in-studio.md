# 0002. Solid only in the editor

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

The editor has a lot of fine-grained, fast-changing UI: a timeline scrubber, a
playing preview, an inspector generated from template fields, and URL state
updated on every edit. It also has to work well on low-end phones. At the same
time, a UI framework must not leak into the engine, templates or exporters (see
[ADR 0001](0001-typescript-framework-free-engine.md)).

## Decision

- `apps/studio` uses [Solid](https://www.solidjs.com) 1.x, built with
  [Rsbuild](https://rsbuild.rs).
- Solid is a dependency of the studio only. No other package may import it.

## Consequences

- Solid's fine-grained reactivity updates only what changed, without a virtual
  DOM, and its runtime is small. That suits phones and per-frame UI updates.
- Contributors who know React will find the JSX familiar, but must learn
  Solid's rules: components run once, and props must not be destructured.
- Replacing the UI framework later only touches `apps/studio`.

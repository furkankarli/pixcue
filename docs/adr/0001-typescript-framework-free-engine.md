# 0001. TypeScript everywhere, framework-free engine

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

The prototype is a single HTML file with untyped JavaScript. It works, but
rendering, UI state and export are tangled together, so it is hard for
contributors to change one part safely. Pixcue needs the rendering code in
several places: the editor preview, the exporter, visual snapshot tests running
in Node.js, and later possibly an OBS browser source or an npm package.

## Decision

- All code is TypeScript in strict mode, in a pnpm workspace.
- The engine (frames, safe areas, themes, animation and drawing helpers, pixel
  engine) and the templates are plain TypeScript with no UI framework. They draw
  through a minimal Canvas 2D interface, so the same code runs on a browser
  canvas and on a Node.js canvas in tests.
- Rendering is a deterministic function, `render(ctx, t, state)`, with no hidden
  state, clock or unseeded randomness.

## Consequences

- Templates and the engine can be tested and snapshot-tested without a browser
  or a UI framework.
- The renderer can be reused by other hosts without pulling in the editor.
- Contributors get type errors for wrong field types, missing theme roles and
  wrong frame assumptions before running anything.
- The Canvas 2D interface the engine relies on has to stay small enough that
  both browser and Node.js canvases implement it.

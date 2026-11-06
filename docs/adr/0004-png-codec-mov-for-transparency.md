# 0004. PNG-codec MOV for transparent video

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

Creators using DaVinci Resolve, Premiere Pro and Final Cut Pro want overlays with
a real alpha channel, not a green screen. The common alpha-capable formats are:

- **ProRes 4444:** the industry standard, but there is no browser encoder and
  writing one is a large project.
- **WebM with VP9 alpha:** WebCodecs can produce it, but desktop editors support
  it unevenly.
- **QuickTime MOV with the PNG codec:** every frame is a PNG image (lossless,
  8-bit RGBA). It is widely supported by desktop editors and can be produced
  with the Canvas API alone.

## Decision

The primary transparent format is MOV with the PNG codec:

- `ftyp` brand `qt  `, and a sample description of type `png ` with depth 32
- every frame is a sync sample: no `avcC` and no `ctts`
- `moov` is written before `mdat`

The writer is derived from our MP4 muxer, unless Mediabunny turns out to support
MOV with the PNG codec under a compatible license. This is checked in phase 3,
before the writer is built.

Transparent WebM and PNG sequence zips remain available as secondary options.
Apps without good alpha import (CapCut, Instagram Edits) get a green-screen MP4
instead.

## Consequences

- Transparent export works in every browser that has a canvas, with no
  WebCodecs needed.
- Files are large, because frames are lossless. That is acceptable for short
  overlays, but the export screen should show the expected size.
- ProRes stays out of scope for v0.1 and is listed on the roadmap.

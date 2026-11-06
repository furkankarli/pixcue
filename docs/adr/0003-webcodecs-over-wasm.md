# 0003. WebCodecs instead of WASM encoders

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

Pixcue must produce MP4 (H.264) and WebM (VP9 with alpha) entirely in the
browser. The usual options are:

- **ffmpeg.wasm or similar WASM builds:** they support every codec, but the
  download is tens of megabytes, encoding runs on the CPU without hardware
  acceleration, and the GPL/LGPL licensing complicates an MIT project.
- **WebCodecs:** the browser's own encoders, often hardware accelerated, with no
  extra download. They output raw encoded chunks, so the app has to write the
  container (MP4 or Matroska) itself.

The prototype already uses WebCodecs, with its own MP4 and Matroska muxers that
were verified frame-exact with ffmpeg, including B-frames and VP9 alpha.

## Decision

Encode MP4 and WebM with WebCodecs and write the containers with our own muxers
in `@pixcue/export`, ported from the prototype. PNG-based outputs (PNG sequence,
PNG-codec MOV) encode frames with the Canvas API and need no video encoder.

## Consequences

- The app stays small and exports quickly, using hardware encoders where the
  device has them.
- Encoder support varies by browser and platform. The export screen has to
  check support (`VideoEncoder.isConfigSupported`) and offer formats that work.
  The PNG sequence and MOV paths do not depend on WebCodecs.
- We maintain the muxers ourselves, so every format has an automated test that
  validates its output with ffprobe in CI.
- If a well-maintained, MIT-compatible muxing library covers a format with the
  same guarantees, we may adopt it in a later ADR. Mediabunny is evaluated for
  the MOV muxer in phase 3.

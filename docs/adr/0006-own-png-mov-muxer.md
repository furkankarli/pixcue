# 0006. Own muxer for PNG-codec MOV

- **Status:** Accepted
- **Date:** 2026-11-07

## Context

[ADR 0004](0004-png-codec-mov-for-transparency.md) chose QuickTime MOV with the
PNG codec as the transparent format and asked to check, before writing a
muxer, whether [Mediabunny](https://github.com/Vanilagy/mediabunny) could
produce it.

Mediabunny 1.65.2 (MPL-2.0) is a well-maintained TypeScript media toolkit. It
writes QuickTime files (`MovOutputFormat`), but its video codecs are `avc`,
`hevc`, `vp9`, `av1`, `vp8` and `prores`. There is no PNG codec, so it cannot
write the file we need.

## Decision

Write the PNG-codec MOV muxer ourselves in `@pixcue/export`, derived from the
existing MP4 muxer: `ftyp` brand `qt  `, sample description `png ` with depth
32, every frame a sync sample, no `avcC` or `ctts`, `moov` before `mdat`. Keep
our verified MP4 and Matroska muxers as well, so the three containers share
one small code base without a dependency.

## Consequences

- No new runtime dependency; the muxers stay a few hundred lines that tests
  validate against ffprobe and ffmpeg.
- If Pixcue later needs containers or codecs we do not support (for example
  audio or ProRes), Mediabunny is the first candidate. Its MPL-2.0 license is
  file-level copyleft and works as a dependency of an MIT project.

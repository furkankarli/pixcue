# Themes

A theme is a complete visual language, not a color swap. Every template draws
its panels, labels, dividers, meters, markers and text reveals through the
theme, and takes its motion character from it, so a lower third and a score card
in the same theme clearly belong together, and the same template looks
distinctly different in each theme.

This document is the design reference for the four built-in themes. Change it
together with the code in `packages/engine/src/themes/`.

## The theme kit

What every vector theme provides (see `VectorTheme` in
`packages/engine/src/theme.ts`):

| Part             | Used for                                                         |
| ---------------- | ---------------------------------------------------------------- |
| `card`           | Card surfaces: lower third, spec card, score card, pros and cons |
| `chip`           | Small labels: tags, chapter numbers                              |
| `label`          | Captions in the theme's label font, tracking and case            |
| `heading`        | Large text over video, with the theme's treatment                |
| `rule`           | Accent bars and lines                                            |
| `divider`        | Separators between rows and under titles                         |
| `meter` / `ring` | Scores and progress                                              |
| `marker`         | Plus, minus and dot badges; the callout's anchor                 |
| `leader`         | The callout's line from anchor to label                          |
| `reveal`         | How text appears (scan, block, fade)                             |
| `burst`          | Feedback when something is clicked or tapped                     |
| `motion`         | Easing for entering, leaving and popping elements                |

Templates decide _what_ appears and _when_; the theme decides _how it looks
and moves_.

## Tech: heads-up display

Inspired by film and game HUDs: a precise, technical overlay on top of the
picture.

- **Shapes.** Chamfered panels (two cut corners) with a thin luminous outline,
  90° corner brackets, faint horizontal scanlines, tick marks along edges.
- **Type.** Chakra Petch for headings, uppercase with wide tracking. Labels in
  JetBrains Mono, uppercase, tracked, in the accent color: they read like
  data readouts.
- **Color.** Dark translucent glass, neon accent with a soft glow, cool grey
  secondary text.
- **Lines and data.** Dashed dividers with ticks, segmented meters and rings,
  bracketed chips (`[ REVIEW ]`).
- **Motion.** Fast and exact: exponential ease-out, no overshoot; exits
  accelerate away on a cubic curve. Text is revealed by a bright scan line;
  elements flicker briefly as they power on.

## Pop: comic pop art

Pop art and neo-brutalism: loud, flat and confident, like a comic panel or a
sticker sheet.

- **Shapes.** Thick black outlines on everything, hard offset black shadows
  with no blur, flat fills, Ben-Day halftone dots, slightly tilted stickers.
- **Type.** Anton, uppercase, heavy; headings carry a black outline and an
  offset copy in the accent color. Labels are heavy uppercase body text.
- **Color.** Saturated accent, black and white, used at full strength.
- **Lines and data.** Chunky outlined dividers, striped meters with outlines,
  starburst markers.
- **Motion.** Bouncy: strong overshoot, squash and stretch, quick stagger;
  exits ease in and out. Text is revealed by a solid accent block that wipes
  away.

## Clean (Sade): Swiss minimal

The International Typographic Style: clarity first, nothing decorative that
does not carry information.

- **Shapes.** White cards with generous padding, large radius, a soft diffuse
  shadow, no outlines.
- **Type.** Manrope, sentence case, tight tracking. Labels are small, bold,
  uppercase and tracked, in a muted grey; the accent is used sparingly.
- **Color.** White, near-black text, one accent for small details only.
- **Lines and data.** Hairline dividers, thin rounded meters and rings, soft
  pill chips tinted with the accent.
- **Motion.** Calm: cubic ease-in-out, no overshoot, short travel. Text fades
  in while sliding up a few units.

## Pixel: retro game UI

The 8- and 16-bit game interface, drawn on a pixel grid with hand-made bitmap
fonts (including Turkish letters).

- **Shapes.** Bevelled panels with a white rim and black border, chunky
  sprites, hard pixel shadows.
- **Type.** The bitmap fonts only; text types itself in with a blinking caret.
- **Motion.** Whole-number pops (1×, 2×, 3× …) and frame-stepped movement,
  like a game running at 30 frames per second.

The pixel theme draws through the pixel engine (`Painter`), not the vector kit.

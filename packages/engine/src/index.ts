/**
 * @pixcue/engine
 *
 * Framework-free rendering core. Owns format presets and safe areas, the
 * frame/layout system, themes, animation and drawing helpers, the pixel engine
 * with its bitmap fonts, and the deterministic `render(ctx, t, state)` entry.
 *
 * Must not depend on any other @pixcue package or on a UI framework.
 */
export * from './canvas.ts';
export * from './color.ts';
export * from './math.ts';

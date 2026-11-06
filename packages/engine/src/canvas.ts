/**
 * The small slice of the Canvas API the engine relies on. Browsers provide it
 * through `OffscreenCanvas` or `<canvas>`; tests provide it through a Node.js
 * canvas (see `@pixcue/engine/testing`).
 */
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** A canvas the engine can draw on and draw from. */
export interface Surface {
  width: number;
  height: number;
  getContext(contextId: '2d'): Ctx2D | null;
}

/** A surface that can also be passed to `drawImage`. */
export type DrawableSurface = Surface & CanvasImageSource;

export type CanvasFactory = (width: number, height: number) => DrawableSurface;

const browserFactory: CanvasFactory = (width, height) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

let factory: CanvasFactory = browserFactory;
const resetListeners = new Set<() => void>();

/**
 * Replaces how the engine creates offscreen canvases. Caches built on the old
 * factory are dropped. Tests call this once with a Node.js canvas.
 */
export function configureCanvas(next: CanvasFactory): void {
  factory = next;
  for (const reset of resetListeners) reset();
}

/** Registers a cache reset to run when the canvas factory changes. */
export function onCanvasConfigured(reset: () => void): void {
  resetListeners.add(reset);
}

/** Creates an offscreen canvas of at least 1×1 pixels. */
export function createSurface(width: number, height: number): DrawableSurface {
  return factory(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
}

/** Returns the 2D context of a surface, or throws if the platform has none. */
export function context2d(surface: Surface): Ctx2D {
  const ctx = surface.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  return ctx;
}

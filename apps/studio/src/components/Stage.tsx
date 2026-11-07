/**
 * The live preview. The canvas is rendered near its on-screen size, not the
 * export size, which keeps playback smooth on phones; layout is identical.
 */
import { type Bounds, render, scaleFrame } from '@pixcue/engine';
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { t } from '../i18n.ts';
import { touchDevice } from '../idle.ts';
import { displayTime } from '../playback.ts';
import { actions, edits, fontsVersion, frame, renderState } from '../store.ts';
import { platformUi, safeArea, stageBackground } from '../view.ts';
import { PlatformOverlay, SafeAreaOverlay } from './Overlays.tsx';

/** Preview frame rate on touch devices. */
const PREVIEW_FPS = 30;

/** Smallest preview resolution, as the frame's short side in pixels. */
const MIN_SHORT_SIDE = 720;

/** Arrow-key nudge, in design units (with Shift: the large one). */
const NUDGE = 10;
const NUDGE_LARGE = 50;

/** Extra hit area around the graphic for dragging, in CSS pixels. */
const GRAB_MARGIN = 16;

export function Stage(props: { hintId: string }) {
  const hintId = props.hintId;
  let box!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;
  const [space, setSpace] = createSignal({ w: 0, h: 0 });
  const [bounds, setBounds] = createSignal<Bounds | null>(null);
  const [dragging, setDragging] = createSignal(false);

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSpace({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(box);
    onCleanup(() => observer.disconnect());
  });

  /** On-screen canvas size that fits the frame's aspect ratio into the space. */
  const size = createMemo(() => {
    const { w, h } = space();
    const aspect = frame().width / frame().height;
    const width = Math.max(0, Math.min(w, h * aspect));
    return { w: width, h: width / aspect };
  });

  // Draw at least MIN_SHORT_SIDE pixels on the short side and let the browser
  // scale down: a phone-sized preview would otherwise put the pixel theme on
  // its coarsest grid, where pops jump in one or two steps instead of easing.
  const output = createMemo(() => {
    const f = frame();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const floor =
      f.pixelWidth * Math.min(1, MIN_SHORT_SIDE / Math.min(f.pixelWidth, f.pixelHeight));
    const pixelWidth = Math.round(Math.min(f.pixelWidth, Math.max(size().w * dpr, floor)));
    return scaleFrame(f, Math.max(1, pixelWidth));
  });

  // Touch devices draw the preview at 30 frames per second: the export's
  // usual rate and the pixel theme's step, at half the work of 60.
  const previewTime = createMemo(() =>
    touchDevice ? Math.floor(displayTime() * PREVIEW_FPS) / PREVIEW_FPS : displayTime(),
  );

  // Resize and draw in one effect: with two, the draw could run first, see
  // the old canvas size and skip, leaving the stage blank until the next
  // change (a format switch while paused).
  createEffect(() => {
    fontsVersion();
    const f = output();
    if (canvas.width !== f.pixelWidth || canvas.height !== f.pixelHeight) {
      canvas.width = f.pixelWidth;
      canvas.height = f.pixelHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      setBounds(render(ctx, previewTime(), renderState(f)));
    } catch (error) {
      // A broken template must not take the editor down.
      console.error(error);
    }
  });

  /** CSS pixels per canvas pixel, and design units per CSS pixel. */
  const cssPerPixel = () => size().w / output().pixelWidth;
  const unitsPerCss = () => frame().width / Math.max(1, size().w);

  function hit(e: PointerEvent): boolean {
    const b = bounds();
    if (!b) return false;
    const s = cssPerPixel();
    return (
      e.offsetX >= b.x * s - GRAB_MARGIN &&
      e.offsetX <= (b.x + b.width) * s + GRAB_MARGIN &&
      e.offsetY >= b.y * s - GRAB_MARGIN &&
      e.offsetY <= (b.y + b.height) * s + GRAB_MARGIN
    );
  }

  let start: { x: number; y: number; offset: { x: number; y: number } } | null = null;

  const onPointerDown = (e: PointerEvent) => {
    if (!hit(e)) return;
    start = { x: e.clientX, y: e.clientY, offset: { ...edits().offset } };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!start) {
      (e.currentTarget as HTMLElement).style.cursor = hit(e) ? 'grab' : '';
      return;
    }
    const k = unitsPerCss();
    actions.setOffset({
      x: start.offset.x + (e.clientX - start.x) * k,
      y: start.offset.y + (e.clientY - start.y) * k,
    });
  };
  // Keyboard: arrows nudge the graphic (Shift for bigger steps), Home resets.
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? NUDGE_LARGE : NUDGE;
    const { x, y } = edits().offset;
    const to = {
      ArrowLeft: { x: x - step, y },
      ArrowRight: { x: x + step, y },
      ArrowUp: { x, y: y - step },
      ArrowDown: { x, y: y + step },
    }[e.key];
    if (e.key === 'Home') {
      e.preventDefault();
      actions.resetOffset();
    } else if (to) {
      e.preventDefault();
      actions.setOffset(to);
    }
  };

  const endDrag = () => {
    start = null;
    setDragging(false);
  };
  return (
    <div
      class="stage"
      ref={box}
      style={{ '--frame-aspect': `${frame().width} / ${frame().height}` }}
    >
      <div
        class={`stage-frame stage-bg-${stageBackground()}`}
        classList={{ dragging: dragging() }}
        style={{ width: `${size().w}px`, height: `${size().h}px` }}
        role="application"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a custom widget; arrow keys move the graphic.
        tabIndex={0}
        aria-label={t('editor.stage.label')}
        aria-describedby={hintId}
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDblClick={() => actions.resetOffset()}
      >
        <canvas ref={canvas} />
        <svg
          class="stage-overlay"
          viewBox={`0 0 ${frame().width} ${frame().height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <Show when={platformUi()}>
            <PlatformOverlay frame={frame()} />
          </Show>
          <Show when={safeArea()}>
            <SafeAreaOverlay frame={frame()} />
          </Show>
        </svg>
      </div>
    </div>
  );
}

/**
 * The live preview. The canvas is rendered at its on-screen size (not the
 * export size), which keeps playback smooth on phones; layout is identical.
 */
import { type Bounds, render, scaleFrame } from '@pixcue/engine';
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { t } from '../i18n.ts';
import { displayTime } from '../playback.ts';
import { actions, edits, fontsVersion, frame, renderState } from '../store.ts';
import { platformUi, safeArea, stageBackground } from '../view.ts';
import { PlatformOverlay, SafeAreaOverlay } from './Overlays.tsx';

/** Extra hit area around the graphic for dragging, in CSS pixels. */
const GRAB_MARGIN = 16;

export function Stage() {
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

  const output = createMemo(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.min(frame().pixelWidth, Math.round(size().w * dpr)));
    return scaleFrame(frame(), pixelWidth);
  });

  createEffect(() => {
    const f = output();
    canvas.width = f.pixelWidth;
    canvas.height = f.pixelHeight;
  });

  createEffect(() => {
    fontsVersion();
    const f = output();
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width !== f.pixelWidth) return;
    try {
      setBounds(render(ctx, displayTime(), renderState(f)));
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
        role="img"
        aria-label={t('editor.stage.label')}
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

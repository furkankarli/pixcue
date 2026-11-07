/**
 * The template library: one card per template with a live thumbnail in the
 * current format and theme. Thumbnails hold a mid-clip frame and play while
 * hovered or focused.
 */
import { type Frame, type RenderState, render, scaleFrame } from '@pixcue/engine';
import { TEMPLATES, type Template } from '@pixcue/templates';
import { createEffect, createSignal, For, onCleanup } from 'solid-js';
import { t } from '../i18n.ts';
import { touchDevice, whenIdle } from '../idle.ts';
import { actions, fontsVersion, frame, renderStateFor, state } from '../store.ts';

/** Card preview size in CSS pixels (16:9). */
const CARD_W = 208;
const CARD_H = 117;
/** Offscreen render width: enough detail for the zoomed-in crop (less on phones). */
const RENDER_WIDTH = touchDevice ? 640 : 960;

function Thumbnail(props: { template: Template; active: boolean }) {
  let canvas!: HTMLCanvasElement;
  const [time, setTime] = createSignal<number | null>(null);

  // Play while hovered: advance a local clock with requestAnimationFrame.
  let request = 0;
  const play = () => {
    let start = 0;
    const step = (now: number) => {
      start ||= now;
      const duration = state.edits[props.template.id]?.duration ?? props.template.duration;
      setTime(((now - start) / 1000) % (duration + 0.3));
      request = requestAnimationFrame(step);
    };
    request = requestAnimationFrame(step);
  };
  const stop = () => {
    cancelAnimationFrame(request);
    setTime(null);
  };
  onCleanup(stop);

  // Render the whole frame offscreen, then show a crop around the graphic so
  // cards stay legible. The crop comes from the mid-clip frame and stays put
  // while the card animates.
  const offscreen = document.createElement('canvas');
  let cancel: (() => void) | undefined;
  onCleanup(() => cancel?.());
  createEffect(() => {
    fontsVersion();
    const output = scaleFrame(frame(), RENDER_WIDTH);
    const rs = renderStateFor(props.template.id, output);
    const now = time();
    // Still cards redraw when the browser is idle; a playing card at once.
    cancel?.();
    if (now === null) cancel = whenIdle(() => draw(output, rs, null));
    else draw(output, rs, now);
  });

  function draw(output: Frame, rs: RenderState<unknown> | null, now: number | null) {
    const ctx = offscreen.getContext('2d');
    const view = canvas.getContext('2d');
    if (!rs || !ctx || !view) return;
    offscreen.width = output.pixelWidth;
    offscreen.height = output.pixelHeight;
    try {
      const crop = render(ctx, rs.duration / 2, rs);
      if (now !== null) render(ctx, now, rs);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(CARD_W * dpr);
      canvas.height = Math.round(CARD_H * dpr);
      // Crop with 12% padding, fitted into the card.
      const pad = Math.max(crop.width, crop.height) * 0.12;
      const sx = Math.max(0, crop.x - pad);
      const sy = Math.max(0, crop.y - pad);
      const sw = Math.min(output.pixelWidth - sx, crop.width + pad * 2);
      const sh = Math.min(output.pixelHeight - sy, crop.height + pad * 2);
      const k = Math.min(canvas.width / sw, canvas.height / sh);
      const dw = sw * k;
      const dh = sh * k;
      view.clearRect(0, 0, canvas.width, canvas.height);
      view.drawImage(
        offscreen,
        sx,
        sy,
        sw,
        sh,
        (canvas.width - dw) / 2,
        (canvas.height - dh) / 2,
        dw,
        dh,
      );
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <button
      type="button"
      class="template-card"
      aria-pressed={props.active}
      onClick={() => actions.setTemplate(props.template.id)}
      onPointerEnter={play}
      onPointerLeave={stop}
      onFocus={play}
      onBlur={stop}
    >
      <span class="template-thumb">
        <canvas ref={canvas} />
      </span>
      <span class="template-name">{t(props.template.name)}</span>
    </button>
  );
}

export function Library() {
  return (
    <div class="library">
      <For each={TEMPLATES}>
        {(tpl) => <Thumbnail template={tpl} active={state.template === tpl.id} />}
      </For>
    </div>
  );
}
